
const { EmbedBuilder } = require("discord.js");

class ErrorEmbed extends EmbedBuilder {
  constructor() {
    super();
    this.setColor(0xFF0000); // RED
  }
}

class SuccessEmbed extends EmbedBuilder {
  constructor() {
    super();
    this.setColor(0x00FF00); // GREEN
  }
}

module.exports = { ErrorEmbed, SuccessEmbed };
