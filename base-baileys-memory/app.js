// const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require(@bot-whatsapp/bot')
import pkg from '@bot-whatsapp/bot'
const { createBot, createProvider, createFlow, addKeyword, EVENTS } = pkg
// require("dotenv").config()
import dotenv from 'dotenv'
dotenv.config()
// const QRPortalWeb = require('@bot-whatsapp/portal')
import QRPortalWeb from '@bot-whatsapp/portal'
// const BaileysProvider = require('@bot-whatsapp/provider/baileys')
import BaileysProvider from '@bot-whatsapp/provider/baileys'
// const MockAdapter = require('@bot-whatsapp/database/mock')
// const MongoAdapter = require('@bot-whatsapp/database/mongo')
import MongoAdapter from '@bot-whatsapp/database/mongo'
// const path = require("path")
import path from "path"
// const fs = require("fs")
import fs from "fs"

import { llama } from './ollama.js'
import { delay } from '@adiwajshing/baileys'
import { generarImagen } from './lcm-lora.js'
import { assemblyAI } from './assembly-ai.js'
import { huggingFace } from './huggingface.js'
import { appendToSheet, readSheet, editSheetCellsByIds, deleteSheetRowById } from './google-sheets.js'

const __dirname = import.meta.dirname

const bienvenidaPath = path.join(__dirname, "mensajes", "bienvenida.txt")
const bienvenida = fs.readFileSync(bienvenidaPath, "utf8")

const bienvenidaMenuPath = path.join(__dirname, "mensajes", "bienvenida-menu.txt")
const bienvenidaMenu = fs.readFileSync(bienvenidaMenuPath, "utf-8")

const flowWelcome = addKeyword(['Marubot'])
    .addAction(async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, `Hola ${ctx.pushName}`)
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, 'Escribe Menú 📜 para ver todas las opciones disponibles.')
        } else {
            await ctxFn.flowDynamic(bienvenida)
            await ctxFn.flowDynamic('Escribe Menú 📜 para ver todas las opciones disponibles.')
        }
    })

const flowMenu = addKeyword(['menu', 'menú', 'Menú'])
    .addAction(async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, bienvenidaMenu)
        } else {
            await ctxFn.flowDynamic(bienvenidaMenu)
        }
    })

const flowTracker = addKeyword('tracker')
    .addAction(async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, 'Por el momento, solo se pueden registrar actividades por privado 😞')
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, 'Recuerda que puedes consultar las actividades con *Track* 🧠📲')
            await ctxFn.flowDynamic('Intenta por acá 🤠')
            return
        } else {
            return await ctxFn.gotoFlow(flowTrackerRegistro)
        }
    })

const flowTrackerRegistro = addKeyword(EVENTS.ACTION)
    .addAnswer('Dame una descripción breve de la actividad que quieras guardar 📝', { capture: true }, async (ctx, ctxFn) => {
        await ctxFn.state.update({ nombre: ctx.pushName, descripcion: ctx.body, estado: '🟡' })
    })
    .addAnswer(
        [
            '¿Cuál es la fecha límite para completarlo? 📅⏳\n',
            '👉 Ej: "30 de abril", "15 mayo", "01/06"'
        ],
        { capture: true },
        async (ctx, { state, fallBack, flowDynamic }) => {
            const fecha = ctx.body.trim()
            await state.update({ fecha })
        }
    )
    .addAction(async (ctx, ctxFn) => {
        const nombre = ctxFn.state.get("nombre")
        const descripcion = ctxFn.state.get("descripcion")
        const estado = ctxFn.state.get("estado")
        const fecha = ctxFn.state.get("fecha")

        const respuesta = await appendToSheet([nombre, descripcion, fecha, estado])

        if (!respuesta || respuesta.statusText !== 'OK') {
            await ctxFn.flowDynamic('Ups… algo salió mal. Intenta de nuevo más tarde! ⏳')
        } else {
            await ctxFn.state.clear()
        }
    })
    .addAnswer(['Actividad registrada ✅'])
    .addAnswer(['Recuerda que puedes consultar las actividades con *Track* 🧠📲'])

const flowTrackerCompletar = addKeyword('Completar')
    .addAction(async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage

        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, 'Por el momento, solo se pueden completar actividades por privado 😞')
        } else {
            return await ctxFn.gotoFlow(flowTrackerCompletarActividad)
        }
    })

