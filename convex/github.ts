"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

const BASE = "https://api.github.com";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export const createRepo = action({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
    files: v.array(v.object({ path: v.string(), content: v.string() })),
    commitMessage: v.string(),
  },
  handler: async (_ctx, args): Promise<{ repoUrl: string; owner: string; repo: string }> => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN secret not set");
    const meRes = await fetch(`${BASE}/user`, { headers: headers(token) });
    if (!meRes.ok) throw new Error("Failed to get GitHub user");
    const me = (await meRes.json()) as { login: string };
    const createRes = await fetch(`${BASE}/user/repos`, {
      method: "POST", headers: headers(token),
      body: JSON.stringify({ name: args.name, description: args.description ?? "", private: args.isPrivate, auto_init: true }),
    });
    if (!createRes.ok) { const err = (await createRes.json()) as { message?: string }; throw new Error(err.message ?? "Failed to create repo"); }
    const repo = (await createRes.json()) as { html_url: string; default_branch: string };
    await new Promise((r) => setTimeout(r, 1000));
    await pushFilesToRepo({ token, owner: me.login, repo: args.name, branch: repo.default_branch ?? "main", files: args.files, message: args.commitMessage });
    return { repoUrl: repo.html_url, owner: me.login, repo: args.name };
  },
});

export const pushToExistingRepo = action({
  args: { owner: v.string(), repo: v.string(), branch: v.string(), files: v.array(v.object({ path: v.string(), content: v.string() })), commitMessage: v.string() },
  handler: async (_ctx, args): Promise<{ repoUrl: string }> => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN secret not set");
    await pushFilesToRepo({ token, owner: args.owner, repo: args.repo, branch: args.branch, files: args.files, message: args.commitMessage });
    return { repoUrl: `https://github.com/${args.owner}/${args.repo}` };
  },
});

export const listUserRepos = action({
  args: {},
  handler: async (_ctx): Promise<Array<{ name: string; owner: string; private: boolean; defaultBranch: string }>> => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN secret not set");
    const res = await fetch(`${BASE}/user/repos?sort=updated&per_page=30`, { headers: headers(token) });
    if (!res.ok) throw new Error("Failed to list repositories");
    const repos = (await res.json()) as Array<{ name: string; owner: { login: string }; private: boolean; default_branch: string }>;
    return repos.map((r) => ({ name: r.name, owner: r.owner.login, private: r.private, defaultBranch: r.default_branch }));
  },
});

export const importFromGithub = action({
  args: { repoUrl: v.string() },
  handler: async (_ctx, args): Promise<Array<{ name: string; content: string }>> => {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN secret not set");
    const clean = args.repoUrl.replace("https://github.com/", "").replace(/\.git$/, "").trim();
    const [owner, repo] = clean.split("/");
    if (!owner || !repo) throw new Error("Invalid GitHub URL");
    const repoRes = await fetch(`${BASE}/repos/${owner}/${repo}`, { headers: headers(token) });
    if (!repoRes.ok) throw new Error("Repository not found");
    const repoData = (await repoRes.json()) as { default_branch: string };
    const treeRes = await fetch(`${BASE}/repos/${owner}/${repo}/git/trees/${repoData.default_branch}?recursive=1`, { headers: headers(token) });
    if (!treeRes.ok) throw new Error("Failed to fetch tree");
    const tree = (await treeRes.json()) as { tree: Array<{ path: string; type: string; url: string; size?: number }> };
    const TEXT_EXTS = new Set(["html", "css", "js", "ts", "json", "md"]);
    const relevant = tree.tree.filter((i) => i.type === "blob" && TEXT_EXTS.has(i.path.split(".").pop()?.toLowerCase() ?? "") && (i.size ?? 0) < 200_000);
    const files: Array<{ name: string; content: string }> = [];
    for (const item of relevant.slice(0, 20)) {
      const blobRes = await fetch(item.url, { headers: headers(token) });
      if (!blobRes.ok) continue;
      const blob = (await blobRes.json()) as { content?: string; encoding?: string };
      if (!blob.content || blob.encoding !== "base64") continue;
      files.push({ name: item.path, content: atob(blob.content.replace(/\n/g, "")) });
    }
    return files;
  },
});

async function pushFilesToRepo(opts: { token: string; owner: string; repo: string; branch: string; files: Array<{ path: string; content: string }>; message: string }) {
  const { token, owner, repo, branch, files, message } = opts;
  const h = headers(token);
  const refRes = await fetch(`${BASE}/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers: h });
  if (!refRes.ok) throw new Error("Failed to get branch ref");
  const ref = (await refRes.json()) as { object: { sha: string } };
  const commitRes = await fetch(`${BASE}/repos/${owner}/${repo}/git/commits/${ref.object.sha}`, { headers: h });
  if (!commitRes.ok) throw new Error("Failed to get commit");
  const commit = (await commitRes.json()) as { tree: { sha: string } };
  const treeItems = await Promise.all(files.map(async (f) => {
    const blobRes = await fetch(`${BASE}/repos/${owner}/${repo}/git/blobs`, { method: "POST", headers: h, body: JSON.stringify({ content: f.content, encoding: "utf-8" }) });
    if (!blobRes.ok) throw new Error(`Failed blob for ${f.path}`);
    const blob = (await blobRes.json()) as { sha: string };
    return { path: f.path, mode: "100644" as const, type: "blob" as const, sha: blob.sha };
  }));
  const treeRes = await fetch(`${BASE}/repos/${owner}/${repo}/git/trees`, { method: "POST", headers: h, body: JSON.stringify({ base_tree: commit.tree.sha, tree: treeItems }) });
  if (!treeRes.ok) throw new Error("Failed to create tree");
  const newTree = (await treeRes.json()) as { sha: string };
  const newCommitRes = await fetch(`${BASE}/repos/${owner}/${repo}/git/commits`, { method: "POST", headers: h, body: JSON.stringify({ message, tree: newTree.sha, parents: [ref.object.sha] }) });
  if (!newCommitRes.ok) throw new Error("Failed to create commit");
  const newCommit = (await newCommitRes.json()) as { sha: string };
  const updateRes = await fetch(`${BASE}/repos/${owner}/${repo}/git/refs/heads/${branch}`, { method: "PATCH", headers: h, body: JSON.stringify({ sha: newCommit.sha }) });
  if (!updateRes.ok) throw new Error("Failed to update ref");
}
