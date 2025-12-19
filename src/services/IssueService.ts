import { APIRequestContext, APIResponse } from "@playwright/test";
import { ApiClient } from "../lib/ApiClient";

export interface IssuePayload {
    title: string;
    body?: string;
    assignees?: string[];
    milestone?: number;
    labels?: string[];
}

export class IssueService extends ApiClient {

    async createIssue(owner: string, repo: string, payload: IssuePayload): Promise<APIResponse> {
        return this.sendPostRequest(`/repos/${owner}/${repo}/issues`, payload);
    }

    /**
   * Get a generic list of issues
   */
    async getIssues(owner: string, repo: string): Promise<APIResponse> {
        const endpoint = `/repos/${owner}/${repo}/issues`;
        return this.sendGetRequest(endpoint);
    }

    /**
     * Get a specific issue by number
     */
    async getIssueByNumber(owner: string, repo: string, issueNumber: number): Promise<APIResponse> {
        const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}`;
        return this.sendGetRequest(endpoint);
    }

    /**
     * Update an issue - PATCH for partial updates
     * @example updateIssue('owner', 'repo', 123, { title: 'New Title' })
     */
    async updateIssue(owner: string, repo: string, issueNumber: number, payload: Partial<IssuePayload>): Promise<APIResponse> {
        const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}`;
        return this.sendPatchRequest(endpoint, payload);
    }

    /**
     * Close an issue by setting state to 'closed'
     */
    async closeIssue(owner: string, repo: string, issueNumber: number): Promise<APIResponse> {
        const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}`;
        const payload = { state: 'closed' };
        return this.sendPostRequest(endpoint, payload);
    }

    /**
     * Reopen a closed issue
     */
    async reopenIssue(owner: string, repo: string, issueNumber: number): Promise<APIResponse> {
        const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}`;
        const payload = { state: 'open' };
        return this.sendPostRequest(endpoint, payload);
    }

}