import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "dummy",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, modelId, toolName, openRouterId } = body;

    if (!messages || !Array.isArray(messages)) {
      return new NextResponse("Messages are required", { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return new NextResponse("API key is not configured", { status: 500 });
    }

    if (!openRouterId) {
      return new NextResponse("openRouterId is required", { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: openRouterId,
      messages: [
        { role: "system", content: `You are ${toolName || "a helpful AI assistant"}. Please answer concisely.` },
        ...messages
      ],
      max_tokens: 1000,
    });

    return NextResponse.json({
      reply: response.choices[0]?.message?.content || "No response generated.",
      modelUsed: openRouterId
    });

  } catch (error: any) {
    console.error("[AI_CHAT_ERROR]", error);
    
    // Попытка извлечь понятную ошибку от OpenRouter
    const errorMessage = error.error?.message || error.message || "Unknown OpenRouter Error";
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
