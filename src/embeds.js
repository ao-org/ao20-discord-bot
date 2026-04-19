const { EmbedBuilder } = require("discord.js");
class ErrorEmbed extends EmbedBuilder {
  constructor() {
    super();
    this.setColor(0xFF0000);
  }
}
class SuccessEmbed extends EmbedBuilder {
  constructor() {
    super();
    this.setColor(0x57F287);
  }
}

module.exports = { ErrorEmbed, SuccessEmbed };
