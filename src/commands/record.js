const db = require("../db");
const { SuccessEmbed } = require("../embeds");
const { emoji } = require("../utils");

module.exports = {
  name: "record",
  description: "Muestra el record de usuarios online en el servidor.",
  async execute(message, args) {
    const { channel } = message;

    const { value: onlineRecord } = await db("statistics").select("value").where("name", "record").first();
    channel.send(
      new SuccessEmbed().setTitle(`${emoji()} ${onlineRecord} es el record de usuarios conectados a la vez.`)
    );
  },
};