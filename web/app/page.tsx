"use client";

import { useState } from "react";

export default function SandboxUI() {
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("// Your generated code will appear here...");
  const [output, setOutput] = useState("Sandbox output will appear here...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAI = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace this with a call to your real AI backend.
      const generated = `// AI-generated code for: ${prompt}\n\nconsole.log("AI sandbox for: ${prompt}");`;
      setCode(generated);
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate code");
    } finally {
      setLoading(false);
    }
  };

  const executeCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, prompt }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Execution failed");
      }
      setOutput(data.output);
    } catch (e: any) {
      setError(e?.message ?? "Failed to execute code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full">
      <div className="w-1/3 border-r p-4 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Sandbox Generator</h1>

        <textarea
          className="border p-2 rounded h-40"
          placeholder="Describe the app or component you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            onClick={generateAI}
            className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700"
            disabled={loading}
          >
            {loading ? "Generating..." : "AI Generate"}
          </button>
          <button
            onClick={executeCode}
            className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
            disabled={loading}
          >
            {loading ? "Running..." : "Run Code"}
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-sm mt-2">
            {error}
          </div>
        )}
      </div>

      <div className="w-1/3 border-r p-4">
        <h2 className="text-xl font-semibold mb-2">Generated Code</h2>
        <pre className="bg-gray-100 p-4 rounded h-full overflow-auto">
{code}
        </pre>
      </div>

      <div className="w-1/3 p-4">
        <h2 className="text-xl font-semibold mb-2">Sandbox Output</h2>
        <div className="bg-gray-100 p-4 rounded h-full overflow-auto whitespace-pre-wrap">
          {output}
        </div>
      </div>
    </main>
  );
}
