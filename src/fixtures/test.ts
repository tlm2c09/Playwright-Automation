import { ApiClient } from "../lib/api-client";
import { IssueService } from "../services/issue-service";
import { test as base } from '@playwright/test';

type MyFixtures = {
    apiClient: ApiClient;
    issueService: IssueService;
};

export const test = base.extend<MyFixtures>({
    apiClient: async ({ request }, use) => {
        const apiClient = new ApiClient(request);
        await use(apiClient);
    },
    issueService: async ({ apiClient }, use) => {
        const issueService = new IssueService(apiClient['request']);
        // 1. Storage for IDs created during THIS specific test
        const createdIssueNumbers: { owner: string; repo: string; number: number }[] = [];

        // 2. Intercept/Wrap the createIssue method
        // We save the original method reference
        const originalCreate = issueService.createIssue.bind(issueService);
        // We overwrite it with a wrapper
        issueService.createIssue = async (owner: string, repo: string, payload: any) => {
            // Call the API
            const response = await originalCreate(owner, repo, payload);
            // If creation was successful, track the ID
            if (response.ok()) {
                const body = await response.json();
                // Add to our cleanup list
                createdIssueNumbers.push({ owner, repo, number: body.number });
            }
            return response;
        };
        await use(issueService);
        // 4. TEARDOWN PHASE (Runs automatically after test ends)
        // We reverse loop to clean up the most recently created first
        for (const issue of createdIssueNumbers.reverse()) {
            console.log(`[Auto-Cleanup] Closing Issue #${issue.number}...`);
            await issueService.closeIssue(issue.owner, issue.repo, issue.number);
        }
    },
});

export { expect } from '@playwright/test';