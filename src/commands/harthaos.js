const db = require("../db");
const { SuccessEmbed } = require("../embeds");
const { emoji } = require("../utils");

module.exports = {
  name: "harthaos",
  description: "El mejor.",
  execute(message, args) {
    const data = [];
    const commands = message.client.commands;
    const { channel } = message;

    if (!args.length) {
      data.push("HarThaoS es el mejor");   

      return channel.send(data);
    }
}
};
