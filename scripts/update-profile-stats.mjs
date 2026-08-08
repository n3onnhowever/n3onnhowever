import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const API_ROOT = "https://api.github.com";

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatSnapshotDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) throw new Error("Invalid privateSnapshotDate.");

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(date)
    .toUpperCase();
}

function requireNonNegativeInteger(value, name) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer.`);
  }

  return value;
}

async function githubJson(path, token, init = {}) {
  const authorization = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...authorization,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 500)}`);
  }

  const body = await response.json();
  if (body.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${body.errors[0].message}`);
  }

  return body;
}

async function listPublicRepositories(login) {
  const repositories = [];

  for (let page = 1; page <= 10; page += 1) {
    const batch = await githubJson(
      `/users/${encodeURIComponent(login)}/repos?type=owner&sort=pushed&per_page=100&page=${page}`,
    );

    repositories.push(...batch);
    if (batch.length < 100) break;
  }

  return repositories;
}

async function fetchPublicProfileStats(login, token) {
  const [repositories, contributions] = await Promise.all([
    listPublicRepositories(login),
    githubJson("/graphql", token, {
      method: "POST",
      body: JSON.stringify({
        query: `
          query ProfileActivity($login: String!) {
            user(login: $login) {
              contributionsCollection {
                restrictedContributionsCount
                commitContributionsByRepository(maxRepositories: 100) {
                  repository {
                    isPrivate
                    nameWithOwner
                  }
                  contributions {
                    totalCount
                  }
                }
              }
            }
          }
        `,
        variables: { login },
      }),
      headers: { "Content-Type": "application/json" },
    }),
  ]);

  const collection = contributions.data?.user?.contributionsCollection;
  if (!collection) throw new Error("GitHub did not return contribution data.");

  const publicProjects = repositories.filter(
    (repository) =>
      !repository.fork &&
      !repository.archived &&
      repository.name.toLowerCase() !== login.toLowerCase(),
  ).length;

  const profileRepository = `${login}/${login}`.toLowerCase();
  const publicCommits12m = collection.commitContributionsByRepository
    .filter(
      ({ repository }) =>
        !repository.isPrivate &&
        repository.nameWithOwner.toLowerCase() !== profileRepository,
    )
    .reduce((total, entry) => total + entry.contributions.totalCount, 0);

  return {
    publicProjects,
    publicCommits12m,
    privateContributions12m: collection.restrictedContributionsCount,
  };
}

export function composeActivityStats(publicStats, privateSnapshot) {
  const publicProjects = requireNonNegativeInteger(
    publicStats.publicProjects,
    "publicProjects",
  );
  const publicCommits12m = requireNonNegativeInteger(
    publicStats.publicCommits12m,
    "publicCommits12m",
  );
  const privateContributions12m = requireNonNegativeInteger(
    publicStats.privateContributions12m,
    "privateContributions12m",
  );
  const privateRepositories = requireNonNegativeInteger(
    privateSnapshot.privateRepositories,
    "privateRepositories",
  );
  const privateCommits12m = requireNonNegativeInteger(
    privateSnapshot.privateDefaultBranchCommits12m,
    "privateDefaultBranchCommits12m",
  );
  const pullRequestsAllTime = requireNonNegativeInteger(
    privateSnapshot.pullRequestsAllTime,
    "pullRequestsAllTime",
  );

  return {
    publicProjects,
    privateRepositories,
    projectRepositories: publicProjects + privateRepositories,
    publicCommits12m,
    privateCommits12m,
    totalCommits12m: publicCommits12m + privateCommits12m,
    privateContributions12m,
    pullRequestsAllTime,
    snapshotLabel: formatSnapshotDate(privateSnapshot.privateSnapshotDate),
  };
}

export function buildActivitySvg(login, stats) {
  const safeLogin = escapeXml(login);
  const values = {
    repositories: formatNumber(stats.projectRepositories),
    totalCommits: formatNumber(stats.totalCommits12m),
    privateContributions: formatNumber(stats.privateContributions12m),
    pullRequests: formatNumber(stats.pullRequestsAllTime),
    publicProjects: formatNumber(stats.publicProjects),
    privateRepositories: formatNumber(stats.privateRepositories),
    publicCommits: formatNumber(stats.publicCommits12m),
    privateCommits: formatNumber(stats.privateCommits12m),
    snapshot: escapeXml(stats.snapshotLabel),
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 286" role="img" aria-labelledby="title desc">
  <title id="title">GitHub activity for ${safeLogin}</title>
  <desc id="desc">Aggregate public and anonymized private activity without repository details.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0a1020"/><stop offset="1" stop-color="#141024"/></linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#38bdf8"/><stop offset="0.34" stop-color="#34d399"/><stop offset="0.68" stop-color="#a78bfa"/><stop offset="1" stop-color="#f472b6"/></linearGradient>
    <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#94a3b8" stroke-opacity="0.045"/></pattern>
  </defs>
  <style>
    .sans { font-family: "Segoe UI", Inter, Arial, sans-serif; }
    .mono { font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace; }
    .signal { stroke-dasharray: 80 24; animation: signal 10s linear infinite; }
    .live { animation: live 2.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
    @keyframes signal { to { stroke-dashoffset: -416; } }
    @keyframes live { 0%, 100% { opacity: 0.45; transform: scale(0.85); } 50% { opacity: 1; transform: scale(1.15); } }
    @media (prefers-reduced-motion: reduce) { .signal, .live { animation: none; } }
  </style>
  <rect x="1" y="1" width="1198" height="284" rx="20" fill="url(#bg)" stroke="#334155" stroke-opacity="0.72"/>
  <rect x="1" y="1" width="1198" height="284" rx="20" fill="url(#grid)"/>
  <text class="mono" x="32" y="38" fill="#94a3b8" font-size="11" letter-spacing="2">ACTIVITY / PRIVATE WORK INCLUDED</text>
  <circle class="live" cx="1144" cy="33" r="5" fill="#34d399" filter="url(#glow)"/>
  <text class="mono" x="1132" y="37" text-anchor="end" fill="#86efac" font-size="10">SAFE AGGREGATES</text>
  <line class="signal" x1="32" y1="55" x2="1168" y2="55" stroke="url(#accent)" stroke-width="2"/>

  <g transform="translate(32 76)">
    <rect width="266" height="142" rx="16" fill="#0c192a" stroke="#38bdf8" stroke-opacity="0.42"/>
    <text class="sans" x="20" y="58" fill="#f8fafc" font-size="38" font-weight="700">${values.repositories}</text>
    <text class="mono" x="20" y="83" fill="#7dd3fc" font-size="11" letter-spacing="1.5">PROJECT REPOSITORIES</text>
    <text class="sans" x="20" y="112" fill="#64748b" font-size="12">${values.publicProjects} public / ${values.privateRepositories} private</text>
    <circle cx="238" cy="29" r="7" fill="#38bdf8" opacity="0.8"/>
  </g>
  <g transform="translate(322 76)">
    <rect width="266" height="142" rx="16" fill="#10231f" stroke="#34d399" stroke-opacity="0.42"/>
    <text class="sans" x="20" y="58" fill="#f8fafc" font-size="38" font-weight="700">${values.totalCommits}</text>
    <text class="mono" x="20" y="83" fill="#86efac" font-size="11" letter-spacing="1.5">COMMITS / 12 MONTHS</text>
    <text class="sans" x="20" y="112" fill="#64748b" font-size="12">${values.publicCommits} public / ${values.privateCommits} private*</text>
    <circle cx="238" cy="29" r="7" fill="#34d399" opacity="0.8"/>
  </g>
  <g transform="translate(612 76)">
    <rect width="266" height="142" rx="16" fill="#1b1730" stroke="#a78bfa" stroke-opacity="0.44"/>
    <text class="sans" x="20" y="58" fill="#f8fafc" font-size="38" font-weight="700">${values.privateContributions}</text>
    <text class="mono" x="20" y="83" fill="#c4b5fd" font-size="11" letter-spacing="1.2">PRIVATE ACTIVITY / 12M</text>
    <text class="sans" x="20" y="112" fill="#64748b" font-size="12">anonymized by GitHub</text>
    <circle cx="238" cy="29" r="7" fill="#a78bfa" opacity="0.82"/>
  </g>
  <g transform="translate(902 76)">
    <rect width="266" height="142" rx="16" fill="#261522" stroke="#f472b6" stroke-opacity="0.42"/>
    <text class="sans" x="20" y="58" fill="#f8fafc" font-size="38" font-weight="700">${values.pullRequests}</text>
    <text class="mono" x="20" y="83" fill="#f9a8d4" font-size="11" letter-spacing="1.5">PULL REQUESTS</text>
    <text class="sans" x="20" y="112" fill="#64748b" font-size="12">aggregate / all time</text>
    <circle cx="238" cy="29" r="7" fill="#f472b6" opacity="0.82"/>
  </g>

  <text class="mono" x="32" y="254" fill="#64748b" font-size="9">* PRIVATE COMMIT AGGREGATE IS A DATED SNAPSHOT / ${values.snapshot} / NO REPOSITORY DETAILS EXPOSED</text>
  <text class="mono" x="1168" y="254" text-anchor="end" fill="#475569" font-size="9">${safeLogin}</text>
</svg>
`;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const login = process.env.PROFILE_LOGIN || process.env.GITHUB_REPOSITORY_OWNER;
  const dataPath = resolve(process.env.PROFILE_DATA_PATH || "profile-data.json");
  const outputPath = resolve(process.env.PROFILE_ACTIVITY_PATH || "assets/activity.svg");

  if (!token) throw new Error("GITHUB_TOKEN is required.");
  if (!login) throw new Error("PROFILE_LOGIN or GITHUB_REPOSITORY_OWNER is required.");

  const [privateSnapshotText, publicStats] = await Promise.all([
    readFile(dataPath, "utf8"),
    fetchPublicProfileStats(login, token),
  ]);
  const privateSnapshot = JSON.parse(privateSnapshotText);
  const stats = composeActivityStats(publicStats, privateSnapshot);
  const nextSvg = buildActivitySvg(login, stats);

  let currentSvg = "";
  try {
    currentSvg = await readFile(outputPath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  if (nextSvg !== currentSvg) await writeFile(outputPath, nextSvg, "utf8");
  console.log(`Updated safe aggregate activity card for ${login}.`);
}

const isMain = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url
  : false;

if (isMain) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
