// ============================================================
// Agent Imprint SDK — TypeScript Types
// ============================================================

// ─── Core Response Envelope ────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
  };
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
}

// ─── Organization ──────────────────────────────────────────

export interface Organization {
  uuid: string;
  name: string;
  slug: string;
  tier: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationWithKey extends Organization {
  apiKey: string;
}

// ─── Agent ─────────────────────────────────────────────────

export interface Agent {
  uuid: string;
  name: string;
  model_family: string;
  core_purpose: string;
  creator_identifier: string;
  fingerprint: string;
  version: string;
  capabilities: string[];
  meta: Record<string, unknown>;
  is_active: boolean;
  organization_uuid: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentParams {
  name: string;
  model_family: string;
  core_purpose: string;
  creator_identifier: string;
  version?: string;
  capabilities?: string[];
  meta?: Record<string, unknown>;
}

export interface DiscoverResult {
  uuid: string;
  name: string;
  fingerprint: string;
  model_family: string;
  organization_uuid: string;
  created_at: string;
}

// ─── Key Management ────────────────────────────────────────

export interface GenerateKeyResult {
  key: string;
}

export interface SplitKeyParams {
  shares: number;
  threshold: number;
}

export interface SplitKeyResult {
  shares: string[];
}

export interface RecoverKeyResult {
  key: string;
}

// ─── Vault ─────────────────────────────────────────────────

export interface Vault {
  uuid: string;
  name: string;
  description: string | null;
  agent_uuid: string;
  organization_uuid: string;
  encryption_algorithm: string;
  compression_enabled: boolean;
  entry_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVaultParams {
  name: string;
  agent_uuid: string;
  description?: string;
  encryption_algorithm?: string;
  compression_enabled?: boolean;
}

export interface VaultStats {
  vault_uuid: string;
  entry_count: number;
  total_size_bytes: number;
  encrypted_count: number;
  unencrypted_count: number;
  namespaces: string[];
  created_at: string;
  last_updated_at: string | null;
}

export interface VaultExport {
  vault: Vault;
  entries: Entry[];
  exported_at: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// ─── Vault Integrity ───────────────────────────────────────

export interface MerkleInfo {
  vault_uuid: string;
  root_hash: string;
  entry_count: number;
  computed_at: string;
}

export interface VerifyResult {
  valid: boolean;
  vault_uuid: string;
  root_hash: string;
  mismatched_entries: string[];
  verified_at: string;
}

// ─── Vault Snapshot ────────────────────────────────────────

export interface Snapshot {
  uuid: string;
  vault_uuid: string;
  root_hash: string;
  entry_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ─── Entry (ImprintML Schema) ──────────────────────────────

export type EntryType = 'lesson' | 'heuristic' | 'fact' | 'preference' | 'pattern' | 'relationship' | 'negative' | 'procedural';

export interface Entry {
  uuid: string;
  vault_uuid: string;
  entry_type: EntryType;
  content: Record<string, unknown>;
  provenance: Record<string, unknown> | null;
  confidence: number;
  domain: string | null;
  tags: string[];
  is_encrypted: boolean;
  pii_flags: string[] | null;
  tombstoned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEntryParams {
  entry_type: EntryType;
  content: Record<string, unknown>;
  provenance?: Record<string, unknown>;
  confidence?: number;
  domain?: string;
  tags?: string[];
  is_encrypted?: boolean;
  pii_flags?: string[];
}

export interface UpdateEntryParams {
  content?: Record<string, unknown>;
  provenance?: Record<string, unknown>;
  confidence?: number;
  domain?: string;
  tags?: string[];
  pii_flags?: string[];
}

export interface ListEntriesParams {
  type?: EntryType;
  domain?: string;
  tag?: string;
  q?: string;
  include_tombstoned?: boolean;
  page?: number;
  per_page?: number;
}

export interface PaginatedEntries {
  entries: Entry[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface BulkResult {
  imported: string[];
  failed: Array<{ index: number; errors: Record<string, string[]> }>;
  summary: { total: number; imported: number; failed: number };
}

// ─── Encryption Helpers ────────────────────────────────────

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
  algorithm: string;
}

// ─── Fingerprint ───────────────────────────────────────────

export interface FingerprintComponents {
  model_family: string;
  core_purpose: string;
  creator_identifier: string;
}

// ─── Client Config ─────────────────────────────────────────

export interface ImprintClientConfig {
  apiKey: string;
  baseUrl?: string;
}