const flowTrackerCompletarActividad = addKeyword(EVENTS.ACTION)
    .addAnswer(`Escribe los 🆔 que quieras marcar como completados ✅`)
    .addAnswer([`👉 Ej: Z4, P2 y C2`, `👉 Ej: z4,p2 y C2`, `👉 Ej: Z4 P2 C2`])
    .addAction({ capture: true }, async (ctx, ctxFn) => {
        const codigosSinFormatear = ctx.body

        // Extraer todos los códigos con formato letra+numero, sin importar separadores
        const codigosFormateados = codigosSinFormatear
            .toUpperCase()
            .match(/[A-Z]\d+/g) || []

        await ctxFn.state.update({ codigosDetectados: codigosFormateados })

        await ctxFn.flowDynamic([
            `🆔 detectados: ${codigosFormateados.join(', ')}`,
            `Son correctos? (Sí/No) 🤔`
        ])
    })
    .addAction({ capture: true }, async (ctx, ctxFn) => {
        const respuesta = ctx.body.trim().toLowerCase()
        const esConfirmacion = ['si', 'sí', 's'].includes(respuesta)
        const esNegacion = ['no', 'n'].includes(respuesta)

        if (esConfirmacion) {
            const codigosConfirmados = ctxFn.state.get('codigosDetectados')
            await ctxFn.flowDynamic(`✅ Trabajando con los siguientes códigos: ${codigosConfirmados.join(', ')} `)
            const resultado = await editSheetCellsByIds(codigosConfirmados)
            if (resultado.ok) {
                await ctxFn.flowDynamic(`✅ Se actualizaron ${resultado.cantidad} actividades.`)
            } else {
                await ctxFn.flowDynamic('❌ Hubo un error al actualizar las actividades. Intenta más tarde.')
            }

        } else if (esNegacion) {
            await ctxFn.flowDynamic('Vamos de nuevo entonces 🔁')
            return ctxFn.gotoFlow(flowTrackerCompletarActividad)
        } else {
            await ctxFn.flowDynamic('No entendí tu respuesta 🤔 Por favor escribí "sí" o "no"')
            return ctxFn.gotoFlow(flowTrackerCompletarActividad)
        }
    })

const flowTrackerEliminar = addKeyword('Eliminar')
    .addAction(async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        await ctxFn.globalState.update({ usuarioActivo: ctx.pushName })
        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, 'Por el momento, solo se pueden eliminar actividades por privado 😞')
        } else {
            return await ctxFn.gotoFlow(flowTrackerEliminarActividad)
        }
    })

const flowTrackerEliminarActividad = addKeyword(EVENTS.ACTION)
    .addAnswer('Escribe el 🆔 que quieres eliminar 🗑️', { capture: true }, async (ctx, ctxFn) => {
        const codigosFormateados = ctx.body
            .toUpperCase()
            .match(/[A-Z]\d+/g) || []

        if (codigosFormateados.length !== 1) {
            await ctxFn.flowDynamic([
                '❌ Solo se puede eliminar una actividad a la vez.',
                'Por favor, escribí un único ID como por ejemplo: L1, E3, O0'
            ])
            return ctxFn.fallBack()
        }

        const codigo = codigosFormateados[0]
        await ctxFn.state.update({ codigoDetectado: codigo })

        await ctxFn.flowDynamic([
            `🆔 detectado: ${codigo}`,
            `¿Seguro que querés eliminar esta actividad? (Sí/No) ❌`
        ])
    })
    .addAction({ capture: true }, async (ctx, ctxFn) => {
        const respuesta = ctx.body.trim().toLowerCase()
        const esConfirmacion = ['si', 'sí', 's'].includes(respuesta)
        const esNegacion = ['no', 'n'].includes(respuesta)

        if (esConfirmacion) {
            const codigo = ctxFn.state.get('codigoDetectado')
            await ctxFn.flowDynamic(`🗑️ Eliminando actividad con ID: ${codigo}`)
            const nombre = ctxFn.globalState.get('usuarioActivo')
            const resultado = await deleteSheetRowById(codigo, nombre)
            if (resultado.ok) {
                await ctxFn.flowDynamic(`✅ Se eliminó la actividad correctamente.`)
            } else {
                await ctxFn.flowDynamic(`❌ No se pudo eliminar. Motivo: ${resultado.error || 'desconocido'}`)
            }

        } else if (esNegacion) {
            await ctxFn.flowDynamic('Cancelado. No se eliminó nada ✅')
        } else {
            await ctxFn.flowDynamic('No entendí tu respuesta 🤔 Por favor escribí "sí" o "no"')
            return ctxFn.gotoFlow(flowTrackerEliminarActividad)
        }
    })




