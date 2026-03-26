import { prisma } from '@/lib/prisma';
import { generateResponse, getConfig, updateConfig } from './aiProvider';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'config', 'ai_config.json');

/**
 * Analisa o histórico de conversas de uma organização e sugere melhorias no prompt.
 */
export async function analyzeAndEvolve(organizationId: string) {
  try {
    console.log(`[Self-Evolve] Iniciando análise para Org ${organizationId}...`);
    
    // 1. Buscar conversas recentes
    const conversations = await prisma.salesConversation.findMany({
      where: { organizationId: organizationId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    if (conversations.length < 3) {
      console.log("[Self-Evolve] Dados insuficientes para evolução.");
      return { success: false, reason: 'insufficient_data' };
    }

    // 2. Filtrar conversas por falha (não chegaram ao fechamento)
    const failures = conversations
      .filter(c => c.lastOutcome === 'failure' || (c.etapa !== 'fechamento' && JSON.parse(c.dados).history?.length > 4))
      .map(c => JSON.parse(c.dados).history);

    if (failures.length === 0) {
      console.log("[Self-Evolve] Nenhuma falha detectada para análise.");
      return { success: true, optimized: false };
    }

    // 3. Preparar prompt para o "Evolve Engine"
    const currentConfig = getConfig();
    const analysisPrompt = `Você é o SELF-EVOLVE ENGINE do sistema JARVIS 4.1.
Sua tarefa é analisar conversas de vendas que "falharam" e sugerir melhorias no PROMPT DO SISTEMA.

CONVERSAS ANALISADAS (FALHAS):
${JSON.stringify(failures.slice(-3), null, 2)}

PROMPT ATUAL:
Personalidade: ${currentConfig.personality}

OBJETIVO:
Identifique por que o lead desengajou. Sugira uma NOVA "personality" que aumente a taxa de conversão.

RESPOSTA ESPERADA (APENAS JSON):
{
  "new_personality": "texto da nova personalidade",
  "reasoning": "explicação técnica"
}
`;

    const evolutionResponse = await generateResponse(analysisPrompt, [], "Você é um Engenheiro de Prompts Sênior especialista em conversão.");
    
    // 4. Extrair JSON
    let suggestion = null;
    const jsonMatch = evolutionResponse.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      try {
        suggestion = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("[Self-Evolve] Erro ao parsear JSON da IA.");
      }
    }

    if (!suggestion || !suggestion.new_personality) {
      return { success: false, reason: 'json_extraction_failed', raw: evolutionResponse };
    }
    
    console.log(`[Self-Evolve] Evolução sugerida: ${suggestion.reasoning}`);

    return {
      success: true,
      optimized: true,
      suggestion
    };

  } catch (error: any) {
    console.error("[Self-Evolve] Erro Crítico:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Aplica a evolução globalmente
 */
export function applyEvolution(suggestion: any) {
    if (suggestion.new_personality) {
        updateConfig({ personality: suggestion.new_personality });
        return true;
    }
    return false;
}
