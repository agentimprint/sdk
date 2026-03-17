import type { HttpClient } from '../http.js';
import type {
  CreateVaultParams,
  ImportResult,
  MerkleInfo,
  Snapshot,
  Vault,
  VaultExport,
  VaultStats,
  VerifyResult,
} from '../types.js';

export class VaultsResource {
  constructor(private readonly http: HttpClient) {}

  async create(params: CreateVaultParams): Promise<Vault> {
    const response = await this.http.post<{ data: Vault }>('/api/v1/vaults', params);
    return response.data;
  }

  async list(): Promise<Vault[]> {
    const response = await this.http.get<{ data: Vault[] }>('/api/v1/vaults');
    return response.data;
  }

  async get(uuid: string): Promise<Vault> {
    const response = await this.http.get<{ data: Vault }>(`/api/v1/vaults/${uuid}`);
    return response.data;
  }

  async stats(uuid: string): Promise<VaultStats> {
    const response = await this.http.get<{ data: VaultStats }>(`/api/v1/vaults/${uuid}/stats`);
    return response.data;
  }

  async export(uuid: string): Promise<VaultExport> {
    const response = await this.http.get<{ data: VaultExport }>(`/api/v1/vaults/${uuid}/export`);
    return response.data;
  }

  async import(uuid: string, data: VaultExport): Promise<ImportResult> {
    const response = await this.http.post<{ data: ImportResult }>(
      `/api/v1/vaults/${uuid}/import`,
      data,
    );
    return response.data;
  }

  async merkle(uuid: string): Promise<MerkleInfo> {
    const response = await this.http.get<{ data: MerkleInfo }>(`/api/v1/vaults/${uuid}/merkle`);
    return response.data;
  }

  async verify(uuid: string): Promise<VerifyResult> {
    const response = await this.http.post<{ data: VerifyResult }>(
      `/api/v1/vaults/${uuid}/verify`,
    );
    return response.data;
  }

  async snapshot(uuid: string): Promise<Snapshot> {
    const response = await this.http.post<{ data: Snapshot }>(
      `/api/v1/vaults/${uuid}/snapshot`,
    );
    return response.data;
  }

  async snapshots(uuid: string): Promise<Snapshot[]> {
    const response = await this.http.get<{ data: Snapshot[] }>(`/api/v1/vaults/${uuid}/snapshots`);
    return response.data;
  }
}
