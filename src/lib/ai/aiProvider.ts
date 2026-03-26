import { OllamaClient, OllamaMessage } from './ollamaClient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Configuração do Gemini (Cloud)
let geminiClient: GoogleGenerativeAI | null = null;
if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Caminho para persistência da configuração
const CONFIG_PATH = path.join(process.cwd(), 'config', 'ai_config.json');

// Interface para configuração
export interface AIConfig {
  provider: 'local' | 'gemini';
  localUrl: string;
  model: string;
  personality: string;
}

// Configuração Padrão
const defaultConfig: AIConfig = {
  provider: (process.env.AI_PROVIDER as any) || 'local',
  localUrl: process.env.LOCAL_LLM_URL || 'http://127.0.0.1:11434',
  model: process.env.LOCAL_LLM_MODEL || 'llama3.1:latest',
  personality: 'Você é um assistente virtual útil e profissional focado em conversão de leads e automação comercial.'
};

let aiConfig: AIConfig = { ...defaultConfig };

// Carregar configuração se existir
if (fs.existsSync(CONFIG_PATH)) {
  try {
    const savedConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    aiConfig = { ...defaultConfig, ...savedConfig };
  } catch (err: any) {
    console.error('[AI Provider] Erro ao carregar config:', err.message);
  }
} else {
    // Criar diretório config se não existir
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(aiConfig, null, 2));
}

// Instanciar Cliente Ollama
export const ollama = new OllamaClient({
  url: aiConfig.localUrl,
  model: aiConfig.model,
  timeout: 120000
});

/**
 * Interface principal para geração de resposta
 */
export async function generateResponse(prompt: string, history: OllamaMessage[] = [], customSystemPrompt: string | null = null): Promise<string> {
  if (aiConfig.provider === 'local') {
    const systemContent = customSystemPrompt || aiConfig.personality;
    const messages: OllamaMessage[] = [
      { role: 'system', content: systemContent },
      ...history,
      { role: 'user', content: prompt }
    ];

    const result = await ollama.chat(messages);

    if (!result.success) {
      if (result.error === 'TEMPO_LIMITE_EXCEDIDO') {
        return "⚠️ O servidor de IA está um pouco lento agora. Por favor, tente novamente em alguns segundos.";
      }
      return `❌ Erro na IA Local: ${result.error}`;
    }

    return result.message.content;
  } else {
    return generateGeminiResponse(prompt, history);
  }
}

async function generateGeminiResponse(prompt: string, history: OllamaMessage[]): Promise<string> {
  if (!geminiClient) return "❌ Gemini API Key não configurada.";
  try {
    const model = geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `${aiConfig.personality}\n\nHistorico: ${JSON.stringify(history)}\n\nUsuário: ${prompt}`;
    const result = await model.generateContent(fullPrompt);
    return (await result.response).text();
  } catch (err: any) {
    return "❌ Erro ao contatar Gemini Cloud.";
  }
}

export function updateConfig(newConfig: Partial<AIConfig>) {
  Object.assign(aiConfig, newConfig);
  ollama.configure({
    url: aiConfig.localUrl,
    model: aiConfig.model
  });

  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(aiConfig, null, 2));
    console.log('[AI Provider] Configuração persistida:', aiConfig);
  } catch (err: any) {
    console.error('[AI Provider] Erro ao salvar config:', err.message);
  }
}

export function getConfig(): AIConfig {
    return { ...aiConfig };
}