const flowTrackerVer = addKeyword('track')
    .addAction(async (ctx, ctxFn) => {
        const mensajeInicial = 'Consultando actividades... 🧠'
        const isMessageFromGroup = !!ctx.message.extendedTextMessage

        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, mensajeInicial)
        } else {
            await ctxFn.flowDynamic(mensajeInicial)
        }

        const datos = await readSheet("Rutatina!A2:F")

        if (!datos || datos.length === 0) {
            const mensajeError = 'Todavía no hay actividades registradas 😔'
            if (isMessageFromGroup) {
                return await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, mensajeError)
            } else {
                return await ctxFn.flowDynamic(mensajeError)
            }
        }

        // Agrupar por nombre
        const agrupado = {}
        datos.forEach(([nombre, descripcion, fecha, estado, , id]) => {
            if (!agrupado[nombre]) agrupado[nombre] = []

            agrupado[nombre].push({
                estado,
                descripcion,
                fecha,
                id
            })
        })

        // Ordenar: primero los "🟢"
        for (const nombre in agrupado) {
            agrupado[nombre].sort((a, b) => {
                if (a.estado === b.estado) return 0
                return a.estado === '🟢' ? -1 : 1
            })
        }

        if (isMessageFromGroup) {
            for (const nombre in agrupado) {
                const actividades = agrupado[nombre]
                    .map(a => `${a.estado} ➡️ ${a.descripcion} ➡️ ${a.fecha} ⏱️`)
                    .join('\n')

                const mensaje = `Actividades de ${nombre}\n${actividades}`
                await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, mensaje)
            }
        } else {
            const nombreUsuario = ctx.pushName
            const actividadesUsuario = agrupado[nombreUsuario]

            if (!actividadesUsuario || actividadesUsuario.length === 0) {
                return await ctxFn.flowDynamic('No encontré actividades registradas con tu nombre 😶')
            }

            const mensaje = `Actividades de ${nombreUsuario}\n` + actividadesUsuario
                .map(a => `${a.estado} ➡️ ${a.descripcion} ➡️ ${a.fecha} ⏱️ | 🆔 ${a.id}`)
                .join('\n')

            await ctxFn.flowDynamic(mensaje)
        }
    })
    .addAnswer([
        'Recuerda que puedes realizar las siguientes operaciones con tus actividades 🧠',
        '*Completar* ✅',
        '*Eliminar* ❌'
    ])



const flowFraseAleatoria = addKeyword('frase')
    .addAction(async (ctx, ctxFn) => {
        const mensajeFrase = 'Dame una palabra para generar tu frase aleatoria ✨'
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, mensajeFrase)
        } else {
            await ctxFn.flowDynamic(mensajeFrase)
        }
    })
    .addAction({ capture: true }, async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        const prompt = `Crea una frase inspiradora, corta y precisa. Agregale emojis. Utiliza la siguiente palabra o palabras => ${ctx.body}`
        const respuesta = await llama(prompt)
        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, respuesta)
        } else {
            await ctxFn.flowDynamic(respuesta)
        }
    })

const flowDatoCurioso = addKeyword('dato')
    .addAction(async (ctx, ctxFn) => {
        const mensajeDatoCurioso = 'Escribeme sobre qué te gustaría saber? 🤔'
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, mensajeDatoCurioso)
        } else {
            await ctxFn.flowDynamic(mensajeDatoCurioso)
        }
    })
    .addAction({ capture: true }, async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        const prompt = `Dime un dato curioso, se breve, coherente y cohesivo, no más de 40 palabras. Dame solo la respuesta. Agrega emojis necesarios. Tiene que ser un dato curioso sobre el siguiente topico: ${ctx.body}`
        const respuesta = await llama(prompt)
        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, respuesta)
        } else {
            await ctxFn.flowDynamic(respuesta)
        }
    })

