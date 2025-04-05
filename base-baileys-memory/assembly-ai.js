import { downloadMediaMessage } from "@adiwajshing/baileys";
// import { path as ffmpegPath } from '@ffmpeg-installer/ffmpeg';
import { AssemblyAI } from 'assemblyai';
// import Ffmpeg from "fluent-ffmpeg";
import fs from "fs"

// Ffmpeg.setFfmpegPath(ffmpegPath)

// const convertirOggMp3 = async (inputStream, outStream) => {
//     return new Promise((resolve, reject) => {
//         Ffmpeg(inputStream)
//             .audioQuality(96)
//             .toFormat("mp3")
//             .save(outStream)
//             .on("progress", (p) => null)
//             .on("end", () => {
//                 resolve(true);
//             });
//     });
// };

export const assemblyAI = async (ctx) => {
    const client = new AssemblyAI({
        apiKey: process.env.ASSEMBLY_API_KEY,
    });
    const buffer = await downloadMediaMessage(ctx, "buffer");
    const pathTmpOgg = `${process.cwd()}/tmp/voice-note-${Date.now()}.ogg`;
    // const pathTmpMp3 = `${process.cwd()}/tmp/voice-note-${Date.now()}.mp3`;
    await fs.writeFileSync(pathTmpOgg, buffer);
    // await convertirOggMp3(pathTmpOgg, pathTmpMp3);
    const data = {
        audio: pathTmpOgg,
        language_detection: true,
    }
    try {
        const transcripcion = await client.transcripts.transcribe(data);
        // fs.unlink(pathTmpMp3, (error) => {
        //     if (error) throw error;
        // });
        fs.unlink(pathTmpOgg, (error) => {
            if (error) throw error;
        });
        return transcripcion;
    } catch (error) {
        console.log(error)
        return { text: 'Ups... algo salió mal. Inténtalo de nuevo más tarde 😓' }
    }
};