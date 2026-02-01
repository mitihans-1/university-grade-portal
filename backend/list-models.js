const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key found in .env");
        return;
    }

    try {
        console.log("Fetching available models...");
        // For listing models, we often use the fetch API directly or a specific method if available
        // But let's try just listing them via the SDK if supported

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("✅ Models found:");
            data.models.forEach(m => console.log(` - ${m.name}`));
        } else {
            console.log("❌ No models found or error in response:");
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error(`❌ Fetch failed: ${err.message}`);
    }
}

listModels();
