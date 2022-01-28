const db = require("../db");
const { SuccessEmbed } = require("../embeds");
const { emoji } = require("../utils");

module.exports = {
  name: "online",
  description: "Muestra cuántos usuarios online hay en el servidor.",
  async execute(message, args) {
    const { channel } = message;

    const { online: onlineCount } = await db("statistics").select("online").first();
    channel.send(new SuccessEmbed().setTitle(`${emoji()} Hay ${onlineCount} usuarios conectados en el servidor.`));
  },
};
