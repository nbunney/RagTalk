declare module '@themaximalist/embeddings.js' {
  interface EmbeddingOptions {
    service?: string;
    cache?: boolean;
  }

  function embeddings(text: string, options?: EmbeddingOptions): Promise<number[]>;
  export default embeddings;
}
