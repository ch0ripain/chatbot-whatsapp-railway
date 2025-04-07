// const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
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

const flowEvento = addKeyword('evento')
    .addAction(async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        const mensajeEvento = 'Esta función todavía no está disponible ⏳'
        'Esta función todavía no está disponible ⏳'
        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, mensajeEvento)
        } else {
            await ctxFn.flowDynamic(mensajeEvento)
        }
    })


const flowProgreso = addKeyword('progreso')
    .addAction(async (ctx, ctxFn) => {
        const isMessageFromGroup = !!ctx.message.extendedTextMessage
        const mensajeProgreso = 'Esta función todavía no está disponible ⏳'
        if (isMessageFromGroup) {
            await ctxFn.provider.sendText(process.env.WHATSAPP_GROUP_ID, mensajeProgreso)
        } else {
            await ctxFn.flowDynamic(mensajeProgreso)
        }
    })

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
    const adapterFlow = createFlow([flowWelcome, flowMenu, flowEvento, flowProgreso, flowFraseAleatoria, flowDatoCurioso, flowImagen, flowAudio, flowSalir,])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
