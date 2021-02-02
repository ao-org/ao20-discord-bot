require("dotenv").config();
const db = require("./db");

const { Client, MessageEmbed } = require("discord.js");
const client = new Client();

const { getRandomElement } = require("./utils");

const prefix = "/";
const env = process.env.NODE_ENV;

const errorMessages = ["Iba por las afueras de Ulla y me mataron 👻"];

const errorEmbed = new MessageEmbed().setColor("RED");
const successEmbed = new MessageEmbed().setColor("GREEN");

const onReady = () => {
  console.log(`BOT ${client.user.tag} conectado correctamente.`);
  console.log(new Date());
};

const onMessage = async (message) => {
  const { content, channel, author } = message;

  try {
    if (content.startsWith(prefix)) {
      const command = content.replace("/", "");

      if (command === "online") {
        const { value: onlineCount } = await db("statistics").select("value").where("name", "online").first();

        channel.send(`Hay **${onlineCount}** usuarios conectados en el servidor.`);
      } else if (command === "record") {
        const { value: onlineRecord } = await db("statistics").select("value").where("name", "record").first();

        const embed = successEmbed.setTitle(
          `:crossed_swords: ${onlineRecord} es el record de usuarios conectados a la vez.`
        );

        channel.send(embed);
      }
    }
  } catch (err) {
    console.log(author);
    const embed = errorEmbed
      .setTitle(`${getRandomElement(errorMessages)}`)
      .setDescription(":x: ¡Ocurrió un error! Consulte a un administrador");
    channel.send(embed);
    console.error(err);
  }
};

client.on("ready", onReady);
client.on("message", onMessage);

client.login(process.env.BOT_TOKEN);
