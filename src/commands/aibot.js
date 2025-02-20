const { generateStaffResponse } = require("../services/aiService");
const Discord = require("discord.js");

async function handleStaffResponse(channel) {
    try {
        const oneHourAgo = Date.now() - 60 * 60 * 1000; // Time threshold: 1 hour ago
        let messages = [];
        let lastMessageId = null;

        // Fetch messages iteratively until we reach messages older than 1 hour
        while (true) {
            const fetchedMessages = await channel.messages.fetch({ limit: 100, before: lastMessageId });
            if (!fetchedMessages.size) break;

            // Filter messages within the last hour and remove bot messages
            const filteredMessages = fetchedMessages
                .filter(msg => msg.createdTimestamp >= oneHourAgo && !msg.author.bot)
                .map(msg => `${msg.author.username}: ${msg.content}`);

            messages = [...messages, ...filteredMessages];
            lastMessageId = fetchedMessages.last().id; // Update last message ID

            // Stop fetching if the oldest message is already beyond one hour
            if (fetchedMessages.last().createdTimestamp < oneHourAgo) break;
        }

        if (messages.length === 0) {
            return channel.send("No hay suficientes mensajes recientes para resumir.");
        }

        // Join messages and send them to AI for summarization
        const conversationSummary = messages.join("\n");
        const response = await generateStaffResponse(conversationSummary);

        if (response && response.trim()) {
            await channel.send(response);
        } else {
            console.warn("⚠️ AI returned an empty response.");
        }
    } catch (error) {
        console.error("❌ Error in handleStaffResponse:", error);
        channel.send("No pude generar una respuesta en este momento. Inténtalo más tarde.");
    }
}

module.exports = {
    name: "aibot",
    description: "El bot responde como un sabio de Argentum Online con un resumen de la última hora.",
    async execute(message) {
        handleStaffResponse(message.channel);
    }
};
