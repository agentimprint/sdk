import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_BASE_URL, ImprintClient } from '../src/client.js';
import {
  ImprintApiError,
  ImprintAuthError,
  ImprintNotFoundError,
  ImprintValidationError,
} from '../src/errors.js';

// ─── Mock fetch globally ────────────────────────────────────

function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  const responseHeaders = new Headers({ 'content-type': 'application/json', ...headers });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      headers: responseHeaders,
      json: async () => body,
      text: async () => JSON.stringify(body),
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// ─── Client Construction ────────────────────────────────────

describe('ImprintClient construction', () => {
  it('creates a client with required apiKey', () => {
    const client = new ImprintClient({ apiKey: 'test-key' });
    expect(client).toBeInstanceOf(ImprintClient);
  });

  it('exposes organizations, agents, vaults, entries resources', () => {
    const client = new ImprintClient({ apiKey: 'test-key' });
    expect(client.organizations).toBeDefined();
    expect(client.agents).toBeDefined();
    expect(client.vaults).toBeDefined();
    expect(client.entries).toBeDefined();
  });

  it('throws if apiKey is empty', () => {
    expect(() => new ImprintClient({ apiKey: '' })).toThrow('apiKey is required');
  });

  it('uses DEFAULT_BASE_URL when baseUrl is not provided', () => {
    expect(DEFAULT_BASE_URL).toBe('https://api.agentimprint.io');
  });

  it('accepts a custom baseUrl', () => {
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost:8000' });
    expect(client).toBeInstanceOf(ImprintClient);
  });
});

// ─── Organizations ──────────────────────────────────────────

describe('client.organizations.create', () => {
  it('calls POST /api/v1/organizations without auth header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        data: { uuid: 'org-1', name: 'Test Org', slug: 'test-org', tier: 'free', is_active: true, created_at: '', updated_at: '' },
        api_key: 'new-api-key-123',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const org = await client.organizations.create('Test Org');

    expect(org.name).toBe('Test Org');
    expect(org.apiKey).toBe('new-api-key-123');

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['X-API-Key']).toBeUndefined();
  });

  it('returns organization with apiKey property', async () => {
    mockFetch(201, {
      data: { uuid: 'org-uuid', name: 'Org', slug: 'org', tier: 'free', is_active: true, created_at: '', updated_at: '' },
      api_key: 'secret-key',
    });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const org = await client.organizations.create('Org');
    expect(org.uuid).toBe('org-uuid');
    expect(org.apiKey).toBe('secret-key');
  });
});

describe('client.organizations.get', () => {
  it('calls GET /api/v1/organizations/:uuid', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        data: { uuid: 'org-abc', name: 'Test', slug: 'test', tier: 'pro', is_active: true, created_at: '', updated_at: '' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ImprintClient({ apiKey: 'api-key', baseUrl: 'http://localhost' });
    const org = await client.organizations.get('org-abc');

    expect(org.uuid).toBe('org-abc');
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/v1/organizations/org-abc');
  });

  it('sends X-API-Key header', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        data: { uuid: 'org-abc', name: 'Test', slug: 'test', tier: 'pro', is_active: true, created_at: '', updated_at: '' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ImprintClient({ apiKey: 'my-api-key', baseUrl: 'http://localhost' });
    await client.organizations.get('org-abc');

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = options.headers as Record<string, string>;
    expect(headers['X-API-Key']).toBe('my-api-key');
  });
});

// ─── Agents ─────────────────────────────────────────────────

describe('client.agents.create', () => {
  it('calls POST /api/v1/agents with params', async () => {
    const agent = {
      uuid: 'agent-1', name: 'TestAgent', model_family: 'gpt-4', core_purpose: 'testing',
      creator_identifier: 'openai', fingerprint: 'abc123', version: '1.0', capabilities: [],
      meta: {}, is_active: true, organization_uuid: 'org-1', created_at: '', updated_at: '',
    };
    mockFetch(201, { data: agent });

    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.agents.create({
      name: 'TestAgent',
      model_family: 'gpt-4',
      core_purpose: 'testing',
      creator_identifier: 'openai',
    });
    expect(result.uuid).toBe('agent-1');
    expect(result.model_family).toBe('gpt-4');
  });
});

