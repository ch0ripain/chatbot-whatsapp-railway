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

const __dirname = import.meta.dirname

const bienvenidaPath = path.join(__dirname, "mensajes", "bienvenida.txt")
const bienvenida = fs.readFileSync(bienvenidaPath, "utf8")

const bienvenidaMenuPath = path.join(__dirname, "mensajes", "bienvenida-menu.txt")
const bienvenidaMenu = fs.readFileSync(bienvenidaMenuPath, "utf-8")

const flowWelcome = addKeyword([EVENTS.WELCOME])
    .addAnswer(bienvenida, {
        delay: 1000
    })
    .addAnswer('Escribe *Menú* 📜 para ver todas las opciones disponibles.', {
        delay: 1500
    })

const flowMenu = addKeyword(['menu', 'menú', 'Menú'])
    .addAnswer(bienvenidaMenu)

const flowEvento = addKeyword('evento')
    .addAnswer('Esta función todavía no está disponible ⏳')

const flowProgreso = addKeyword('progreso')
    .addAnswer('Esta función todavía no está disponible ⏳')

const flowFraseAleatoria = addKeyword('frase')
    .addAnswer('Dame una palabra para generar tu frase aleatoria ✨', {
        capture: true
    },
        async (ctx, ctxFn) => {
            const prompt = `Crea una frase inspiradora, corta y precisa. Agregale emojis. Utiliza la siguiente palabra o palabras => ${ctx.body}`
            const respuesta = await llama(prompt)
            await ctxFn.flowDynamic(respuesta)
        }
    )

const flowDatoCurioso = addKeyword('dato')
    .addAnswer('Escribeme sobre qué te gustaría saber? 🤔', {
        capture: true
    },
        async (ctx, ctxFn) => {
            const prompt = `Dime un dato curioso, se breve, coherente y cohesivo, no más de 40 palabras. Dame solo la respuesta. Agrega emojis necesarios. Tiene que ser un dato curioso sobre el siguiente topico: ${ctx.body}`
            const respuesta = await llama(prompt)
            await ctxFn.flowDynamic(respuesta)
        }
    )

const flowImagen = addKeyword('imagen')
    .addAnswer('Describe la imagen que quieres generar 🖼️', {
        capture: true
    },
        async (ctx, { flowDynamic }) => {
            await flowDynamic('Tu imagen se esta generando (30s⏳)')
            const mensaje = await generarImagen(ctx.body)
            if (mensaje.includes('Ups')) {
                await flowDynamic([
                    {
                        body: mensaje,
                        delay: 1000
                    }
                ])
            } else {
                await flowDynamic([
                    {
                        body: mensaje,
                        media: 'C:/Users/Leo/Desktop/Personal Projects/WppChatbotRailway/base-baileys-memory/images/image.png',
                        delay: 1000
                    }
                ])

            }
        })

const flowPregunta = addKeyword('pregunta')
    .addAnswer('Preguntamé lo que quieras 🤖', {
        capture: true
    },
        async (ctx, ctxFn) => {
            const prompt = `Responde a la siguiente pregunta: => ${ctx.body}. Se breve y conciso, agrega emojis, no más de 40 palabras.`
            const respuesta = await llama(prompt)
            await ctxFn.flowDynamic(respuesta)
        }
    )

const flowSalir = addKeyword(['salir', 'chau', 'nv', 'gracias'])
    .addAnswer('¡Nos vemos! 👋')

const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: process.env.MONGO_DB_URI,
        dbName: "MaruBot"
    })
    const adapterFlow = createFlow([flowWelcome, flowMenu, flowEvento, flowProgreso, flowFraseAleatoria, flowDatoCurioso, flowImagen, flowPregunta, flowSalir,])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    QRPortalWeb()
}

main()
