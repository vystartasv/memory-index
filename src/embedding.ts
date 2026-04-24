import { createHash } from 'node:crypto';

export interface EmbeddingProvider {
  name: string;
  embed(text: string): Promise<number[]>;
}

export class HashEmbeddingProvider implements EmbeddingProvider {
  name = 'hash-fallback';

  async embed(text: string): Promise<number[]> {
    const hash = createHash('sha256').update(text).digest();
    return Array.from(hash.subarray(0, 32), (value) => value / 255);
  }
}

export class OmlxApiEmbeddingProvider implements EmbeddingProvider {
  constructor(
    public readonly model: string,
    private readonly baseUrl = 'http://127.0.0.1:8000/v1',
    private readonly apiKey = process.env.OMLX_API_KEY || 'local-omlx'
  ) {}

  get name(): string {
    return `omlx-api:${this.model}`;
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Embedding request failed: ${response.status} ${await response.text()}`);
    }

    const payload = await response.json() as { data?: Array<{ embedding?: number[] }> };
    const embedding = payload.data?.[0]?.embedding;
    if (!embedding) {
      throw new Error('Embedding response missing vector');
    }
    return embedding;
  }
}

async function modelAvailable(model: string, baseUrl = 'http://127.0.0.1:8000/v1'): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/models`);
    if (!response.ok) return false;
    const payload = await response.json() as { data?: Array<{ id?: string }> };
    return Boolean(payload.data?.some((item) => item.id === model));
  } catch {
    return false;
  }
}

export async function resolveEmbeddingProvider(preferredModels: string[]): Promise<EmbeddingProvider> {
  for (const model of preferredModels) {
    if (await modelAvailable(model)) {
      return new OmlxApiEmbeddingProvider(model);
    }
  }
  return new HashEmbeddingProvider();
}
