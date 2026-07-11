"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an expert web developer AI. Generate clean, modern, runnable HTML/CSS/JS code.

Return a JSON object:
{ "files": [{ "name": "...", "content": "..." }], "description": "brief description" }

Rules:
- Always include index.html, style.css, script.js
- Use modern CSS and vanilla JS only
- Dark-themed by default
- Return ONLY the JSON, no markdown fences`;

export const generateCode = action({
  args: {
    prompt: v.string(),
    currentFiles: v.array(v.object({ name: v.string(), content: v.string() })),
  },
  handler: async (_ctx, args): Promise<{ files: Array<{ name: string; content: string }>; description: string }> => {
    const apiKey = process.env.HERCULES_API_KEY;
    if (!apiKey) throw new Error("HERCULES_API_KEY not configured");
    const openai = new OpenAI({ baseURL: "https://ai-gateway.hercules.app/v1", apiKey });
    const ctx = args.currentFiles.length > 0
      ? `\n\nCurrent files:\n${args.currentFiles.map((f) => `--- ${f.name} ---\n${f.content}`).join("\n\n")}`
      : "";
    const response = await openai.chat.completions.create({
      model: "openai/gpt-5",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: args.prompt + ctx }],
      temperature: 0.7,
    });
    const raw = (response.choices[0]?.message?.content ?? "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(raw) as { files: Array<{ name: string; content: string }>; description: string };
  },
});
