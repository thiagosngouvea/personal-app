import { Client, Evaluation } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

function buildPrompt(client: Client, evaluation: Evaluation, language: 'pt' | 'en'): string {
  const isPortuguese = language === 'pt';
  const p = evaluation.protocols || {};
  const c = evaluation.circumferences || {};

  const genderLabel = isPortuguese
    ? client.gender === 'male' ? 'Masculino' : client.gender === 'female' ? 'Feminino' : 'Outro'
    : client.gender === 'male' ? 'Male' : client.gender === 'female' ? 'Female' : 'Other';

  const lines: string[] = [];

  if (isPortuguese) {
    lines.push(`Você é um especialista em educação física e personal training. Analise a avaliação física abaixo do aluno(a) e forneça insights profissionais, práticos e motivadores ao personal trainer.`);
    lines.push(`\n**Dados do Aluno:**`);
    lines.push(`- Nome: ${client.name}`);
    lines.push(`- Idade: ${client.age} anos`);
    lines.push(`- Altura: ${client.height} m`);
    lines.push(`- Sexo: ${genderLabel}`);
    lines.push(`- Data da avaliação: ${evaluation.createdAt.toLocaleDateString('pt-BR')}`);

    lines.push(`\n**Dados da Avaliação:**`);
    lines.push(`- Peso corporal: ${evaluation.weight} kg`);

    if (p.bmi != null) lines.push(`- IMC: ${p.bmi}`);
    if (p.pollock3 != null) lines.push(`- % Gordura (Pollock 3 dobras): ${p.pollock3}%`);
    if (p.pollock7 != null) lines.push(`- % Gordura (Pollock 7 dobras): ${p.pollock7}%`);
    if (p.leanMass != null) lines.push(`- Massa Magra: ${p.leanMass} kg`);
    if (p.fatMass != null) lines.push(`- Peso Gordo: ${p.fatMass} kg`);
    if (p.idealWeight != null) lines.push(`- Peso Ideal: ${p.idealWeight} kg`);
    if (p.maxHeartRate != null) lines.push(`- FCM (Freq. Card. Máxima): ${p.maxHeartRate} bpm`);
    if (p.waistHipRatio != null) lines.push(`- RCQ (Relação Cintura-Quadril): ${p.waistHipRatio}`);
    if (p.usNavy != null) lines.push(`- Marinha Americana (% gordura): ${p.usNavy}%`);

    const circumferenceLabels: Record<string, string> = {
      neck: 'Pescoço', chest: 'Tórax', waist: 'Cintura', abdomen: 'Abdômen',
      hip: 'Quadril', shoulder: 'Ombro', rightForearm: 'Antebraço Direito',
      leftForearm: 'Antebraço Esquerdo', rightArmRelaxed: 'Braço Dir. Relaxado',
      leftArmRelaxed: 'Braço Esq. Relaxado', rightArmFlexed: 'Braço Dir. Contraído',
      leftArmFlexed: 'Braço Esq. Contraído', rightThigh: 'Coxa Direita',
      leftThigh: 'Coxa Esquerda', rightCalf: 'Perna Direita', leftCalf: 'Perna Esquerda',
    };

    const circumEntries = Object.entries(c).filter(([, v]) => v != null && (v as number) > 0);
    if (circumEntries.length > 0) {
      lines.push(`\n**Circunferências (cm):**`);
      circumEntries.forEach(([key, val]) => {
        const label = circumferenceLabels[key] || key;
        lines.push(`- ${label}: ${val} cm`);
      });
    }

    if (evaluation.notes) {
      lines.push(`\n**Observações do Personal:** ${evaluation.notes}`);
    }

    lines.push(`\n**Por favor, forneça:**`);
    lines.push(`1. **Análise geral** do estado físico atual do aluno (2-3 frases)`);
    lines.push(`2. **Pontos positivos** (o que está bom, o que evoluiu)`);
    lines.push(`3. **Pontos de atenção** (o que precisa melhorar, riscos identificados)`);
    lines.push(`4. **Recomendações práticas** para o personal trainer (3-5 sugestões de treino ou estratégia)`);
    lines.push(`5. **Motivação** para o aluno (frase de encorajamento)`);
    lines.push(`\nSeja objetivo, use linguagem profissional mas acessível. Formate a resposta em seções claras com emojis para melhor leitura.`);
  } else {
    lines.push(`You are an expert in physical education and personal training. Analyze the physical assessment below and provide professional, practical, and motivating insights to the personal trainer.`);
    lines.push(`\n**Student Data:**`);
    lines.push(`- Name: ${client.name}`);
    lines.push(`- Age: ${client.age} years`);
    lines.push(`- Height: ${client.height} m`);
    lines.push(`- Gender: ${genderLabel}`);
    lines.push(`- Assessment date: ${evaluation.createdAt.toLocaleDateString('en-US')}`);

    lines.push(`\n**Assessment Data:**`);
    lines.push(`- Body weight: ${evaluation.weight} kg`);

    if (p.bmi != null) lines.push(`- BMI: ${p.bmi}`);
    if (p.pollock3 != null) lines.push(`- Body Fat % (Pollock 3): ${p.pollock3}%`);
    if (p.pollock7 != null) lines.push(`- Body Fat % (Pollock 7): ${p.pollock7}%`);
    if (p.leanMass != null) lines.push(`- Lean Mass: ${p.leanMass} kg`);
    if (p.fatMass != null) lines.push(`- Fat Mass: ${p.fatMass} kg`);
    if (p.idealWeight != null) lines.push(`- Ideal Weight: ${p.idealWeight} kg`);
    if (p.maxHeartRate != null) lines.push(`- Max Heart Rate: ${p.maxHeartRate} bpm`);
    if (p.waistHipRatio != null) lines.push(`- Waist-Hip Ratio: ${p.waistHipRatio}`);
    if (p.usNavy != null) lines.push(`- US Navy Body Fat: ${p.usNavy}%`);

    const circumEntries = Object.entries(c).filter(([, v]) => v != null && (v as number) > 0);
    if (circumEntries.length > 0) {
      lines.push(`\n**Circumferences (cm):**`);
      circumEntries.forEach(([key, val]) => {
        lines.push(`- ${key}: ${val} cm`);
      });
    }

    if (evaluation.notes) {
      lines.push(`\n**Trainer Notes:** ${evaluation.notes}`);
    }

    lines.push(`\n**Please provide:**`);
    lines.push(`1. **General analysis** of the student's current physical state (2-3 sentences)`);
    lines.push(`2. **Strengths** (what's good, what has improved)`);
    lines.push(`3. **Areas of attention** (what needs improvement, identified risks)`);
    lines.push(`4. **Practical recommendations** for the personal trainer (3-5 training or strategy suggestions)`);
    lines.push(`5. **Motivation** for the student (encouraging phrase)`);
    lines.push(`\nBe objective, use professional but accessible language. Format the response in clear sections with emojis for better readability.`);
  }

  return lines.join('\n');
}

export const aiService = {
  isConfigured(): boolean {
    return !!API_KEY && API_KEY !== 'your_gemini_api_key_here';
  },

  async analyzeEvaluation(
    client: Client,
    evaluation: Evaluation,
    language: 'pt' | 'en' = 'pt'
  ): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = buildPrompt(client, evaluation, language);
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  },
};
