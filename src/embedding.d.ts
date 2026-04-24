export interface EmbeddingProvider {
    name: string;
    embed(text: string): Promise<number[]>;
}
export declare class HashEmbeddingProvider implements EmbeddingProvider {
    name: string;
    embed(text: string): Promise<number[]>;
}
export declare class OmlxApiEmbeddingProvider implements EmbeddingProvider {
    readonly model: string;
    private readonly baseUrl;
    private readonly apiKey;
    constructor(model: string, baseUrl?: string, apiKey?: string);
    get name(): string;
    embed(text: string): Promise<number[]>;
}
export declare function resolveEmbeddingProvider(preferredModels: string[]): Promise<EmbeddingProvider>;
