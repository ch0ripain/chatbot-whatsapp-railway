import ollama from 'ollama'

export const llama = async (prompt) => {
    try {
        const response = await ollama.chat({
            model: 'llama3.2:3b',
            messages: [{ role: 'user', content: prompt }],
        })
        return response.message.content
    } catch (error) {
        return 'Ups… algo salió mal. Intenta de nuevo más tarde! 🔄🤖'
    }
}