describe('client.agents.list', () => {
  it('returns an array of agents', async () => {
    const agents = [
      { uuid: 'a1', name: 'A', model_family: 'gpt', core_purpose: 'p', creator_identifier: 'c', fingerprint: 'f', version: '1', capabilities: [], meta: {}, is_active: true, organization_uuid: 'o', created_at: '', updated_at: '' },
    ];
    mockFetch(200, { data: agents });

    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.agents.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].uuid).toBe('a1');
  });
});

describe('client.agents.get', () => {
  it('calls GET /api/v1/agents/:uuid', async () => {
    const agent = { uuid: 'agent-xyz', name: 'X', model_family: 'claude', core_purpose: 'purpose', creator_identifier: 'anthropic', fingerprint: 'fp', version: '2', capabilities: [], meta: {}, is_active: true, organization_uuid: 'org', created_at: '', updated_at: '' };
    mockFetch(200, { data: agent });

    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.agents.get('agent-xyz');
    expect(result.uuid).toBe('agent-xyz');
  });
});

describe('client.agents.discover', () => {
  it('calls GET /api/v1/agents/discover/:fingerprint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: { uuid: 'a1', name: 'N', fingerprint: 'fp123', model_family: 'gpt', organization_uuid: 'o', created_at: '' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.agents.discover('fp123');
    expect(result.fingerprint).toBe('fp123');
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('/api/v1/agents/discover/fp123');
  });
});

describe('client.agents.generateKey', () => {
  it('calls POST /api/v1/agents/:uuid/keys/generate', async () => {
    mockFetch(200, { data: { key: 'generated-key-hex' } });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.agents.generateKey('agent-1');
    expect(result.key).toBe('generated-key-hex');
  });
});

describe('client.agents.splitKey', () => {
  it('calls POST /api/v1/agents/:uuid/keys/split with shares and threshold', async () => {
    mockFetch(200, { data: { shares: ['s1', 's2', 's3'] } });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.agents.splitKey('agent-1', { shares: 3, threshold: 2 });
    expect(result.shares).toHaveLength(3);
  });
});

describe('client.agents.recoverKey', () => {
  it('calls POST /api/v1/agents/:uuid/keys/recover with shares array', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: { key: 'recovered-key' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.agents.recoverKey('agent-1', ['s1', 's2']);
    expect(result.key).toBe('recovered-key');

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string) as { shares: string[] };
    expect(body.shares).toEqual(['s1', 's2']);
  });
});

// ─── Vaults ─────────────────────────────────────────────────

const mockVault = {
  uuid: 'vault-1', name: 'My Vault', description: null, agent_uuid: 'agent-1',
  organization_uuid: 'org-1', encryption_algorithm: 'AES-256-GCM', compression_enabled: false,
  entry_count: 0, is_active: true, created_at: '', updated_at: '',
};

describe('client.vaults.create', () => {
  it('creates a vault and returns it', async () => {
    mockFetch(201, { data: mockVault });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.vaults.create({ name: 'My Vault', agent_uuid: 'agent-1' });
    expect(result.uuid).toBe('vault-1');
  });
});

describe('client.vaults.list', () => {
  it('returns an array of vaults', async () => {
    mockFetch(200, { data: [mockVault] });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.vaults.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].uuid).toBe('vault-1');
  });
});

describe('client.vaults.get', () => {
  it('fetches vault by uuid', async () => {
    mockFetch(200, { data: mockVault });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.vaults.get('vault-1');
    expect(result.name).toBe('My Vault');
  });
});

describe('client.vaults.stats', () => {
  it('returns vault statistics', async () => {
    mockFetch(200, { data: { vault_uuid: 'vault-1', entry_count: 5, total_size_bytes: 1024, encrypted_count: 3, unencrypted_count: 2, namespaces: ['ns1'], created_at: '', last_updated_at: null } });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const stats = await client.vaults.stats('vault-1');
    expect(stats.entry_count).toBe(5);
  });
});

