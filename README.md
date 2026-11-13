# ao20-discord-bot

Official bot for Argentum 20 discord server.

## Difusión de noticias

Los mensajes enviados por integrantes con el rol `Staff` se republican en el canal
`1570162557203906600`, incluyendo texto, embeds y archivos adjuntos. Las menciones
se copian como texto y no generan notificaciones al republicar.

El canal de origen se configura con `DISCORD_NEWS_SOURCE_CHANNEL_ID` en `.env.local`
(o en las variables de entorno del despliegue). Por defecto usa
`1570155166311645306`. Solo se republican mensajes de Staff desde ese canal.

También activá el intent privilegiado **Message Content Intent** en Discord Developer
Portal y dale al bot permiso para ver el canal de origen y enviar mensajes, embeds y
archivos en el canal de noticias.
