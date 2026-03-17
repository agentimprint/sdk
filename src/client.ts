// ============================================================
// Agent Imprint SDK — Main Client
// ============================================================

import { HttpClient } from './http.js';
import { AgentsResource } from './resources/agents.js';
import { EntriesResource } from './resources/entries.js';
import { OrganizationsResource } from './resources/organizations.js';
import { VaultsResource } from './resources/vaults.js';
import type { ImprintClientConfig } from './types.js';

export const DEFAULT_BASE_URL = 'https://api.agentimprint.io';

/**
 * ImprintClient — main entry point for the Agent Imprint SDK.
 *
 * @example
 * ```ts
 * const client = new ImprintClient({ apiKey: 'your-api-key' });
 * const agents = await client.agents.list();
 * ```
 */
export class ImprintClient {
  public readonly organizations: OrganizationsResource;
  public readonly agents: AgentsResource;
  public readonly vaults: VaultsResource;
  public readonly entries: EntriesResource;

  private readonly http: HttpClient;

  /**
   * Public discovery — check if an agent fingerprint exists (no auth required).
   * Uses the unauthenticated /api/v1/discover endpoint.
   */
  static async probe(fingerprint: string, baseUrl?: string): Promise<{ exists: boolean }> {
    const url = (baseUrl ?? DEFAULT_BASE_URL) + '/api/v1/discover/' + encodeURIComponent(fingerprint);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Discovery probe failed: ' + response.status);
    }
    const json = await response.json() as { data: { exists: boolean } };
    return json.data;
  }

  constructor(config: ImprintClientConfig) {
    if (!config.apiKey) {
      throw new Error('ImprintClient: apiKey is required');
    }

    const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.http = new HttpClient(config.apiKey, baseUrl);

    this.organizations = new OrganizationsResource(this.http);
    this.agents = new AgentsResource(this.http);
    this.vaults = new VaultsResource(this.http);
    this.entries = new EntriesResource(this.http);
  }
}
