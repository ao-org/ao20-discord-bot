const { SuccessEmbed, ErrorEmbed } = require("../embeds");
const { fetchChangelog } = require("../services/githubService");
const { summarizeChangelog } = require("../services/aiService");

const REPOSITORIES = [
    { name: "Assets", repo: "ao-org/argentum-online-assets" },
    { name: "Server", repo: "ao-org/argentum-online-server" },
    { name: "Client", repo: "ao-org/argentum-online-client" }
];

async function sendChangelog(channel) {
    let changelogEmbeds = [];

    for (const { name, repo } of REPOSITORIES) {
        const changelog = await fetchChangelog(repo);
        if (changelog) {
            const summary = await summarizeChangelog(changelog.commitMessages);
            
            //Improve this so it does look properly and not like this 2025-02-14T02:22:28Z
            changelog.previousTagDate = new Date(changelog.previousTagDate).toLocaleDateString('es');
            changelog.latestTagDate = new Date(changelog.latestTagDate).toLocaleDateString('es');

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
        }
    }

    changelogEmbeds.forEach(embed => channel.send(embed));
}

module.exports = {
    name: "changelog",
    description: "Muestra los últimos cambios de los repositorios.",
    async execute(message) {
        sendChangelog(message.channel);
    }
};
