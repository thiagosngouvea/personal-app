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
  whatsapp?: string;
  email?: string;
  photoUrl?: string;
  createdAt: Date;
}

// Photos are stored as an array of download URLs
export type EvaluationPhotos = string[];

// ==========================================
// Circumferences (all in cm)
// ==========================================
export interface Circumferences {
  neck?: number;
  chest?: number;
  waist?: number;
  abdomen?: number;
  hip?: number;
  shoulder?: number;
  rightForearm?: number;
  leftForearm?: number;
  rightArmRelaxed?: number;
  leftArmRelaxed?: number;
  rightArmFlexed?: number;
  leftArmFlexed?: number;
  rightThigh?: number;
  leftThigh?: number;
  rightCalf?: number;
  leftCalf?: number;
}

// ==========================================
// Protocols / Body Composition
// ==========================================
export interface Protocols {
  pollock3?: number;  // Pollock 3 skinfolds %
  pollock7?: number;  // Pollock 7 skinfolds %
  leanMass?: number;  // kg
  fatMass?: number;   // kg
  idealWeight?: number; // kg
  bmi?: number;
  maxHeartRate?: number; // bpm (FCM)
  waistHipRatio?: number; // RCQ
  usNavy?: number;  // US Navy body fat %
}

// ==========================================
// Full Evaluation
// ==========================================
export interface Evaluation {
  id: string;
  clientId: string;
  trainerId: string;
  weight: number; // kg
  protocols: Protocols;
  circumferences: Circumferences;
  notes?: string;
  photos?: EvaluationPhotos; // array of photo URLs
  createdAt: Date;
}

// ==========================================
// Form types (all strings for input)
// ==========================================
export interface CreateClientForm {
  name: string;
  age: string;
  height: string;
  gender: 'male' | 'female' | 'other';
  whatsapp: string;
  email: string;
}

export interface CircumferencesForm {
  neck: string;
  chest: string;
  waist: string;
  abdomen: string;
  hip: string;
  shoulder: string;
  rightForearm: string;
  leftForearm: string;
  rightArmRelaxed: string;
  leftArmRelaxed: string;
  rightArmFlexed: string;
  leftArmFlexed: string;
  rightThigh: string;
  leftThigh: string;
  rightCalf: string;
  leftCalf: string;
}

export interface ProtocolsForm {
  pollock3: string;
  pollock7: string;
  leanMass: string;
  fatMass: string;
  idealWeight: string;
  maxHeartRate: string;
  waistHipRatio: string;
  usNavy: string;
}

export interface CreateEvaluationForm {
  weight: string;
  protocols: ProtocolsForm;
  circumferences: CircumferencesForm;
  notes: string;
}
