import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const assetsDirectory = resolve(process.cwd(), "assets");

function capsuleUrl(parameters) {
  return `https://capsule-render.vercel.app/api?${new URLSearchParams(parameters)}`;
}

const color = "0:020617,42:0f172a,72:312e81,100:701a75";
const assets = [
  {
    file: "header.svg",
    source: capsuleUrl({
      type: "waving",
      color,
      height: "250",
      section: "header",
      text: "n3onnhowever",
      fontSize: "58",
      fontColor: "f8fafc",
      animation: "fadeIn",
      fontAlignY: "40",
      desc: "ML Developer - Data Engineer - Product Builder",
      descAlignY: "61",
      descSize: "18",
    }),
  },
  {
    file: "typing.svg",
    source:
      "https://readme-typing-svg.demolab.com?font=JetBrains+Mono&size=22&duration=3200&pause=900&color=58A6FF&center=true&vCenter=true&width=900&height=70&lines=Applied+ML+that+ships;Data+systems+operators+can+trust;Interfaces+that+make+complex+work+usable",
  },
  {
    file: "skills.svg",
    source:
      "https://skillicons.dev/icons?i=python,ts,js,fastapi,react,svelte,vite,nodejs,docker,postgres,pytorch,git,github,linux&theme=dark&perline=14",
  },
  {
    file: "footer.svg",
    source: capsuleUrl({
      type: "waving",
      color,
      height: "120",
      section: "footer",
      reversal: "true",
    }),
  },
];

await mkdir(assetsDirectory, { recursive: true });

for (const asset of assets) {
  const response = await fetch(asset.source, {
    headers: { "User-Agent": "n3onnhowever-profile-builder" },
  });
  if (!response.ok) {
    throw new Error(`${asset.file}: upstream returned ${response.status}`);
  }

  const svg = await response.text();
  if (!svg.includes("<svg") || svg.length > 2_000_000) {
    throw new Error(`${asset.file}: upstream response is not a valid SVG asset`);
  }

  await writeFile(resolve(assetsDirectory, asset.file), svg, "utf8");
  console.log(`${asset.file} <- ${new URL(asset.source).hostname}`);
}
