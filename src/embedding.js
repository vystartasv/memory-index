import { createHash } from 'node:crypto';
export class HashEmbeddingProvider {
    name = 'hash-fallback';
    async embed(text) {
        const hash = createHash('sha256').update(text).digest();
        return Array.from(hash.subarray(0, 32), (value) => value / 255);
    }
}
export class OmlxApiEmbeddingProvider {
    model;
    baseUrl;
    apiKey;
    constructor(model, baseUrl = 'http://127.0.0.1:8000/v1', apiKey = process.env.OMLX_API_KEY || 'local-omlx') {
        this.model = model;
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    get name() {
        return `omlx-api:${this.model}`;
    }
    async embed(text) {
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
        const payload = await response.json();
        const embedding = payload.data?.[0]?.embedding;
        if (!embedding) {
            throw new Error('Embedding response missing vector');
        }
        return embedding;
    }
}
async function modelAvailable(model, baseUrl = 'http://127.0.0.1:8000/v1') {
    try {
        const response = await fetch(`${baseUrl}/models`);
        if (!response.ok)
            return false;
        const payload = await response.json();
        return Boolean(payload.data?.some((item) => item.id === model));
    }
    catch {
        return false;
    }
}
export async function resolveEmbeddingProvider(preferredModels) {
    for (const model of preferredModels) {
        if (await modelAvailable(model)) {
            return new OmlxApiEmbeddingProvider(model);
        }
    }
    return new HashEmbeddingProvider();
}
