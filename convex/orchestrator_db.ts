// Orchestration DB mutations/queries — V8 runtime
import { internalMutation, internalQuery, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

const stepValidator = v.object({
  stepIndex: v.number(),
  agent: v.union(v.literal("planner"), v.literal("coder"), v.literal("reviewer"), v.literal("tester"), v.literal("healer")),
  title: v.string(), description: v.string(),
  status: v.union(v.literal("pending"), v.literal("running"), v.literal("done"), v.literal("failed"), v.literal("skipped")),
  output: v.optional(v.string()),
});

const runStatus = v.union(v.literal("planning"), v.literal("awaiting_approval"), v.literal("executing"), v.literal("completed"), v.literal("failed"), v.literal("cancelled"));

export const createRun = internalMutation({
  args: { prompt: v.string() },
  handler: async (ctx, args): Promise<Id<"agentRuns">> =>
    await ctx.db.insert("agentRuns", { prompt: args.prompt, status: "planning", healAttempts: 0 }),
});

export const setStatus = internalMutation({
  args: { runId: v.id("agentRuns"), status: runStatus },
  handler: async (ctx, args): Promise<void> => { await ctx.db.patch(args.runId, { status: args.status }); },
});

export const updateStep = internalMutation({
  args: { runId: v.id("agentRuns"), stepIndex: v.number(), status: v.union(v.literal("pending"), v.literal("running"), v.literal("done"), v.literal("failed"), v.literal("skipped")), output: v.optional(v.string()) },
  handler: async (ctx, args): Promise<void> => {
    const run = await ctx.db.get(args.runId);
    if (!run?.plan) return;
    await ctx.db.patch(args.runId, { plan: run.plan.map((s) => s.stepIndex === args.stepIndex ? { ...s, status: args.status, ...(args.output !== undefined ? { output: args.output } : {}) } : s) });
  },
});

export const savePlan = internalMutation({
  args: { runId: v.id("agentRuns"), plan: v.array(stepValidator) },
  handler: async (ctx, args): Promise<void> => { await ctx.db.patch(args.runId, { plan: args.plan, status: "awaiting_approval" }); },
});

export const saveFinalFiles = internalMutation({
  args: { runId: v.id("agentRuns"), files: v.array(v.object({ name: v.string(), content: v.string() })) },
  handler: async (ctx, args): Promise<void> => { await ctx.db.patch(args.runId, { finalFiles: args.files, status: "completed" }); },
});

export const markFailed = internalMutation({
  args: { runId: v.id("agentRuns"), error: v.string() },
  handler: async (ctx, args): Promise<void> => { await ctx.db.patch(args.runId, { status: "failed", errorMessage: args.error }); },
});

export const incrementHeal = internalMutation({
  args: { runId: v.id("agentRuns"), errors: v.array(v.string()) },
  handler: async (ctx, args): Promise<number> => {
    const run = await ctx.db.get(args.runId);
    const count = (run?.healAttempts ?? 0) + 1;
    await ctx.db.patch(args.runId, { healAttempts: count, consoleErrors: args.errors });
    return count;
  },
});

export const readRunInternal = internalQuery({
  args: { runId: v.id("agentRuns") },
  handler: async (ctx, args) => ctx.db.get(args.runId),
});

export const readRun = query({
  args: { runId: v.id("agentRuns") },
  handler: async (ctx, args) => ctx.db.get(args.runId),
});

export const listRuns = query({
  args: {},
  handler: async (ctx) => ctx.db.query("agentRuns").order("desc").take(20),
});

export const setRunStatus = mutation({
  args: { runId: v.id("agentRuns"), status: runStatus },
  handler: async (ctx, args): Promise<void> => { await ctx.db.patch(args.runId, { status: args.status }); },
});
