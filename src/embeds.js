const { MessageEmbed } = require("discord.js");

class ErrorEmbed extends MessageEmbed {
  constructor() {
    super();
    this.setColor("RED");
  }
}

class SuccessEmbed extends MessageEmbed {
  constructor() {
    super();
    this.setColor("GREEN");
  }
}

module.exports = { ErrorEmbed, SuccessEmbed };
