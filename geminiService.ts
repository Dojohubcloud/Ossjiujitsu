
import { GoogleGenAI, Type } from "@google/genai";
import { Student, Attendance, Payment } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getAIInsights(students: Student[], attendance: Attendance[], payments: Payment[]) {
  const prompt = `
    Analise os dados desta academia de Jiu-Jitsu e forneça insights de gestão em Português do Brasil.
    
    Atletas: ${JSON.stringify(students)}
    Presenças: ${JSON.stringify(attendance)}
    Pagamentos: ${JSON.stringify(payments)}

    Foque em:
    1. Quem está elegível para graus ou nova faixa baseado na frequência (considere 30 aulas para um grau).
    2. Saúde financeira (quem está com mensalidade atrasada).
    3. Tendências de presença.
    4. Um resumo profissional curto do estado atual da academia.

    IMPORTANTE: Responda APENAS com o JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            promotionSuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  studentName: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ['studentName', 'reason']
              }
            },
            financialWarnings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  studentName: { type: Type.STRING },
                  amountDue: { type: Type.NUMBER }
                }
              }
            },
            retentionRisk: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['summary', 'promotionSuggestions', 'financialWarnings', 'retentionRisk']
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Erro no Gemini:", error);
    return null;
  }
}

export async function askSenseiAI(question: string, students: Student[], attendance: Attendance[], payments: Payment[]) {
  const contextPrompt = `
    Você é o "Sensei IA", um consultor especializado em gestão de academias de Jiu-Jitsu.
    Você tem acesso aos seguintes dados em tempo real da academia:
    
    ATLETAS: ${JSON.stringify(students)}
    PRESENÇAS: ${JSON.stringify(attendance)}
    FINANCEIRO: ${JSON.stringify(payments)}

    Responda à pergunta do usuário de forma profissional, motivadora e baseada estritamente nos dados fornecidos.
    Se o usuário perguntar sobre alguém que não existe ou dados que você não tem, informe educadamente.
    Use terminologias do Jiu-Jitsu (OSS, Tatame, Raspagem, etc) quando apropriado.
    Toda a resposta deve ser em Português do Brasil e formatada em Markdown simples.

    PERGUNTA DO USUÁRIO: "${question}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contextPrompt,
    });
    return response.text;
  } catch (error) {
    console.error("Erro no Chat IA:", error);
    return "Desculpe, mestre. Tive um problema técnico agora. Podemos tentar novamente em um minuto? OSS!";
  }
}
