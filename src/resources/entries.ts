import type { HttpClient } from '../http.js';
import type {
  BulkResult,
  CreateEntryParams,
  Entry,
  ListEntriesParams,
  PaginatedEntries,
  UpdateEntryParams,
} from '../types.js';

export class EntriesResource {
  constructor(private readonly http: HttpClient) {}

  async list(vaultUuid: string, params?: ListEntriesParams): Promise<PaginatedEntries> {
    const response = await this.http.get<{ data: Entry[]; meta: Record<string, unknown> }>(
      `/api/v1/vaults/${vaultUuid}/entries`,
      params as Record<string, string | number | boolean | undefined>,
    );
    const pagination = (response.meta?.pagination ?? {}) as PaginatedEntries['pagination'];
    return { entries: response.data, pagination };
  }

  async create(vaultUuid: string, entry: CreateEntryParams): Promise<Entry> {
    const response = await this.http.post<{ data: Entry }>(
      `/api/v1/vaults/${vaultUuid}/entries`,
      entry,
    );
    return response.data;
  }

  async createBulk(vaultUuid: string, entries: CreateEntryParams[]): Promise<BulkResult> {
    const response = await this.http.post<{ data: BulkResult }>(
      `/api/v1/vaults/${vaultUuid}/entries/bulk`,
      { entries },
    );
    return response.data;
  }

  async get(vaultUuid: string, entryUuid: string): Promise<Entry> {
    const response = await this.http.get<{ data: Entry }>(
      `/api/v1/vaults/${vaultUuid}/entries/${entryUuid}`,
    );
    return response.data;
  }

  async update(vaultUuid: string, entryUuid: string, data: UpdateEntryParams): Promise<Entry> {
    const response = await this.http.put<{ data: Entry }>(
      `/api/v1/vaults/${vaultUuid}/entries/${entryUuid}`,
      data,
    );
    return response.data;
  }

  async delete(vaultUuid: string, entryUuid: string): Promise<void> {
    await this.http.delete<void>(`/api/v1/vaults/${vaultUuid}/entries/${entryUuid}`);
  }
}
