const { SuccessEmbed, ErrorEmbed } = require("../embeds");
const axios = require("axios");
require("dotenv").config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const AI_API_KEY = process.env.AI_API_KEY; // Claude API Key

const REPOSITORIES = [
    { name: "Assets", repo: "ao-org/argentum-online-assets" },
    { name: "Server", repo: "ao-org/argentum-online-server" },
    { name: "Client", repo: "ao-org/argentum-online-client" }
];

const HEADERS = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json" // Ensure API v3 support
};

// Fetch the latest two tags and their creation dates
async function fetchLatestTags(repo) {
    try {
        const response = await axios.get(`https://api.github.com/repos/${repo}/tags`, { headers: HEADERS });

        if (!response.data.length) {
            console.warn(`⚠️ No tags found for ${repo}.`);
            return null;
        }

        const tags = await Promise.all(
            response.data.slice(0, 2).map(async (tag) => {
                try {
                    const commitResponse = await axios.get(tag.commit.url, { headers: HEADERS });
                    return {
                        name: tag.name,
                        date: commitResponse.data.commit.committer.date
                    };
                } catch (error) {
                    console.warn(`⚠️ Could not fetch commit for ${tag.name} in ${repo}: ${error.message}`);
                    return { name: tag.name, date: "Unknown Date" };
                }
            })
        );

        return tags.length >= 2 ? tags : null;
    } catch (error) {
        console.error(`Failed to fetch tags for ${repo}:`, error.response?.data || error.message);
        return null;
    }
}

// Fetch commit messages between two tags
async function fetchChangelog(repo) {
    const tags = await fetchLatestTags(repo);
    if (!tags) {
        console.warn(`⚠️ Skipping changelog for ${repo} (No tags available)`);
        return null;
    }

    const [latestTag, previousTag] = tags;

    try {
        const response = await axios.get(`https://api.github.com/repos/${repo}/compare/${previousTag.name}...${latestTag.name}`, { headers: HEADERS });

        const commitMessages = response.data.commits.map(commit => `- ${commit.commit.message}`).join("\n");

        return {
            repoName: repo.split("/")[1],
            previousTag: previousTag.name,
            previousTagDate: previousTag.date,
            latestTag: latestTag.name,
            latestTagDate: latestTag.date,
            commitMessages
        };
    } catch (error) {
        console.warn(`⚠️ No comparison available for ${repo} (${previousTag.name} → ${latestTag.name}): ${error.message}`);
        return null;
    }
}

// Use AI to create a player-friendly changelog
async function summarizeWithClaude(commitMessages) {
    try {
        const response = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
                model: "claude-2",
                max_tokens: 300,
                messages: [
                    {
                        role: "user",
                        content: `Redacta un changelog para que todos los jugadores puedan entender los cambios recientes en el juego. 
                        Usa un lenguaje claro y accesible, evitando términos técnicos. Integra un ligero toque de inmersión en el mundo de fantasía sin convertirlo en una historia. 
                        Aquí están los cambios recientes: ${commitMessages}. 
                        Transforma esta lista en un changelog claro y estructurado, usando viñetas para cada cambio. Asegúrate de que sea fácil de leer y comprensible para jugadores sin conocimientos técnicos.`
                    }
                ]
            },
            {
                headers: {
                    "x-api-key": AI_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.content[0].text.trim();
    } catch (error) {
        console.error("Claude AI summarization failed:", error.response?.data || error.message);
        return null;
    }
}

// Send the changelog to the Discord channel
async function sendChangelog(channel) {
    let changelogEmbeds = [];

    for (const { name, repo } of REPOSITORIES) {
        const changelog = await fetchChangelog(repo);
        if (changelog && changelog.commitMessages) {
            const summary = await summarizeWithClaude(changelog.commitMessages);
            
            changelogEmbeds.push(
                new SuccessEmbed()
                    .setColor(0x3f0e3e)
                    .setTitle(`📌 **${changelog.repoName}** (${changelog.previousTag} → ${changelog.latestTag})`)
                    .setURL(`https://github.com/${repo}/compare/${changelog.previousTag}...${changelog.latestTag}`)
                    .setDescription(summary || "No summary available.")
                    .addFields(
                        { name: "📅 Fecha de versión anterior", value: changelog.previousTagDate, inline: true },
                        { name: "📅 Fecha de última versión", value: changelog.latestTagDate, inline: true }
                    )
                    .setTimestamp()
            );
        } else {
            console.warn(`⚠️ No changelog available for ${name}.`);
        }
    }

    if (changelogEmbeds.length > 0) {
        changelogEmbeds.forEach(embed => channel.send(embed));
    } else {
        channel.send(new ErrorEmbed().setTitle("Error").setDescription("No changelogs available."));
    }
}

// Export the Discord bot command
module.exports = {
    name: "changelog",
    description: "Muestra los últimos cambios de los repositorios.",
    async execute(message, args) {
        const { channel } = message;

        // Ensure it's in the right channel
        if (channel.id !== "1031483686828384276") {
            return channel.send(
                new ErrorEmbed()
                    .setTitle("Error")
                    .setDescription("Este comando solo se puede usar en el canal de changelogs.")
            );
        }

        sendChangelog(channel);
    },
};
