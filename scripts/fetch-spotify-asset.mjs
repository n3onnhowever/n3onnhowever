import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const upstreamCommit = "0f605fac8dbaac17000b40c6bb8df7c3b89839db";
const templateUrl = `https://raw.githubusercontent.com/kittinan/spotify-github-profile/${upstreamCommit}/api/templates/spotify.spotify-embed.html.j2`;
const artworkUrl = "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02a4b60ff473609fd7167f608b";
const outputPath = resolve(process.cwd(), "assets", "spotify-new-trip.svg");

const [templateResponse, artworkResponse] = await Promise.all([
  fetch(templateUrl, { headers: { "User-Agent": "n3onnhowever-profile-builder" } }),
  fetch(artworkUrl, { headers: { "User-Agent": "n3onnhowever-profile-builder" } }),
]);

if (!templateResponse.ok) {
  throw new Error(`spotify template: upstream returned ${templateResponse.status}`);
}
if (!artworkResponse.ok) {
  throw new Error(`spotify artwork: upstream returned ${artworkResponse.status}`);
}

const template = await templateResponse.text();
const artwork = Buffer.from(await artworkResponse.arrayBuffer()).toString("base64");

function tokenize(source) {
  const tokens = [];
  const pattern = /\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/g;
  let lastIndex = 0;

  for (const match of source.matchAll(pattern)) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: source.slice(lastIndex, match.index) });
    }
    const value = match[0];
    tokens.push(value.startsWith("{%")
      ? { type: "tag", value: value.slice(2, -2).trim() }
      : { type: "expression", value: value.slice(2, -2).trim() });
    lastIndex = match.index + value.length;
  }

  if (lastIndex < source.length) {
    tokens.push({ type: "text", value: source.slice(lastIndex) });
  }
  return tokens;
}

function conditionValue(condition) {
  const normalized = condition.replaceAll(" ", "");
  if (["mode=='dark'", "cover_imageandimg", "is_now_playing", "progress_data", "song_name"].includes(normalized)) {
    return true;
  }
  throw new Error(`Unsupported upstream template condition: ${condition}`);
}

function renderBlock(tokens, startIndex, stopTags = new Set()) {
  let output = "";
  let index = startIndex;

  while (index < tokens.length) {
    const token = tokens[index];
    if (token.type === "tag" && stopTags.has(token.value)) {
      return { output, index, stopTag: token.value };
    }
    if (token.type === "text") {
      output += token.value;
      index += 1;
      continue;
    }
    if (token.type === "expression") {
      output += renderExpression(token.value);
      index += 1;
      continue;
    }
    if (token.type === "tag" && token.value.startsWith("if ")) {
      const trueBranch = renderBlock(tokens, index + 1, new Set(["else", "endif"]));
      let falseBranch = { output: "", index: trueBranch.index, stopTag: trueBranch.stopTag };
      if (trueBranch.stopTag === "else") {
        falseBranch = renderBlock(tokens, trueBranch.index + 1, new Set(["endif"]));
      }
      if (falseBranch.stopTag !== "endif") {
        throw new Error(`Unclosed upstream template condition: ${token.value}`);
      }
      output += conditionValue(token.value.slice(3).trim()) ? trueBranch.output : falseBranch.output;
      index = falseBranch.index + 1;
      continue;
    }
    throw new Error(`Unsupported upstream template tag: ${token.value}`);
  }

  return { output, index, stopTag: null };
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderExpression(expression) {
  const key = expression.replace("|safe", "").trim();
  const values = {
    border_radius: "12",
    song_name: escapeHtml("New Trip (feat. Yeat & BNYX®)"),
    artist_name: escapeHtml("Quavo, Yeat, BNYX®"),
    img: artwork,
    title_text: "ON REPEAT",
    "progress_data.progress_percentage": "50",
    "progress_data.current_time": "1:44",
    "progress_data.remaining_time": "-1:43",
    "song_name|length // 10": "1",
    "(song_name|length % 10) * 6": "0",
  };

  if (!(key in values)) {
    throw new Error(`Unsupported upstream template expression: ${expression}`);
  }
  return values[key];
}

let svg = renderBlock(tokenize(template), 0).output;

for (const [from, to] of [
  ["#181818", "#080B18"],
  ["#282828", "#0F172A"],
  ["#ffffff", "#F2F1FF"],
  ["#b3b3b3", "#A5B4FC"],
  ["#1db954", "#22C7F3"],
  ["#404040", "#1F2A44"],
  ["#535353", "#312E81"],
  ["#a7a7a7", "#94A3B8"],
  ["#6a6a6a", "#94A3B8"],
]) {
  svg = svg.replaceAll(from, to);
}

if (!svg.includes("<svg") || svg.includes("{{") || svg.includes("{%")) {
  throw new Error("spotify-new-trip.svg: upstream template was not fully rendered");
}

await mkdir(resolve(process.cwd(), "assets"), { recursive: true });
await writeFile(outputPath, svg, "utf8");
console.log(`spotify-new-trip.svg <- ${templateUrl}`);
