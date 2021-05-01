const { prefix } = require("../config.json");

module.exports = {
  name: "ayuda",
  description: "Lista todos los comandos.",
  execute(message, args) {
    const data = [];
    const commands = message.client.commands;
    const { channel } = message;

    if (!args.length) {
      data.push("Acá hay una lista de mis comandos:");
      data.push(
        commands
          .map((command) => `\`${prefix}${command.name}\`\n`)
          .join(",")
          .replace(/,/g, "")
      );
      data.push(`Podés enviar \`${prefix}ayuda {comando}\` para recibir información sobre un comando específico.`);

      return channel.send(data);
    }

    const name = args[0].toLowerCase();
    const command = commands.get(name);

    if (!command) {
      return message.reply(`El comando \`${prefix}${args[0]}\` no existe.`);
    }

    data.push(`**Nombre:** \`${command.name}\``);
    if (command.description) data.push(`**Descripción:** ${command.description}`);

    channel.send(data, { split: true });
  },
};
