import { KnowledgeGroup } from "libs/prisma";
import { BaseKbProcesser, KbProcesserListener } from "./kb-processer";
import {
  getIssueMarkdown,
  getIssueTimeline,
  getJustIssues,
} from "../github-api";
import { githubApiRateLimiter } from "../rate-limiter";

const ISSUES_TO_FETCH: Record<string, number> = {
  "692bb91325e4f55feefdfe82": 10000,
};

export class GithubIssuesKbProcesser extends BaseKbProcesser {
  constructor(
    protected listener: KbProcesserListener,
    private readonly knowledgeGroup: KnowledgeGroup
  ) {
    super(listener);
  }

  async process() {
    if (!this.knowledgeGroup.url) {
      throw new Error("Knowledge group URL is required");
    }

    const match = this.knowledgeGroup.url.match(
      "https://(www.)?github.com/(.+)/(.+)"
    );
    if (!match) {
      throw new Error("Invalid GitHub URL");
    }

    const [, , username, repo] = match;

    const issues = await getJustIssues({
      repo,
      username,
      n: ISSUES_TO_FETCH[this.knowledgeGroup.id] ?? 100,
    });

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      if (issue.pull_request) {
        continue;
      }

      const timeline = await getIssueTimeline({
        repo,
        username,
        issueNumber: issue.number,
      });

      await this.onContentAvailable(issue.html_url, {
        text: getIssueMarkdown(issue, timeline),
        title: issue.title,
      });

      await githubApiRateLimiter.wait();
    }
  }
}
