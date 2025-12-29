import { APIRequestContext, APIResponse } from "@playwright/test";
import { ApiClient } from "../lib/api-client";

export interface IssuePayload {
    title: string;
    body?: string;
    assignees?: string[];
    milestone?: number;
    labels?: string[];
}

export class IssueService extends ApiClient {

    private buildIssuesEndpoint(owner: string, repo: string): string {
        return `/repos/${owner}/${repo}/issues`;
    }

    private buildIssueEndpoint(owner: string, repo: string, issueNumber: number): string {
        return `${this.buildIssuesEndpoint(owner, repo)}/${issueNumber}`;
    }

    async createIssue(owner: string, repo: string, payload: IssuePayload): Promise<APIResponse> {
        return this.sendPostRequest(this.buildIssuesEndpoint(owner, repo), payload);
    }

    /**
   * Get a generic list of issues
   */
    async getIssues(owner: string, repo: string): Promise<APIResponse> {
        const endpoint = this.buildIssuesEndpoint(owner, repo);
        return this.sendGetRequest(endpoint);
    }

    /**
     * Get a specific issue by number
     */
    async getIssueByNumber(owner: string, repo: string, issueNumber: number): Promise<APIResponse> {
        const endpoint = this.buildIssueEndpoint(owner, repo, issueNumber);
        return this.sendGetRequest(endpoint);
    }

    /**
     * Update an issue - PATCH for partial updates
     * @example updateIssue('owner', 'repo', 123, { title: 'New Title' })
     */
    async updateIssue(owner: string, repo: string, issueNumber: number, payload: Partial<IssuePayload>): Promise<APIResponse> {
        const endpoint = this.buildIssueEndpoint(owner, repo, issueNumber);
        return this.sendPatchRequest(endpoint, payload);
    }

    /**
     * Close an issue by setting state to 'closed'
     */
    async closeIssue(owner: string, repo: string, issueNumber: number): Promise<APIResponse> {
        const endpoint = this.buildIssueEndpoint(owner, repo, issueNumber);
        const payload = { state: 'closed' };
        return this.sendPostRequest(endpoint, payload);
    }

    /**
     * Reopen a closed issue
     */
    async reopenIssue(owner: string, repo: string, issueNumber: number): Promise<APIResponse> {
        const endpoint = this.buildIssueEndpoint(owner, repo, issueNumber);
        const payload = { state: 'open' };
        return this.sendPostRequest(endpoint, payload);
    }

}