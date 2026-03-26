/**
 * Ollama Client - Cliente robusto para API do Ollama (Padrão JARVIS 4.1)
 * Adaptado para TypeScript / Next.js
 */
export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaOptions {
  url?: string;
  model?: string;
  timeout?: number;
}

export class OllamaClient {
  private baseUrl: string;
  private model: string;
  private timeout: number;

  constructor(options: OllamaOptions = {}) {
    let url = options.url || 'http://127.0.0.1:11434';
    url = url.replace('localhost', '127.0.0.1');
    url = url.replace(/\/api\/(generate|chat)\/?$/, '');
    url = url.replace(/\/$/, '');

    this.baseUrl = url;
    this.model = options.model || 'llama3.1:latest';
    this.timeout = options.timeout || 120000; // 2 minutos padrão
  }

  async healthCheck() {
    try {
      console.log(`[Ollama] Verificando saúde em ${this.baseUrl}...`);
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) return { online: false, error: `HTTP ${response.status}` };

      const data = await response.json();
      const models = data.models || [];
      const exists = models.some((m: any) => m.name === this.model);

      return {
        online: true,
        modelAvailable: exists,
        models: models.map((m: any) => m.name)
      };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  }

  async chat(messages: OllamaMessage[], options: any = {}) {
    const url = `${this.baseUrl}/api/chat`;
    const startTime = Date.now();

    try {
      console.log(`[Ollama] Iniciando chat com modelo ${this.model}...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: options.model || this.model,
          messages: messages,
          stream: false,
          format: options.format || undefined,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.maxTokens || 1000
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ollama Error ${response.status}: ${text}`);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;

      console.log(`[Ollama] Resposta recebida em ${duration}ms`);

      return {
        success: true,
        message: data.message,
        duration: duration
      };
    } catch (err: any) {
      const duration = Date.now() - startTime;
      console.error(`[Ollama] Falha após ${duration}ms:`, err.message);
      return {
        success: false,
        error: err.name === 'AbortError' ? 'TEMPO_LIMITE_EXCEDIDO' : err.message
      };
    }
  }

  configure(newConfig: OllamaOptions) {
    if (newConfig.url) {
      let url = newConfig.url.replace('localhost', '127.0.0.1');
      url = url.replace(/\/api\/(generate|chat)\/?$/, '');
      url = url.replace(/\/$/, '');
      this.baseUrl = url;
    }
    if (newConfig.model) this.model = newConfig.model;
    if (newConfig.timeout) this.timeout = newConfig.timeout;
  }
}
