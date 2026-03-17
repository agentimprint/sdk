import type { HttpClient } from '../http.js';
import type {
  Agent,
  CreateAgentParams,
  DiscoverResult,
  GenerateKeyResult,
  RecoverKeyResult,
  SplitKeyParams,
  SplitKeyResult,
} from '../types.js';

export class AgentsResource {
  constructor(private readonly http: HttpClient) {}

  async create(params: CreateAgentParams): Promise<Agent> {
    const response = await this.http.post<{ data: Agent }>('/api/v1/agents', params);
    return response.data;
  }

  async list(): Promise<Agent[]> {
    const response = await this.http.get<{ data: Agent[] }>('/api/v1/agents');
    return response.data;
  }

  async get(uuid: string): Promise<Agent> {
    const response = await this.http.get<{ data: Agent }>(`/api/v1/agents/${uuid}`);
    return response.data;
  }

  async discover(fingerprint: string): Promise<DiscoverResult> {
    const response = await this.http.get<{ data: DiscoverResult }>(
      `/api/v1/agents/discover/${fingerprint}`,
    );
    return response.data;
  }

  async generateKey(uuid: string): Promise<GenerateKeyResult> {
    const response = await this.http.post<{ data: GenerateKeyResult }>(
      `/api/v1/agents/${uuid}/keys/generate`,
    );
    return response.data;
  }

  async splitKey(uuid: string, params: SplitKeyParams): Promise<SplitKeyResult> {
    const response = await this.http.post<{ data: SplitKeyResult }>(
      `/api/v1/agents/${uuid}/keys/split`,
      params,
    );
    return response.data;
  }

  async recoverKey(uuid: string, shares: string[]): Promise<RecoverKeyResult> {
    const response = await this.http.post<{ data: RecoverKeyResult }>(
      `/api/v1/agents/${uuid}/keys/recover`,
      { shares },
    );
    return response.data;
  }
}
