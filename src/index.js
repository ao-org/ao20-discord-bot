require("dotenv").config();
const db = require("./db");

const { Client, MessageEmbed } = require("discord.js");
const client = new Client();

const { getRandomElement } = require("./utils");

const prefix = "/";
const env = process.env.NODE_ENV;

const commandList = ["online", "record", "descargar"];

const errorMessages = ["Iba por las afueras de Ulla y me mataron 👻"];
const emojis = [":man_mage:", ":woman_mage:", ":crossed_swords:", ":boom:", ":fire:"];
const emoji = () => getRandomElement(emojis);

const errorEmbed = new MessageEmbed().setColor("RED");
const successEmbed = new MessageEmbed().setColor("GREEN");

const onReady = () => {
  console.log(`BOT ${client.user.tag} conectado correctamente.`);
  console.log(new Date());

  client.on("guildMemberAdd", (member) => updateMembers(member.guild));
  client.on("guildMemberRemove", (member) => updateMembers(member.guild));

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  updateMembers(guild);
};

const onMessage = async (message) => {
  const { content, channel, author } = message;

  try {
    if (content.startsWith(prefix)) {
      const command = content.replace("/", "").toLowerCase();

      if (commandList.find((cmd) => cmd === command)) {
        // User has entered a valid command
        if (channel.id != process.env.BOT_CHANNEL_ID) {
          const embed = errorEmbed
            .setTitle(`${getRandomElement(errorMessages)}`)
            .setDescription(`:x: Sólo respondo a comandos escritos en el canal <#${process.env.BOT_CHANNEL_ID}>.`);
          channel.send(embed);
          return;
        }
      }

      if (command === "online") {
        const { value: onlineCount } = await db("statistics").select("value").where("name", "online").first();

        const embed = successEmbed.setTitle(`${emoji()} Hay ${onlineCount} usuarios conectados en el servidor.`);
        channel.send(embed);
      } else if (command === "record") {
        const { value: onlineRecord } = await db("statistics").select("value").where("name", "record").first();

        const embed = successEmbed.setTitle(`${emoji()} ${onlineRecord} es el record de usuarios conectados a la vez.`);
        channel.send(embed);
      }
    }
  } catch (err) {
    const embed = errorEmbed
      .setTitle(`${getRandomElement(errorMessages)}`)
      .setDescription(":x: ¡Ocurrió un error! Consulte a un administrador.");
    channel.send(embed);

    console.error(err);
  }
};

const updateMembers = (guild) => {
  const channel = guild.channels.cache.get(process.env.MEMBERS_COUNT_CHANNEL_ID);

  const numbers = /d/i;
  channel.setName(channel.name.replace(numbers, guild.memberCount));
};

client.on("ready", onReady);
client.on("message", onMessage);

client.login(process.env.BOT_TOKEN);
