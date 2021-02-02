require("dotenv").config();
const db = require("./db");

const { Client } = require("discord.js");
const client = new Client();

const prefix = "/";
const env = process.env.NODE_ENV;

const onReady = () => {
  console.log(`BOT ${client.user.tag} conectado correctamente.`);
  console.log(new Date());
};

const onMessage = async (message) => {
  const { content } = message;

  if (content.startsWith(prefix)) {
    const command = content.replace("/", "");

    if (command === "online") {
      try {
        const { value: onlineCount } = await db("statistics")
          .select("value")
          .where("name", "online")
          .first();

        message.channel.send(
          `Hay **${onlineCount}** usuarios conectados en el servidor.`
        );
      } catch (err) {
        message.channel.send(`Ha ocurrido un error.`);
        console.error(err);
      }
    }
  }
};

client.on("ready", onReady);
client.on("message", onMessage);

client.login(process.env.BOT_TOKEN);
