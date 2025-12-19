import { APIRequestContext, APIResponse } from "@playwright/test";
import { Logger } from "./Logger";

export class ApiClient {
    private logger: Logger;

    constructor(private request: APIRequestContext) {
        this.logger = new Logger('ApiClient');
    }

    async sendGetRequest(path: string, params?: { [key: string]: string | number | boolean }): Promise<APIResponse> {
        const response = await this.request.get(path, { params });
        await this.logRequest('GET', path, params, response);
        return response;
    }

    /**
       * Generic POST method
       * @param path - The endpoint path
       * @param data - The request body payload
       */
    async sendPostRequest(path: string, data: any): Promise<APIResponse> {
        const response = await this.request.post(path, { data });
        await this.logRequest('POST', path, data, response);
        return response;
    }

    /**
     * Generic PUT method - replaces entire resource
     * @param path - The endpoint path
     * @param data - The request body payload
     */
    async sendPutRequest(path: string, data: any): Promise<APIResponse> {
        const response = await this.request.put(path, { data });
        await this.logRequest('PUT', path, data, response);
        return response;
    }

    /**
     * Generic PATCH method - partial update
     * @param path - The endpoint path
     * @param data - The request body payload (partial resource)
     */
    async sendPatchRequest(path: string, data: any): Promise<APIResponse> {
        const response = await this.request.patch(path, { data });
        await this.logRequest('PATCH', path, data, response);
        return response;
    }

    async sendDeleteRequest(path: string): Promise<APIResponse> {
        const response = await this.request.delete(path);
        await this.logRequest('DELETE', path, undefined, response);
        return response;
    }

    private async logRequest(method: string, path: string, data: any, response: APIResponse) {
        this.logger.info(`[${method}] ${path}`);
        if (data) this.logger.debug(`Payload: ${JSON.stringify(data, null, 2)}`);
        this.logger.info(`Status: ${response.status()} ${response.statusText()}`);

        // Only log response body if it failed, to keep logs clean
        if (!response.ok()) {
            this.logger.error(`Error Body: ${await response.text()}`);
        }
    }

}