describe('client.vaults.export', () => {
  it('calls GET /api/v1/vaults/:uuid/export', async () => {
    mockFetch(200, { data: { vault: mockVault, entries: [], exported_at: '' } });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.vaults.export('vault-1');
    expect(result.vault.uuid).toBe('vault-1');
  });
});

describe('client.vaults.import', () => {
  it('calls POST /api/v1/vaults/:uuid/import', async () => {
    mockFetch(200, { data: { imported: 3, skipped: 0, errors: [] } });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.vaults.import('vault-1', { vault: mockVault, entries: [], exported_at: '' });
    expect(result.imported).toBe(3);
  });
});

describe('client.vaults.merkle', () => {
  it('returns merkle info', async () => {
    mockFetch(200, { data: { vault_uuid: 'vault-1', root_hash: 'abc', entry_count: 2, computed_at: '' } });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.vaults.merkle('vault-1');
    expect(result.root_hash).toBe('abc');
  });
});

describe('client.vaults.verify', () => {
  it('returns verify result', async () => {
    mockFetch(200, { data: { valid: true, vault_uuid: 'vault-1', root_hash: 'abc', mismatched_entries: [], verified_at: '' } });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.vaults.verify('vault-1');
    expect(result.valid).toBe(true);
  });
});

describe('client.vaults.snapshot', () => {
  it('calls POST /api/v1/vaults/:uuid/snapshot', async () => {
    mockFetch(201, { data: { uuid: 'snap-1', vault_uuid: 'vault-1', root_hash: 'rh', entry_count: 2, metadata: {}, created_at: '' } });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.vaults.snapshot('vault-1');
    expect(result.uuid).toBe('snap-1');
  });
});

describe('client.vaults.snapshots', () => {
  it('returns array of snapshots', async () => {
    mockFetch(200, { data: [{ uuid: 'snap-1', vault_uuid: 'vault-1', root_hash: 'rh', entry_count: 2, metadata: {}, created_at: '' }] });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.vaults.snapshots('vault-1');
    expect(Array.isArray(result)).toBe(true);
    expect(result[0].uuid).toBe('snap-1');
  });
});

// ─── Entries ────────────────────────────────────────────────

const mockEntry = {
  uuid: 'entry-1', vault_uuid: 'vault-1', entry_type: 'lesson' as const, content: { summary: 'test', context: 'test', learned_from: 'test' },
  provenance: null, confidence: 1.0, domain: null, tags: [], is_encrypted: false, pii_flags: null, tombstoned_at: null,
  created_at: '', updated_at: '',
};

const paginatedEntries = {
  data: [mockEntry],
  meta: { request_id: 'r', api_version: 'v1', pagination: { total: 1, per_page: 20, current_page: 1, last_page: 1 } },
};

describe('client.entries.list', () => {
  it('returns paginated entries', async () => {
    mockFetch(200, paginatedEntries);
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.entries.list('vault-1');
    expect(result.entries).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });

  it('passes query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => paginatedEntries,
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    await client.entries.list('vault-1', { type: 'lesson' as const, page: 2 });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain('type=lesson');
    expect(url).toContain('page=2');
  });
});

describe('client.entries.create', () => {
  it('creates an entry', async () => {
    mockFetch(201, { data: mockEntry });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.entries.create('vault-1', { entry_type: 'lesson' as const, content: { summary: 'test', context: 'ctx', learned_from: 'src' } });
    expect(result.uuid).toBe('entry-1');
    expect(result.entry_type).toBe('lesson');
  });
});

describe('client.entries.createBulk', () => {
  it('calls POST /api/v1/vaults/:uuid/entries/bulk', async () => {
    mockFetch(201, { data: { imported: ['u1','u2'], failed: [], summary: { total: 2, imported: 2, failed: 0 } } });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.entries.createBulk('vault-1', [
      { entry_type: 'lesson' as const, content: { summary: 'a', context: 'b', learned_from: 'c' } },
      { entry_type: 'fact' as const, content: { statement: 'x', source: 'y', verified: true } },
    ]);
    expect(result.summary.imported).toBe(2);
  });
});

