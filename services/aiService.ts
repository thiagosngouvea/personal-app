import { Client, Evaluation, Exercise, WorkoutGoal, WorkoutLevel } from '@/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

function getModel() {
  const genAI = new GoogleGenerativeAI(API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
}

function buildAnalysisPrompt(client: Client, evaluation: Evaluation, language: 'pt' | 'en'): string {
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
    if (p.maxHeartRate != null) lines.push(`- FCM: ${p.maxHeartRate} bpm`);
    if (p.waistHipRatio != null) lines.push(`- RCQ: ${p.waistHipRatio}`);
    if (p.usNavy != null) lines.push(`- Marinha Americana: ${p.usNavy}%`);
    const circumLabels: Record<string, string> = {
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
      circumEntries.forEach(([key, val]) => lines.push(`- ${circumLabels[key] || key}: ${val} cm`));
    }
    if (evaluation.notes) lines.push(`\n**Observações:** ${evaluation.notes}`);
    lines.push(`\n**Por favor, forneça:**`);
    lines.push(`1. **Análise geral** do estado físico atual (2-3 frases)`);
    lines.push(`2. **Pontos positivos**`);
    lines.push(`3. **Pontos de atenção** e riscos identificados`);
    lines.push(`4. **Recomendações práticas** (3-5 sugestões de treino ou estratégia)`);
    lines.push(`5. **Motivação** para o aluno`);
    lines.push(`\nSeja objetivo, use linguagem profissional mas acessível. Use emojis para melhor leitura.`);
  } else {
    lines.push(`You are an expert in physical education and personal training. Analyze the physical assessment below and provide professional insights to the personal trainer.`);
    lines.push(`\n**Student:** ${client.name}, ${client.age}y, ${client.height}m, ${genderLabel}`);
    lines.push(`**Date:** ${evaluation.createdAt.toLocaleDateString('en-US')}`);
    lines.push(`\n**Assessment:** Weight ${evaluation.weight}kg`);
    if (p.bmi != null) lines.push(`BMI: ${p.bmi}`);
    if (p.pollock3 != null) lines.push(`Body Fat (P3): ${p.pollock3}%`);
    if (p.leanMass != null) lines.push(`Lean Mass: ${p.leanMass}kg`);
    if (evaluation.notes) lines.push(`\nNotes: ${evaluation.notes}`);
    lines.push(`\n**Please provide:** 1. General analysis, 2. Strengths, 3. Areas of attention, 4. Practical recommendations (3-5), 5. Motivation. Use emojis for readability.`);
  }

  return lines.join('\n');
}

function buildWorkoutPrompt(
  client: Client,
  evaluation: Evaluation | null,
  goal: WorkoutGoal,
  level: WorkoutLevel,
  daysPerWeek: number,
  language: 'pt' | 'en'
): string {
  const isPortuguese = language === 'pt';

  const goalLabels: Record<WorkoutGoal, string> = isPortuguese
    ? { hypertrophy: 'Hipertrofia', strength: 'Força', endurance: 'Resistência', weightLoss: 'Perda de Peso', maintenance: 'Manutenção', rehabilitation: 'Reabilitação' }
    : { hypertrophy: 'Hypertrophy', strength: 'Strength', endurance: 'Endurance', weightLoss: 'Weight Loss', maintenance: 'Maintenance', rehabilitation: 'Rehabilitation' };

  const levelLabels: Record<WorkoutLevel, string> = isPortuguese
    ? { beginner: 'Iniciante', intermediate: 'Intermediário', advanced: 'Avançado' }
    : { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

  const p = evaluation?.protocols || {};
  const evalInfo = evaluation
    ? isPortuguese
      ? `Peso: ${evaluation.weight}kg, IMC: ${p.bmi ?? 'N/A'}, % Gordura: ${p.pollock3 ?? p.pollock7 ?? 'N/A'}%`
      : `Weight: ${evaluation.weight}kg, BMI: ${p.bmi ?? 'N/A'}, Body Fat: ${p.pollock3 ?? p.pollock7 ?? 'N/A'}%`
    : '';

  if (isPortuguese) {
    return `Você é um personal trainer especializado em prescrição de treinos. Crie um plano de treino completo para o aluno abaixo.

**Aluno:** ${client.name}, ${client.age} anos, ${client.height}m, ${client.gender === 'male' ? 'Masculino' : 'Feminino'}
${evalInfo ? `**Avaliação física:** ${evalInfo}` : ''}
**Objetivo:** ${goalLabels[goal]}
**Nível:** ${levelLabels[level]}
**Frequência:** ${daysPerWeek}x por semana

Gere um treino completo com exatamente ${daysPerWeek} dias de treino. RESPONDA APENAS COM JSON VÁLIDO no seguinte formato, sem texto adicional:

{
  "name": "Nome do Treino",
  "description": "Breve descrição do plano",
  "exercises": [
    {
      "id": "ex1",
      "day": 1,
      "dayLabel": "Treino A - Peito e Tríceps",
      "name": "Nome do exercício",
      "sets": 4,
      "reps": "12",
      "rest": "60s",
      "muscleGroup": "chest",
      "notes": "Observação opcional"
    }
  ]
}

muscleGroup deve ser um dos: chest, back, shoulders, biceps, triceps, forearms, core, glutes, quads, hamstrings, calves, cardio, fullBody, other.
Inclua 5-8 exercícios por dia de treino. Varie os exercícios de acordo com o objetivo e nível.`;
  } else {
    return `You are a specialized personal trainer. Create a complete workout plan for the student below.

**Student:** ${client.name}, ${client.age}y, ${client.height}m, ${client.gender}
${evalInfo ? `**Physical assessment:** ${evalInfo}` : ''}
**Goal:** ${goalLabels[goal]}
**Level:** ${levelLabels[level]}
**Frequency:** ${daysPerWeek}x per week

Generate a complete workout with exactly ${daysPerWeek} training days. RESPOND ONLY WITH VALID JSON, no additional text:

{
  "name": "Workout Name",
  "description": "Brief plan description",
  "exercises": [
    {
      "id": "ex1",
      "day": 1,
      "dayLabel": "Day A - Chest & Triceps",
      "name": "Exercise name",
      "sets": 4,
      "reps": "12",
      "rest": "60s",
      "muscleGroup": "chest",
      "notes": "Optional note"
    }
  ]
}

muscleGroup must be one of: chest, back, shoulders, biceps, triceps, forearms, core, glutes, quads, hamstrings, calves, cardio, fullBody, other.
Include 5-8 exercises per training day.`;
  }
}

export interface GeneratedWorkout {
  name: string;
  description: string;
  exercises: (Exercise & { day: number; dayLabel: string })[];
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
    const model = getModel();
    const prompt = buildAnalysisPrompt(client, evaluation, language);
    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async generateWorkout(
    client: Client,
    evaluation: Evaluation | null,
    goal: WorkoutGoal,
    level: WorkoutLevel,
    daysPerWeek: number,
    language: 'pt' | 'en' = 'pt'
  ): Promise<GeneratedWorkout> {
    if (!this.isConfigured()) {
      throw new Error('GEMINI_API_KEY not configured');
    }
    const model = getModel();
    const prompt = buildWorkoutPrompt(client, evaluation, goal, level, daysPerWeek, language);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON (may be wrapped in ```json blocks)
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? jsonMatch[1] : text;

    try {
      return JSON.parse(jsonStr.trim()) as GeneratedWorkout;
    } catch {
      throw new Error('Failed to parse AI workout response');
    }
  },
};
