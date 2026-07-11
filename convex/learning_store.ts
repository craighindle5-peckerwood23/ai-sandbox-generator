// Learning store — V8 runtime
import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

function extractKeywords(prompt: string): string[] {
  const STOP = new Set(["with","that","this","have","from","they","will","been","make","build","create","generate","write","code","using","want","need","please","some","like","very","just","more"]);
  return prompt.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter((w) => w.length > 3 && !STOP.has(w)).slice(0, 20);
}

function similarity(a: string[], b: string[]): number {
  const sa = new Set(a), sb = new Set(b);
  const inter = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : inter / union;
}

export const saveExample = internalMutation({
  args: { prompt: v.string(), files: v.array(v.object({ name: v.string(), content: v.string() })) },
  handler: async (ctx, args): Promise<void> => {
    const keywords = extractKeywords(args.prompt);
    const existing = await ctx.db.query("learningExamples").withSearchIndex("search_prompt", (q) => q.search("prompt", args.prompt)).first();
    if (existing && similarity(existing.keywords, keywords) > 0.65) {
      await ctx.db.patch(existing._id, { useCount: existing.useCount + 1, files: args.files });
    } else {
      await ctx.db.insert("learningExamples", { prompt: args.prompt, keywords, files: args.files, rating: 3.5, useCount: 1, healCount: 0 });
    }
  },
});

export const searchExamples = query({
  args: { prompt: v.string(), topK: v.number() },
  handler: async (ctx, args) => {
    const results = await ctx.db.query("learningExamples").withSearchIndex("search_prompt", (q) => q.search("prompt", args.prompt)).take(args.topK);
    return results.filter((r) => r.rating >= 3).map((r) => ({ _id: r._id, prompt: r.prompt, files: r.files, rating: r.rating, useCount: r.useCount }));
  },
});

export const patchRating = mutation({
  args: { id: v.id("learningExamples"), rating: v.number() },
  handler: async (ctx, args): Promise<void> => { await ctx.db.patch(args.id, { rating: args.rating }); },
});

export const listExamples = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("learningExamples").withIndex("by_rating").order("desc").take(50);
    return all.map((e) => ({ _id: e._id, prompt: e.prompt, rating: e.rating, useCount: e.useCount, healCount: e.healCount, fileCount: e.files.length }));
  },
});

export const findByPrompt = query({
  args: { prompt: v.string() },
  handler: async (ctx, args) => ctx.db.query("learningExamples").withSearchIndex("search_prompt", (q) => q.search("prompt", args.prompt)).first(),
});