describe('client.entries.get', () => {
  it('fetches an entry by uuid', async () => {
    mockFetch(200, { data: mockEntry });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.entries.get('vault-1', 'entry-1');
    expect(result.uuid).toBe('entry-1');
  });
});

describe('client.entries.update', () => {
  it('calls PUT /api/v1/vaults/:vaultUuid/entries/:entryUuid', async () => {
    const updated = { ...mockEntry, value: 'new-val' };
    mockFetch(200, { data: updated });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    const result = await client.entries.update('vault-1', 'entry-1', { value: 'new-val' });
    expect(result.value).toBe('new-val');
  });
});

describe('client.entries.delete', () => {
  it('calls DELETE /api/v1/vaults/:vaultUuid/entries/:entryUuid', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true, status: 204,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => null,
    });
    vi.stubGlobal('fetch', fetchMock);

    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    await expect(client.entries.delete('vault-1', 'entry-1')).resolves.toBeUndefined();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.method).toBe('DELETE');
    expect(url).toContain('/api/v1/vaults/vault-1/entries/entry-1');
  });
});

// ─── Error Handling ──────────────────────────────────────────

describe('Error handling', () => {
  it('throws ImprintAuthError on 401', async () => {
    mockFetch(401, { message: 'Unauthorized' });
    const client = new ImprintClient({ apiKey: 'bad-key', baseUrl: 'http://localhost' });
    await expect(client.agents.list()).rejects.toThrow(ImprintAuthError);
  });

  it('throws ImprintNotFoundError on 404', async () => {
    mockFetch(404, { message: 'Not found' });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    await expect(client.agents.get('nonexistent')).rejects.toThrow(ImprintNotFoundError);
  });

  it('throws ImprintValidationError on 422', async () => {
    mockFetch(422, { message: 'Validation failed', errors: { name: ['The name field is required.'] } });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    await expect(client.agents.create({ name: '', model_family: '', core_purpose: '', creator_identifier: '' })).rejects.toThrow(ImprintValidationError);
  });

  it('ImprintValidationError contains field errors', async () => {
    mockFetch(422, { message: 'Validation failed', errors: { name: ['Name is required'] } });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    try {
      await client.agents.create({ name: '', model_family: '', core_purpose: '', creator_identifier: '' });
    } catch (err) {
      expect(err).toBeInstanceOf(ImprintValidationError);
      const ve = err as ImprintValidationError;
      expect(ve.errors.name).toContain('Name is required');
    }
  });

  it('throws ImprintApiError on generic 500', async () => {
    mockFetch(500, { message: 'Server error' });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    await expect(client.agents.list()).rejects.toThrow(ImprintApiError);
  });

  it('ImprintApiError has correct status code', async () => {
    mockFetch(503, { message: 'Service unavailable' });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    try {
      await client.agents.list();
    } catch (err) {
      expect(err).toBeInstanceOf(ImprintApiError);
      expect((err as ImprintApiError).status).toBe(503);
    }
  });

  it('ImprintNotFoundError has status 404', async () => {
    mockFetch(404, { message: 'Not found' });
    const client = new ImprintClient({ apiKey: 'k', baseUrl: 'http://localhost' });
    try {
      await client.vaults.get('nope');
    } catch (err) {
      expect((err as ImprintNotFoundError).status).toBe(404);
    }
  });

  it('error classes are instanceof ImprintApiError', () => {
    const auth = new ImprintAuthError('test');
    const notFound = new ImprintNotFoundError('test');
    const validation = new ImprintValidationError('test', {});
    expect(auth).toBeInstanceOf(ImprintApiError);
    expect(notFound).toBeInstanceOf(ImprintApiError);
    expect(validation).toBeInstanceOf(ImprintApiError);
  });
});
