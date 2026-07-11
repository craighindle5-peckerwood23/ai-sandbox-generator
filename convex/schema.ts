import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  agentRuns: defineTable({
    prompt: v.string(),
    status: v.union(
      v.literal("planning"),
      v.literal("awaiting_approval"),
      v.literal("executing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    plan: v.optional(v.array(v.object({
      stepIndex: v.number(),
      agent: v.union(
        v.literal("planner"),
        v.literal("coder"),
        v.literal("reviewer"),
        v.literal("tester"),
        v.literal("healer")
      ),
      title: v.string(),
      description: v.string(),
      status: v.union(
        v.literal("pending"),
        v.literal("running"),
        v.literal("done"),
        v.literal("failed"),
        v.literal("skipped")
      ),
      output: v.optional(v.string()),
    }))),
    finalFiles: v.optional(v.array(v.object({ name: v.string(), content: v.string() }))),
    errorMessage: v.optional(v.string()),
    healAttempts: v.number(),
    consoleErrors: v.optional(v.array(v.string())),
  }).index("by_status", ["status"]),

  learningExamples: defineTable({
    prompt: v.string(),
    keywords: v.array(v.string()),
    files: v.array(v.object({ name: v.string(), content: v.string() })),
    rating: v.number(),
    useCount: v.number(),
    healCount: v.number(),
  })
    .index("by_rating", ["rating"])
    .searchIndex("search_prompt", {
      searchField: "prompt",
      filterFields: ["rating"],
    }),
});