const flowImagen = addKeyword('imagen')
    .addAction(async (ctx, ctxFn) => {
        const mensajeImagen = 'Describe la imagen que quieres generar 🖼️'
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, mensajeImagen)
        } else {
            await ctxFn.flowDynamic(mensajeImagen)
        }
    })
    .addAction({
        capture: true
    },
        async (ctx, ctxFn) => {
            const isMessageFromGroup = !!ctx.message.extendedTextMessage
            const mensajeEspera = 'Tu imagen se esta generando (30s⏳)'
            if (isMessageFromGroup) {
                await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, mensajeEspera)
            } else {
                await ctxFn.flowDynamic(mensajeEspera)
            }
            const mensaje = await generarImagen(ctx.body)
            const respuesta = mensaje.includes('Ups') ? { body: mensaje, delay: 1000 } : { body: mensaje, media: 'C:/Users/Leo/Desktop/Personal Projects/WppChatbotRailway/base-baileys-memory/images/image.png', delay: 1000 }
            if (isMessageFromGroup) {
                if (respuesta.body.includes('Espero')) {
                    await ctxFn.provider.sendMedia(process.env.WHATSAPP_GROUP_ID, respuesta.media)
                } else {
                    await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, respuesta.body)
                }
            } else {
                await ctxFn.flowDynamic([respuesta])
            }
        })

const flowAudio = addKeyword(EVENTS.VOICE_NOTE)
    .addAction(async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        isMessageFromGroup && ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, 'Por el momento, los audios de voz solo funcionan por privado 😞') && ctxFn.flowDynamic('Enviame tu consulta por acá 🤠')//ctx audio missing in group audio message
        if (!isMessageFromGroup) {
            ctxFn.flowDynamic('Estamos procesando tu nota de voz 🤠')
            ctxFn.flowDynamic('Espera unos segundos ⏳')
            const transcripcion = await assemblyAI(ctx)
            if (transcripcion.text.includes('Ups... algo salió mal.')) {
                return await ctxFn.flowDynamic(transcripcion.text)
            }
            const prompt = `Responde a la siguiente pregunta: => ${transcripcion.text}. Se breve y conciso, agrega emojis, no más de 40 palabras. Despidete al final con algo como "Si tienes mas preguntas, no dudes en hacerlas, nos vemos ${ctx.pushName}". Puedes mejorar la despedida del final como tu quieras.`
            const respuesta = await llama(prompt)
            await ctxFn.flowDynamic(respuesta)
        }
    })

const flowDescribirImagen = addKeyword('describir')
    .addAction(async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, 'Por el momento, la descripción de imagen solo funciona por privado 😞')
            await ctxFn.flowDynamic('Intenta por acá 🤠')
            return
        } else {
            return await ctxFn.gotoFlow(flowImagenATexto)
        }
    })

const flowImagenATexto = addKeyword(EVENTS.ACTION)
    .addAnswer('Envíame la imagen que queres que te describa 🤠', { capture: true }, async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        if (!isMessageFromGroup && ctx.message.imageMessage) {
            await ctxFn.flowDynamic('Espera unos segundos ⏳')
            const descripcion = await huggingFace(ctx)
            if (descripcion.generated_text.includes('Ups... algo salió mal')) {
                return await ctxFn.flowDynamic(descripcion.generated_text)
            } else {
                const prompt = `Traduce el siguiente texto al español, cambialo para que tenga sentido, coherencia y cohesion, ademas agregale emojis acordes al final de cada oración. El texto es el siguiente: "${descripcion.generated_text}". Por favor, enviame unicamente la traduccion o respuesta final sin las comillas "" (obligatorio)`
                const respuesta = await llama(prompt)
                return await ctxFn.flowDynamic(respuesta)
            }
        } else {
            await ctxFn.flowDynamic('Por favor, manda una imagen válida 🤠')
            await ctxFn.gotoFlow(flowImagenATexto)
        }
    })

const flowSalir = addKeyword(['salir', 'chau', 'nv', 'gracias'])
    .addAction(async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        const despedida = '¡Nos vemos! 👋'
        if (isMessageFromGroup) {
            ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, despedida)
        } else {
            ctxFn.flowDynamic(despedida)
        }
    })


const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: process.env.MONGO_DB_URI,
        dbName: "MaruBot"
    })
    const adapterFlow = createFlow([flowWelcome, flowMenu, flowTracker, flowTrackerRegistro, flowTrackerCompletar, flowTrackerCompletarActividad, flowTrackerEliminar, flowTrackerEliminarActividad, flowTrackerVer, flowFraseAleatoria, flowDatoCurioso, flowImagen, flowAudio, flowDescribirImagen, flowImagenATexto, flowSalir,])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
