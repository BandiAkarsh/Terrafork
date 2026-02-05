export interface Recipe {
    id: string;
    title: string;
    total_time?: string;
    yields?: string;
    image?: string;
    ingredients: string[];
    instructions: string;
    nutrients?: Record<string, string>;
    host?: string;
    url: string;
}

export interface VectorEmbedding {
    id: string; // Recipe ID
    vector: number[];
}
