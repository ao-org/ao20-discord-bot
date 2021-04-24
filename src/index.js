const fs = require("fs");
require("dotenv").config();
const { Client, Collection } = require("discord.js");
const { getRandomElement } = require("./utils");
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

const updateMembersCount = (guild) => {
  const channel = guild.channels.cache.get(process.env.MEMBERS_COUNT_CHANNEL_ID);
  const numbers = /\d+/g;
  channel.setName(channel.name.replace(numbers, guild.memberCount));
};

const onMessage = async (message) => {
  const { content, channel } = message;

  // Canal "sugerencias"
  if (channel.id == 800427885089390602) {
    await message.react("✅");
    await message.react("❌");
  }

  // Canal "bugs"
  if (channel.id == 773314521041207357) {
    await message.react("🙌");
    // await message.react("🇬");
    // await message.react("🇷");
    // await message.react("🇦");
    // await message.react("🇽");
  }

  try {
    if (!content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (!client.commands.has(commandName)) return;

    // Only allow commands to be written
    // on some channels to prevent spam
    if (!allowedChannels.find((ch) => ch == channel.id)) {
      return channel.send(
        new ErrorEmbed()
          .setTitle(`${getRandomElement(errorMessages)}`)
          .setDescription(
            `Sólo respondo a comandos escritos en ${
              allowedChannels.length == 1 ? "el canal" : "los canales"
            } ${allowedChannels.map((ch) => `<#${ch}>`)}`
          )
      );
    }

    const command = client.commands.get(commandName);
    command.execute(message, args);
  } catch (err) {
    channel.send(new ErrorEmbed().setTitle(":x: ¡Ocurrió un error! Consulte a un administrador."));

    console.error(err);
  }
};

const onReady = () => {
  console.log(`BOT ${client.user.tag} conectado correctamente.`);
  console.log(new Date());

  const guild = client.guilds.cache.get(process.env.GUILD_ID);

  updateMembersCount(guild);
};

client.on("ready", onReady);
client.on("message", onMessage);
client.on("guildMemberAdd", (member) => updateMembersCount(member.guild));
client.on("guildMemberRemove", (member) => updateMembersCount(member.guild));

client.login(process.env.BOT_TOKEN);
