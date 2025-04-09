import dotenv from "dotenv";
dotenv.config();

import { cleanupThreads } from "./scripts/thread-cleanup";
import { getLimiter, wait } from "./rate-limiter";
import {
  getIssue,
  getIssues,
  getJustIssues,
  GithubPagination,
} from "./github-api";

async function main() {
  const issues = await getJustIssues({
    username: "remotion-dev",
    repo: "remotion",
    n: 100,
  });
  console.log(issues.length);
}

console.log("Starting...");
main();
