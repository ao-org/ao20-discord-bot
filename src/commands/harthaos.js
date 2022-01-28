const db = require("../db");
const { SuccessEmbed } = require("../embeds");
const { emoji } = require("../utils");

module.exports = {
  name: "harthaos",
  description: "El mejor.",
  async execute(message, args) {
    channel.send(
      new SuccessEmbed().setTitle(`HarThaoS es el mejor.`)
    );
  },
};
