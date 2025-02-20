require("dotenv").config();
const fs = require("fs");
const { Client, Collection } = require("discord.js");
const { sendReport, getLastReport } = require("./commands/reporte");
const { handleStaffResponse } = require("./commands/aibot");
const { ErrorEmbed, SuccessEmbed } = require("./embeds");
const { prefix } = require("./config.json");

const client = new Client();
client.commands = new Collection();

const commandFiles = fs.readdirSync("./src/commands").filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

const allowedChannels = process.env.ALLOWED_CHANNELS_IDS.split(",");
const errorMessages = [":x: ¡Ups! Algo falló"];

const user_db = {};

const onMessage = async (message) => {
  const { content, channel, author } = message;

  // React to messages in the "sugerencias" channel
  if (channel.id == 800427885089390602) {
    await message.react("✅");
    await message.react("❌");
  }

  try {
    if (message.guild != null && !author.bot) {
      const timestamp = Date.now();

      // Check if user is muted
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

    const command = client.commands.get(commandName);
    command.execute(message, args);
  } catch (err) {
    channel.send(new ErrorEmbed().setTitle(":x: ¡Ocurrió un error! Consulte a un administrador."));
    console.error(err);
  }
};

// Store last report data to avoid duplicates
let lastReportRawData = "";

const onReady = async () => {
  console.log(`BOT ${client.user.tag} conectado correctamente.`);
  console.log(new Date());

  // **REPORTS AUTOMATION (Every 15 minutes)**
  setInterval(async () => {
    client.channels.fetch("1031483686828384276")
      .then(async (channel) => {
        const report = await getLastReport();
        if (JSON.stringify(report.data) !== lastReportRawData) {
          lastReportRawData = JSON.stringify(report.data);
          sendReport(channel);
        }
      })
      .catch(console.error);
  }, 900000); // **Every 15 minutes**

  // **AI BOT AUTOMATION (Every 1 hour)**
  const generalChannel = "761237314818408449";
  setInterval(async () => {
    client.channels.fetch(generalChannel)
      .then(async (channel) => {
        handleStaffResponse(channel)
      })
      .catch(console.error);
  }, 3600000); // **Every 1 hour**
};

client.on("ready", onReady);
client.on("message", onMessage);
client.on("messageUpdate", onMessage);

client.login(process.env.BOT_TOKEN);
