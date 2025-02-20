const axios = require("axios");
require("dotenv").config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const HEADERS = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json"
};

// Fetch latest two tags and their creation dates
async function fetchLatestTags(repo) {
    try {
        const response = await axios.get(`https://api.github.com/repos/${repo}/tags`, { headers: HEADERS });

        if (!response.data.length) return null;

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
        console.error(`Failed to fetch tags for ${repo}:`, error.message);
        return null;
    }
}

// Fetch commit messages between two tags
async function fetchChangelog(repo) {
    const tags = await fetchLatestTags(repo);
    if (!tags) return null;

    const [latestTag, previousTag] = tags;

    try {
        const response = await axios.get(
            `https://api.github.com/repos/${repo}/compare/${previousTag.name}...${latestTag.name}`,
            { headers: HEADERS }
        );

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
        console.warn(`⚠️ No comparison available for ${repo}: ${error.message}`);
        return null;
    }
}

module.exports = { fetchLatestTags, fetchChangelog };
