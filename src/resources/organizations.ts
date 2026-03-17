import type { HttpClient } from '../http.js';
import type { Organization, OrganizationWithKey } from '../types.js';

export class OrganizationsResource {
  constructor(private readonly http: HttpClient) {}

  async create(name: string): Promise<OrganizationWithKey> {
    const response = await this.http.post<{ data: Organization; api_key: string }>(
      '/api/v1/organizations',
      { name },
      false,
    );
    return { ...response.data, apiKey: response.api_key };
  }

  async get(uuid: string): Promise<Organization> {
    const response = await this.http.get<{ data: Organization }>(`/api/v1/organizations/${uuid}`);
    return response.data;
  }
}
