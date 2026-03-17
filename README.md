# @agentimprint/sdk

TypeScript SDK for the [Agent Imprint](https://agentimprint.ai) sovereign memory infrastructure API.

## Installation

```bash
npm install @agentimprint/sdk
```

## Quick Start

```typescript
import { AgentImprint } from '@agentimprint/sdk';

const imprint = new AgentImprint({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.agentimprint.ai',
});

// Create a vault for your agent
const vault = await imprint.vaults.create({
  name: 'my-agent-memories',
  description: 'Production memory vault',
});

// Store a memory entry
await imprint.entries.create(vault.id, {
  type: 'lesson',
  content: 'Users prefer concise responses under 200 words',
  context: 'Learned from 500+ user interactions',
  confidence: 0.92,
  tags: ['communication', 'user-preference'],
});

// Retrieve all lessons
const lessons = await imprint.entries.list(vault.id, {
  type: 'lesson',
  minConfidence: 0.8,
});
```

## Entry Types

ImprintML supports 8 structured memory types:

| Type | Description |
|------|-------------|
| `lesson` | Learned behaviors and insights |
| `heuristic` | Rules of thumb and decision shortcuts |
| `fact` | Verified factual knowledge |
| `preference` | User or agent preferences |
| `pattern` | Recognized recurring patterns |
| `relationship` | Connections between entities |
| `negative` | What NOT to do (anti-patterns) |
| `procedural` | Step-by-step processes |

## API Reference

See full documentation at [github.com/agentimprint/docs](https://github.com/agentimprint/docs)

## Patent

Patent Pending — U.S. Provisional Application No. 64/008,125

## License

MIT
