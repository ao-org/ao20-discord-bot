require("dotenv").config();
const fs = require("fs");
const { Client, Collection } = require("discord.js");
const { getRandomElement } = require("./utils");
const { sendReport, getLastReport } = require("./commands/reporte");
const { ErrorEmbed, SuccessEmbed } = require("./embeds");
const { prefix } = require("./config.json");

const client = new Client();
client.commands = new Collection();

const commandFiles = fs.readdirSync("./src/commands").filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.name, command);
}

const allowedChannels = process.env.ALLOWED_CHANNELS_IDS.split(",");
const errorMessages = [":x: ¡Ups! Algo falló"];

const user_db = {};

const updateMembersCount = (guild) => {
  const channel = guild.channels.cache.get(process.env.MEMBERS_COUNT_CHANNEL_ID);
  const numbers = /\d+/g;
  channel.setName(channel.name.replace(numbers, guild.memberCount));
};

const onMessage = async (message) => {
  const { content, channel, author } = message;

  // Canal "sugerencias"
  if (channel.id == 800427885089390602) {
    await message.react("✅");
    await message.react("❌");
  }

  try {
    if (message.guild != null && !author.bot) {
      const timestamp = Date.now();

      // Mute
      if (user_db[author.id] && user_db[author.id].muted_upto >= timestamp) {
        await message.delete();
        return author.send(
          new ErrorEmbed()
            .setTitle(`⛔ No podés enviar mensajes hasta: ${new Date(user_db[author.id].muted_upto).toLocaleTimeString('es')}`)
        );
      }
    }

    if (!content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (!client.commands.has(commandName)) return;

    // Only allow commands to be written
    // on some channels to prevent spam
    // if (!allowedChannels.find((ch) => ch == channel.id)) {
    //   return channel.send(
    //     new ErrorEmbed()
    //       .setTitle(`${getRandomElement(errorMessages)}`)
    //       .setDescription(
    //         `Sólo respondo a comandos escritos en ${allowedChannels.length == 1 ? "el canal" : "los canales"
    //         } ${allowedChannels.map((ch) => `<#${ch}>`)}`
    //       )
    //   );
    // }

    const command = client.commands.get(commandName);
    command.execute(message, args);
  } catch (err) {
    channel.send(new ErrorEmbed().setTitle(":x: ¡Ocurrió un error! Consulte a un administrador."));

    console.error(err);
  }
};

let lastReportRawData = "";

const onReady = async () => {
  console.log(`BOT ${client.user.tag} conectado correctamente.`);
  console.log(new Date());

  const guild = client.guilds.cache.get(process.env.GUILD_ID);

  updateMembersCount(guild);

  //Esto es para enviar al chat de discord los reportes de personajes
  setInterval(async () => {
    client.channels.fetch('867154125786185749')
    .then(async (channel) => {
      const report = await getLastReport();
      if (JSON.stringify(report.data) != lastReportRawData) {
        lastReportRawData = JSON.stringify(report.data)
        sendReport(channel);
      }
    })  
    .catch(console.error);
  }, 900000);

};

client.on("ready", onReady);
client.on("message", onMessage);
client.on("messageUpdate", onMessage);
client.on("guildMemberAdd", (member) => updateMembersCount(member.guild));
client.on("guildMemberRemove", (member) => updateMembersCount(member.guild));

client.login(process.env.BOT_TOKEN);
