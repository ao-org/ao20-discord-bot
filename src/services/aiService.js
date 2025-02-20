const axios = require("axios");
require("dotenv").config();

const AI_API_KEY = process.env.AI_API_KEY;
const AI_API_URL = "https://api.anthropic.com/v1/messages";

async function summarizeChangelog(commitMessages) {
    try {
        const response = await axios.post(
            AI_API_URL,
            {
                model: "claude-2",
                max_tokens: 300,
                messages: [
                    {
                        role: "user",
                        content: `Genera un changelog claro, conciso y fácil de entender para los jugadores de Argentum Online. 
                                Evita términos técnicos complejos y explica los cambios de manera comprensible. 
                                Usa un estilo de lista estructurada con viñetas y, si es relevante, incluye un toque de inmersión en el mundo de fantasía de Argentum. 
                                Si hay arreglos de errores, indícalo claramente. Si hay nuevas funciones, destácalas. 
                                Aquí está la lista de cambios recientes: \n\n${commitMessages}`
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
        console.error("Claude AI summarization failed:", error.message);
        return null;
    }
}

async function generateStaffResponse(messages) {
    try {
        const response = await axios.post(
            AI_API_URL,
            {
                model: "claude-2",
                max_tokens: 400,
                messages: [
                    {
                        role: "user",
                        content: `Usted es un sabio del mundo de Argentum Online que se comunica con los jugadores. 
                        Responde con información útil, mezclando fantasía con explicaciones técnicas. 
                        Aquí están los mensajes recientes: ${messages}. Nombre a los usuarios.`
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
        console.error("Claude AI staff response failed:", error.message);
        return null;
    }
}

module.exports = { summarizeChangelog, generateStaffResponse };
