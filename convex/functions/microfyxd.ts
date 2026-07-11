import { mutation } from "../_generated/server";
import { runAI } from "../../src/engine/ai";
import { runExecution } from "../../src/engine/execution";

export const generateAI = mutation(async ({}, { prompt }) => {
  const code = await runAI(prompt);
  return { code };
});

export const executeCode = mutation(async ({}, { code, prompt }) => {
  const output = await runExecution(code, prompt);
  return { output };
});