const { SuccessEmbed, ErrorEmbed } = require("../embeds");
const axios = require('axios').default;
const url = 'https://estadisticas.ao20.com.ar/produccion/reports.php?last=true&dir=reports'

async function getLastReport() {
  const axios = require('axios');

  const { data } = await axios.get(url);
  let users = Object.keys(data.Reports);
  return { data, users };
}

async function sendReport(channel, data) {
  const report = await getLastReport();

  report.users.forEach((user) => {
    channel.send(
      new SuccessEmbed()
        .setColor(0xeb34d2)
        .setTitle(`${user}`)
        .setURL('https://estadisticas.ao20.com.ar/produccion/reports.php?dir=reports')
        .addFields(
          { name: 'AccId', value: report.data.Reports[user].AccID, inline: true },
          { name: 'BaseLevel', value: report.data.Reports[user].BaseLevel, inline: true },
          { name: 'CharID', value: report.data.Reports[user].CharID, inline: true },
        )
        .addFields({ name: 'Warnings', value: report.data.Reports[user].Warnings })
        .setTimestamp()
    );

  });
}

module.exports = {
  sendReport,
  getLastReport,
  name: "reporte",
  description: "Obtiene reporte de evolucion de personajes.",
  async execute(message, args) {
    const { channel } = message;
    sendReport(channel);
  },
};
