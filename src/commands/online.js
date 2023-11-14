const db = require("../db");
const { SuccessEmbed } = require("../embeds");
const { emoji } = require("../utils");

module.exports = {
  name: "online",
  description: "Muestra cuántos usuarios online hay en el servidor.",
  async execute(message, args) {
    const { channel } = message;

    // const { online_user_count } = await db("service_status").select("online_user_count").first();
    channel.send(new SuccessEmbed().setTitle(`${emoji()} Comando deprecado, por favor utilizar el bot de SteamDB. Comando /players`));
  },
};
