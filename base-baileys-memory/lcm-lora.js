import { converBase64ToImage } from 'convert-base64-to-image'

export async function generarImagen(prompt) {

    const LORA_REQUEST = {
        "lcm_model_id": "stabilityai/sd-turbo",
        "openvino_lcm_model_id": "rupeshs/sd-turbo-openvino",
        "use_offline_model": false,
        "use_lcm_lora": false,
        "lcm_lora": {
            "base_model_id": "Lykon/dreamshaper-8",
            "lcm_lora_id": "latent-consistency/lcm-lora-sdv1-5"
        },
        "use_tiny_auto_encoder": false,
        "use_openvino": false,
        "prompt": prompt,
        "negative_prompt": "",
        "init_image": "string",
        "strength": 0.6,
        "image_height": 512,
        "image_width": 512,
        "inference_steps": 1,
        "guidance_scale": 1,
        "clip_skip": 1,
        "token_merging": 0,
        "number_of_images": 1,
        "seed": 123123,
        "use_seed": false,
        "use_safety_checker": false,
        "diffusion_task": "text_to_image",
        "lora": {
            "enabled": false,
            "fuse": true,
            "models_dir": process.env.MODELS_DIR,
            "weight": 0.5
        },
        "controlnet": {
            "adapter_path": "string",
            "conditioning_scale": 0.5,
            "enabled": false
        },
        "dirs": {
            "controlnet": process.env.CONTROL_NET,
            "lora": process.env.LORA,
        },
        "rebuild_pipeline": false,
        "use_gguf_model": false,
        "gguf_model": {
            "gguf_models": process.env.GGUF_MODELS,
        }
    }

    let mensaje = "Espero te guste 😔"

    try {
        const response = await fetch(`${process.env.HOST_URL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(LORA_REQUEST)
        })

        if (!response.ok) {
            mensaje = "Ups... algo salió mal. Inténtalo de nuevo más tarde 😓"
            return mensaje
        }

        const responseData = await response.json()

        const base64 = `data:image/jpeg;base64,${responseData.images[0]}`
        const pathToSaveImage = './images/image.png'

        converBase64ToImage(base64, pathToSaveImage)

    } catch (error) {
        console.log('Error papu :V')
        mensaje = "Ups... algo salió mal. Inténtalo de nuevo más tarde 😓"
    }
    return mensaje
}
