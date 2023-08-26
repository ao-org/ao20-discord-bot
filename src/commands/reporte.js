const { SuccessEmbed, ErrorEmbed } = require("../embeds");
const axios = require('axios');
const url = 'http://estadisticas.ao20.com.ar/produccion/reports.php?last=true&dir=reports'

async function getLastReport() {
  const auth = {
    username: process.env.BASIC_AUTH_ESTADISTICAS_USERNAME,
    password: process.env.BASIC_AUTH_ESTADISTICAS_PASSWORD
  };

  const { data } = await axios.get(url, { auth })
  const users = Object.keys(data.Reports);
  const accountReports = Object.keys(data.AccountReports);

  return { data, users, accountReports };
}

async function sendReport(channel, data) {
  const report = await getLastReport();
  const footer = `${report.data.DBData.EndDB} - ${report.data.DBData.StartDB}`

  channel.send(
    new SuccessEmbed()
      .setColor(0x3f0e3e)
      .setTitle("Oro total del mundo (no incluye valor de items)")
      .setURL('http://estadisticas.ao20.com.ar/produccion/reports.php?dir=reports')
      .addFields({ name: 'Inflacion', value: report.data.Gold })
      .setTimestamp()
      .setFooter(footer)
  );

  if (report.data.Reports != "There are no reports") {
    report.users.forEach((user) => {    
      channel.send(
        new SuccessEmbed()
          .setColor(report.data.Reports[user].Errors ? 0xf91d09 : 0xc9ea10)
          .setTitle(`${user}`)
          .setURL('http://estadisticas.ao20.com.ar/produccion/reports.php?dir=reports')
          .addFields(
            { name: 'AccId', value: report.data.Reports[user].AccID, inline: true },
            { name: 'BaseLevel', value: report.data.Reports[user].BaseLevel, inline: true },
            { name: 'CharID', value: report.data.Reports[user].CharID, inline: true },
          )
          .addFields({ name: 'Warnings', value: report.data.Reports[user].Warnings ? report.data.Reports[user].Warnings : 'No hay warnings' })
          .addFields({ name: 'Errors', value: report.data.Reports[user].Errors ? report.data.Reports[user].Errors : 'No hay errores' })
          .setTimestamp()
          .setFooter(footer)
      );
    });
  }

  if (report.data.AccountReports != "There are no reports") {
    report.accountReports.forEach((account) => {
      channel.send(
        new SuccessEmbed()
          .setColor(0xf44ede)
          .setTitle(`Cuenta ID: ${report.data.AccountReports[account].AccID}`)
          .setURL('http://estadisticas.ao20.com.ar/produccion/reports.php?dir=reports')
          .addFields({ name: 'Warnings', value: report.data.AccountReports[account].Warnings ? report.data.AccountReports[account].Warnings : 'No hay warnings' })
          .addFields({ name: 'Errors', value: report.data.AccountReports[account].Errors ? report.data.AccountReports[account].Errors : 'No hay errores' })
          .setTimestamp()
          .setFooter(footer)
      );
    });
  }

}

module.exports = {
  sendReport,
  getLastReport,
  name: "reporte",
  description: "Obtiene reporte de evolucion de personajes.",
  async execute(message, args) {
    const { channel } = message;
  
    // Check if the message is from the specific channel ID
    if (channel.id !== "1031483686828384276") {
      return channel.send(
        new ErrorEmbed()
          .setTitle("Error")
          .setDescription("You can only use this command in the specific channel.")
      );
    }
  
    sendReport(channel);
  },
  
};
