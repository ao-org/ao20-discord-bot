const { SuccessEmbed, ErrorEmbed } = require("../embeds");
const axios = require('axios');
require('dotenv').config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPOSITORIES = [
    { name: "Assets", repo: "ao-org/argentum-online-assets" },
    { name: "Server", repo: "ao-org/argentum-online-server" },
    { name: "Client", repo: "ao-org/argentum-online-client" }
];

async function fetchLatestTags(repo) {
    try {
        const response = await axios.get(`https://api.github.com/repos/${repo}/tags`, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });

        const tags = response.data.map(tag => tag.name);
        return tags.length >= 2 ? tags.slice(0, 2) : null;
    } catch (error) {
        console.error(`Failed to fetch tags for ${repo}:`, error.message);
        return null;
    }
}

async function fetchChangelog(repo) {
    const tags = await fetchLatestTags(repo);
    if (!tags) return null;

    const [latestTag, previousTag] = tags;
    try {
        const response = await axios.get(`https://api.github.com/repos/${repo}/compare/${previousTag}...${latestTag}`, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });

        const commits = response.data.commits.map(commit => `• **${commit.sha.substring(0, 7)}** - ${commit.commit.message}`).join("\n");

        return {
            title: `📌 **${repo.split('/')[1]}** (${previousTag} → ${latestTag})`,
            description: commits || "No new changes.",
            url: `https://github.com/${repo}/compare/${previousTag}...${latestTag}`
        };
    } catch (error) {
        console.error(`Failed to fetch changelog for ${repo}:`, error.message);
        return null;
    }
}

async function sendChangelog(channel) {
    let changelogEmbeds = [];

    for (const { name, repo } of REPOSITORIES) {
        const changelog = await fetchChangelog(repo);
        if (changelog) {
            changelogEmbeds.push(
                new SuccessEmbed()
                    .setColor(0x3f0e3e)
                    .setTitle(changelog.title)
                    .setURL(changelog.url)
                    .setDescription(changelog.description)
                    .setTimestamp()
            );
        } else {
            console.error(`No changelog available for ${name}.`);
        }
    }

    if (changelogEmbeds.length > 0) {
        changelogEmbeds.forEach(embed => channel.send(embed));
    } else {
        channel.send(new ErrorEmbed().setTitle("Error").setDescription("No changelogs available."));
    }
}

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
