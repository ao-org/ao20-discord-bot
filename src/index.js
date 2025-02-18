require("dotenv").config();
const fs = require("fs");
const { Client, Collection } = require("discord.js");
const { getRandomElement } = require("./utils");
const { sendReport, getLastReport } = require("./commands/reporte");
const { sendChangelog } = require("./commands/changelog");  // Import Changelog Function
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

// Store last report and changelog data to avoid duplicates
let lastReportRawData = "";
let lastChangelogData = "";

const onReady = async () => {
  console.log(`BOT ${client.user.tag} conectado correctamente.`);
  console.log(new Date());

  // **REPORTS AUTOMATION (Every 15 minutes)**
  setInterval(async () => {
    client.channels.fetch('1031483686828384276')
      .then(async (channel) => {
        const report = await getLastReport();
        if (JSON.stringify(report.data) !== lastReportRawData) {
          lastReportRawData = JSON.stringify(report.data);
          sendReport(channel);
        }
      })
      .catch(console.error);
  }, 900000); // **Every 15 minutes**

  // **CHANGELOG AUTOMATION (Every 1 hour)**
  setInterval(async () => {
    client.channels.fetch('1031483686828384276')
      .then(async (channel) => {
        let changelogData = "";
        
        // Fetch changelog for all repositories
        for (const { name, repo } of [
          { name: "Assets", repo: "ao-org/argentum-online-assets" },
          { name: "Server", repo: "ao-org/argentum-online-server" },
          { name: "Client", repo: "ao-org/argentum-online-client" }
        ]) {
          const changelog = await sendChangelog(channel, true); // Fetch without sending
          if (changelog) changelogData += JSON.stringify(changelog);
        }

        // Only post if there are new updates
        if (changelogData !== lastChangelogData) {
          lastChangelogData = changelogData;
          sendChangelog(channel);
        }
      })
      .catch(console.error);
  }, 3600000); // **Every 1 hour**
};

client.on("ready", onReady);
client.on("message", onMessage);
client.on("messageUpdate", onMessage);

client.login(process.env.BOT_TOKEN);
