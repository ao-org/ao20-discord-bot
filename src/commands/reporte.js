const { SuccessEmbed, ErrorEmbed } = require("../embeds");
const { emoji } = require("../utils");
const http =  require("https")

module.exports = {
  name: "reporte",
  description: "Obtiene reporte de evolucion de personajes.",
  async execute(message, args) {
    const { channel } = message;
    const url = 'https://estadisticas.ao20.com.ar/produccion/reports.php?last=true&dir=reports'

    http.get(url, res => {

        let rawData = ''

        res.on('data', chunk => {
            rawData += chunk
        })
        
        res.on('end', () => {
          let report = response.replace("\r\n", "");
          report = report.replace("\\", "")
          const reportJson = JSON.parse(report);

          channel.send(
            new SuccessEmbed()
                  .setTitle(`${emoji()} ${reportJson} `)
                  .setFooter("Ver todos: https://estadisticas.ao20.com.ar/produccion/reports.php?dir=reports")
          );
        })

    })


    // axios.get('https://estadisticas.ao20.com.ar/produccion/reports.php?last=true&dir=reports')
    //   .then(function (response) {
    //     let report = response.replace("\r\n", "");
    //     report = report.replace("\\", "")
    //     const reportJson = JSON.parse(report);


    //     channel.send(
    //       new SuccessEmbed().setTitle(`${emoji()} ${reportJson} `)
    //     );

    //   })
    //   .catch(function (error) {
    //     // handle error
    //     channel.send(
    //       new ErrorEmbed().setTitle(`Error al obtener reporte ${error}`)
    //     );
    //   })
  },
};
