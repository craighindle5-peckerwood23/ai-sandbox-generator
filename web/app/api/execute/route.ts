import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { code, prompt } = body;

  // TODO: Wire this to your real backend / Convex / Microfyxd engine.
  // Example:
  // const result = await fetch("https://your-backend/execute", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ code, prompt }),
  // });

  const output = `Backend received prompt: "${prompt}"\n\nCode:\n${code}`;
  return NextResponse.json({ success: true, output });
}
