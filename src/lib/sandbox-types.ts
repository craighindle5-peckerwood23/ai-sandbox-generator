export type FileLanguage = "html" | "css" | "javascript" | "typescript" | "json" | "markdown";

export type SandboxFile = {
  id: string;
  name: string;
  language: FileLanguage;
  content: string;
};

export type ConsoleEntry = {
  id: string;
  type: "log" | "warn" | "error" | "info" | "success";
  message: string;
  timestamp: number;
  source?: "preview" | "system" | "agent";
};

export const DEFAULT_FILES: SandboxFile[] = [
  { id: "index-html", name: "index.html", language: "html", content: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>My App</title>\n  <link rel="stylesheet" href="style.css" />\n</head>\n<body>\n  <div id="app"><h1>Hello, World!</h1></div>\n  <script src="script.js"></script>\n</body>\n</html>` },
  { id: "style-css", name: "style.css", language: "css", content: `* { box-sizing: border-box; margin: 0; padding: 0; }\nbody { font-family: system-ui, sans-serif; background: #0f1117; color: #e2e8f0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }\n#app { text-align: center; padding: 2rem; }\nh1 { font-size: 2.5rem; background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 1rem; }` },
  { id: "script-js", name: "script.js", language: "javascript", content: `// Your JavaScript here\nconsole.log("Sandbox ready!");` },
];

export function detectLanguage(filename: string): FileLanguage {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html": return "html";
    case "css": return "css";
    case "js": return "javascript";
    case "ts": return "typescript";
    case "json": return "json";
    case "md": return "markdown";
    default: return "javascript";
  }
}

export function buildPreviewHtml(files: SandboxFile[]): string {
  const htmlFile = files.find((f) => f.language === "html");
  const cssFiles = files.filter((f) => f.language === "css");
  const jsFiles = files.filter((f) => f.language === "javascript" || f.language === "typescript");
  if (!htmlFile) {
    return `<!DOCTYPE html><html><head>${cssFiles.map((f) => `<style>${f.content}</style>`).join("")}</head><body>${jsFiles.map((f) => `<script>${f.content}</script>`).join("")}</body></html>`;
  }
  let html = htmlFile.content;
  for (const f of cssFiles) html = html.replace(new RegExp(`<link[^>]*href=["']${f.name}["'][^>]*>`, "g"), `<style>${f.content}</style>`);
  for (const f of jsFiles) html = html.replace(new RegExp(`<script[^>]*src=["']${f.name}["'][^>]*></script>`, "g"), `<script>${f.content}</script>`);
  return html;
}
