import { NextResponse } from "next/server";
import { fetchOpenRouterModels, findBestModelMatch } from "@/lib/utils/openrouter-models";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug') || '';
  const name = searchParams.get('name') || '';

  try {
    const models = await fetchOpenRouterModels();
    const match = findBestModelMatch(models, slug, name);
    
    if (match) {
      return NextResponse.json({ isAvailable: true, openRouterId: match });
    } else {
      return NextResponse.json({ isAvailable: false, openRouterId: null });
    }
  } catch (error) {
    return NextResponse.json({ isAvailable: false, openRouterId: null }, { status: 500 });
  }
}
