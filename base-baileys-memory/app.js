const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
const MockAdapter = require('@bot-whatsapp/database/mock')
const path = require("path")
const fs = require("fs")

const menuPath = path.join(__dirname, "mensajes", "menu.txt")
const menu = fs.readFileSync(menuPath, "utf8")

const bienvenidaPath = path.join(__dirname, "mensajes", "bienvenida.txt")
const bienvenida = fs.readFileSync(bienvenidaPath, "utf8")

const flowWelcome = addKeyword([EVENTS.WELCOME])
    .addAnswer(bienvenida, {
        delay: 2000
    })

const flowActividadFisica = addKeyword(EVENTS.ACTION)
    .addAnswer('¡Aquí tienes tu plan de actividad física! 💪')
    .addAnswer('https://drive.google.com/file/d/1xNDEiCam-dkLis0bK_9iWdgY1dGH52oW/view?usp=sharing')

const flowPlanEstudio = addKeyword(EVENTS.ACTION)
    .addAnswer('¡Aquí tienes el enlace para acceder al plan! 📚')
    .addAnswer('https://www.notion.com/es')

const flowProgreso = addKeyword(EVENTS.ACTION)
    .addAnswer('¡Aquí tienes una imagen que describe el progreso de ambos! 😜🎯🔥', {
        media: 'https://i.pinimg.com/736x/c8/f9/b9/c8f9b9f72226fcadd1dd9079f22f6ab9.jpg'
    })

const menuFlow = addKeyword(['menu', "Menu"]).addAnswer(
    menu,
    { capture: true },
    async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
        if (!["1", "2", "3", "0"].includes(ctx.body)) {
            return fallBack(
                "¡Ups! 🚫 Esa no es una opción válida. Por favor, elige una de las opciones disponibles. 😊"
            );
        }
        switch (ctx.body) {
            case "1":
                return gotoFlow(flowActividadFisica);
            case "2":
                return gotoFlow(flowPlanEstudio);
            case "3":
                return gotoFlow(flowProgreso);
            case "0":
                return await flowDynamic(
                    "Saliendo... 👋 \n Escribe Menu para volver aquí. 😉"
                );
        }
    }
);



const salirFlow = addKeyword(['salir', 'chau', 'nv'])
    .addAnswer('¡Nos vemos! 👋')

const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowWelcome, menuFlow, salirFlow, flowActividadFisica, flowPlanEstudio, flowProgreso])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
