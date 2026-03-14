// ==========================================
// PersonalApp Type Definitions
// ==========================================

export interface Trainer {
  uid: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Client {
  id: string;
  trainerId: string;
  name: string;
  age: number;
  height: number; // in meters
  gender: 'male' | 'female' | 'other';
  createdAt: Date;
}

export interface EvaluationPhotos {
  front?: string;
  side?: string;
  back?: string;
}

export interface Evaluation {
  id: string;
  clientId: string;
  trainerId: string;
  weight: number; // kg
  bodyFatPercentage?: number;
  muscleMass?: number;
  waist?: number; // cm
  chest?: number; // cm
  arm?: number; // cm
  thigh?: number; // cm
  bmi?: number;
  notes?: string;
  photos?: EvaluationPhotos;
  createdAt: Date;
}

// Form types (without id and computed fields)
export interface CreateClientForm {
  name: string;
  age: string;
  height: string;
  gender: 'male' | 'female' | 'other';
}

export interface CreateEvaluationForm {
  weight: string;
  bodyFatPercentage: string;
  muscleMass: string;
  waist: string;
  chest: string;
  arm: string;
  thigh: string;
  notes: string;
}
