const db = require("../db");
const { SuccessEmbed } = require("../embeds");
const { emoji } = require("../utils");

module.exports = {
  name: "record",
  description: "Muestra el record de usuarios online en el servidor.",
  async execute(message, args) {
    const { channel } = message;

    const { online_user_record  } = await db("service_status").select("online_user_record").first();
    channel.send(
      new SuccessEmbed().setTitle(`${emoji()} ${online_user_record} es el record de usuarios conectados a la vez.`)
    );
  },
};
