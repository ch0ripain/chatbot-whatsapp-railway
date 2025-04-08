import { HfInference } from "@huggingface/inference";
import { downloadMediaMessage } from "@adiwajshing/baileys";
const model = "Salesforce/blip-image-captioning-base";

export const huggingFace = async (imagenCtx) => {
    try {
        const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);
        const messageType = Object.keys(imagenCtx?.message)[0];
        if (messageType === 'imageMessage') {
            const buffer = await downloadMediaMessage(imagenCtx, 'buffer');
            const descripcion = await hf.imageToText({
                data: buffer,
                model,
            });
            return descripcion;
        }
    } catch (error) {
        console.log('huggingFace.js \n', error)
        return { generated_text: 'Ups... algo salió mal. Inténtalo de nuevo más tarde 😓' }
    }
};
