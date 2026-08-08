import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const API_ROOT = "https://api.github.com";
const START_MARKER = "<!-- profile-stats:start -->";
const END_MARKER = "<!-- profile-stats:end -->";

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
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

  return response.json();
}

async function listPublicRepositories(login) {
  const repositories = [];

  for (let page = 1; page <= 10; page += 1) {
    const batch = await githubJson(
      `/users/${encodeURIComponent(login)}/repos?type=owner&sort=pushed&per_page=100&page=${page}`,
      undefined,
    );

    repositories.push(...batch);
    if (batch.length < 100) break;
  }

  return repositories;
}

async function fetchPublicStats(login, token) {
  const [repositories, pullRequests, contributions] = await Promise.all([
    listPublicRepositories(login),
    githubJson(
      `/search/issues?q=${encodeURIComponent(`author:${login} type:pr`)}`,
      undefined,
    ),
    githubJson("/graphql", token, {
      method: "POST",
      body: JSON.stringify({
        query: `
          query ProfileContributions($login: String!) {
            user(login: $login) {
              contributionsCollection {
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
  if (!collection) {
    throw new Error("GitHub GraphQL response did not include contribution data.");
  }

  const publicProjects = repositories.filter(
    (repository) =>
      !repository.fork &&
      !repository.archived &&
      repository.name.toLowerCase() !== login.toLowerCase(),
  ).length;

  const profileRepository = `${login}/${login}`.toLowerCase();
  const publicCommits = collection.commitContributionsByRepository
    .filter(
      ({ repository }) =>
        !repository.isPrivate &&
        repository.nameWithOwner.toLowerCase() !== profileRepository,
    )
    .reduce((total, entry) => total + entry.contributions.totalCount, 0);

  return {
    publicProjects,
    publicCommits,
    publicPullRequests: pullRequests.total_count,
  };
}

export function buildStatsBlock(login, stats) {
  const profileUrl = `https://github.com/${login}`;
  const repositoriesUrl = `${profileUrl}?tab=repositories&type=source`;
  const pullRequestsUrl = `https://github.com/search?q=${encodeURIComponent(`type:pr author:${login}`)}&type=pullrequests`;

  return [
    START_MARKER,
    "| Public source projects | Public commits, last 12 months | Public pull requests |",
    "| :---: | :---: | :---: |",
    `| [${formatNumber(stats.publicProjects)}](${repositoriesUrl}) | [${formatNumber(stats.publicCommits)}](${profileUrl}?tab=overview) | [${formatNumber(stats.publicPullRequests)}](${pullRequestsUrl}) |`,
    END_MARKER,
  ].join("\n");
}

export function replaceStatsBlock(readme, statsBlock) {
  const start = readme.indexOf(START_MARKER);
  const end = readme.indexOf(END_MARKER);

  if (start === -1 || end === -1 || end < start) {
    throw new Error("README profile stats markers are missing or out of order.");
  }

  return `${readme.slice(0, start)}${statsBlock}${readme.slice(end + END_MARKER.length)}`;
}

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const login = process.env.PROFILE_LOGIN || process.env.GITHUB_REPOSITORY_OWNER;
  const readmePath = resolve(process.env.PROFILE_README_PATH || "README.md");

  if (!token) throw new Error("GITHUB_TOKEN is required.");
  if (!login) throw new Error("PROFILE_LOGIN or GITHUB_REPOSITORY_OWNER is required.");

  const [readme, stats] = await Promise.all([
    readFile(readmePath, "utf8"),
    fetchPublicStats(login, token),
  ]);

  const updated = replaceStatsBlock(readme, buildStatsBlock(login, stats));
  if (updated !== readme) await writeFile(readmePath, updated, "utf8");

  console.log(`Updated public profile statistics for ${login}.`);
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
