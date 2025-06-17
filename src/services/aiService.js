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
                                Aquí está la lista de cambios recientes: \n\n${commitMessages}`,
          },
        ],
      },
      {
        headers: {
          "x-api-key": AI_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
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
        model: "claude-3-opus-20240229",
        max_tokens: 400,
        messages: [
          {
            role: "user",
            content: `Eres un experto técnico del mundo de Argentum Online que actúa como puente entre la comunidad y el código. 
Tu rol es explicar con precisión técnica cómo funciona el juego por dentro, incluyendo detalles del servidor (https://github.com/ao-org/argentum-online-server) y del cliente (https://github.com/ao-org/argentum-online-client).

Usa un lenguaje claro y profesional. Sé directo, conciso y riguroso. Si es necesario, cita funciones específicas, rutas de archivos, estructuras de datos o flujos de red. 
No te limites a explicaciones superficiales: ayuda a desarrolladores y usuarios avanzados a comprender cómo extender, depurar o contribuir al proyecto. 
Usa los nombres de los jugadores/usuarios en los mensajes y responde directamente a sus preguntas.

Mensajes recientes: ${messages}`
          }
        ]
      },
      {
        headers: {
          "x-api-key": AI_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        }
      }
    );

    const content = response.data?.content?.[0]?.text;
    return content ? content.trim() : null;
  } catch (error) {
    console.error("Claude AI staff response failed:", error.response?.data || error.message);
    return null;
  }
}


module.exports = { summarizeChangelog, generateStaffResponse };
