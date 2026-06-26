import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "dummy",
});

function getOpenRouterModelId(slug: string, name: string): string {
  const normalizedSlug = (slug || "").toLowerCase();
  
  if (normalizedSlug.includes("deepseek")) {
    if (normalizedSlug.includes("v3") || normalizedSlug.includes("chat")) return "deepseek/deepseek-chat";
    if (normalizedSlug.includes("r1") || normalizedSlug.includes("reasoner")) return "deepseek/deepseek-r1";
    return "deepseek/deepseek-chat";
  }
  
  if (normalizedSlug.includes("chatgpt") || normalizedSlug.includes("gpt")) {
    if (normalizedSlug.includes("4o-mini")) return "openai/gpt-4o-mini";
    if (normalizedSlug.includes("4o")) return "openai/gpt-4o";
    return "openai/gpt-3.5-turbo";
  }
  
  if (normalizedSlug.includes("claude")) {
    if (normalizedSlug.includes("opus")) return "anthropic/claude-3-opus";
    if (normalizedSlug.includes("sonnet")) return "anthropic/claude-3.5-sonnet";
    if (normalizedSlug.includes("haiku")) return "anthropic/claude-3-haiku";
    return "anthropic/claude-3.5-sonnet";
  }

  if (normalizedSlug.includes("gemini")) {
    if (normalizedSlug.includes("pro")) return "google/gemini-pro-1.5";
    if (normalizedSlug.includes("flash")) return "google/gemini-flash-1.5";
    return "google/gemini-pro-1.5";
  }

  if (normalizedSlug.includes("llama")) {
    if (normalizedSlug.includes("3.1")) return "meta-llama/llama-3.1-8b-instruct";
    return "meta-llama/llama-3-8b-instruct";
  }

  return "openai/gpt-4o-mini"; 
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, modelId, toolName } = body;

    if (!messages || !Array.isArray(messages)) {
      return new NextResponse("Messages are required", { status: 400 });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return new NextResponse("API key is not configured", { status: 500 });
    }

    const openRouterId = getOpenRouterModelId(modelId, toolName);

    const response = await openai.chat.completions.create({
      model: openRouterId,
      messages: [
        { role: "system", content: \`You are \${toolName || "a helpful AI assistant"}. Please answer concisely.\` },
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
    return new NextResponse("Internal Error", { status: 500 });
  }
}
