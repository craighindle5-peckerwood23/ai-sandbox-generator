import { NextResponse } from "next/server";
import { api } from "../../../../convex/_generated/api";
import { convex } from "../../../../convex/client";

export async function POST(req: Request) {
  const { code, prompt } = await req.json();

  try {
    const result = await convex.mutation(api.microfyxd.executeCode, {
      code,
      prompt,
    });

    return NextResponse.json({ success: true, output: result.output });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message ?? "Execution failed" },
      { status: 500 }
    );
  }
}