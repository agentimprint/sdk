// ============================================================
// @agentimprint/sdk — Public API
// ============================================================

export { ImprintClient, DEFAULT_BASE_URL } from './client.js';

export {
  ImprintApiError,
  ImprintAuthError,
  ImprintNotFoundError,
  ImprintValidationError,
} from './errors.js';

export {
  computeFingerprint,
} from './fingerprint.js';

export {
  decrypt,
  deriveEntryKey,
  deriveVaultKey,
  encrypt,
  generateKey,
} from './crypto.js';

export type {
  Agent,
  BulkResult,
  CreateAgentParams,
  CreateEntryParams,
  CreateVaultParams,
  DiscoverResult,
  EncryptedPayload,
  Entry,
  FingerprintComponents,
  GenerateKeyResult,
  ImprintClientConfig,
  ImportResult,
  ListEntriesParams,
  MerkleInfo,
  Organization,
  OrganizationWithKey,
  PaginatedEntries,
  RecoverKeyResult,
  Snapshot,
  SplitKeyParams,
  SplitKeyResult,
  UpdateEntryParams,
  Vault,
  VaultExport,
  VaultStats,
  VerifyResult,
} from './types.js';
