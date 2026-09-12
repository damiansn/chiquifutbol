import { NextResponse } from "next/server";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function GET() {
  try {
    const data = await redis.get("chiquifutbol_standings");
    if (!data) {
      return NextResponse.json({ error: "No hay datos de posiciones disponibles" }, { status: 404 });
    }
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}