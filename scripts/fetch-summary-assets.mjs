import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const outputDirectory = resolve(process.cwd(), "profile-summary-card-output", "tokyonight");
const username = "n3onnhowever";
const cards = [
  ["0-profile-details.svg", "profile-details"],
  ["1-repos-per-language.svg", "repos-per-language"],
  ["2-most-commit-language.svg", "most-commit-language"],
  ["3-stats.svg", "stats"],
  ["4-productive-time.svg", "productive-time"],
];

await mkdir(outputDirectory, { recursive: true });

for (const [file, card] of cards) {
  const url = new URL(`https://github-profile-summary-cards.vercel.app/api/cards/${card}`);
  url.searchParams.set("username", username);
  url.searchParams.set("theme", "tokyonight");
  url.searchParams.set("utcOffset", "3");

  const response = await fetch(url, {
    headers: { "User-Agent": "n3onnhowever-profile-builder" },
  });
  if (!response.ok) {
    throw new Error(`${file}: upstream returned ${response.status}`);
  }

  const svg = await response.text();
  if (!svg.includes("<svg") || svg.length > 2_000_000) {
    throw new Error(`${file}: upstream response is not a valid SVG asset`);
  }

  await writeFile(resolve(outputDirectory, file), svg, "utf8");
  console.log(`${file} <- ${url.hostname}`);
}
