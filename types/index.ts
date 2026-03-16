// ==========================================
// PersonalApp Type Definitions
// ==========================================

export type UserRole = 'trainer' | 'student';

export interface Trainer {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// A student profile links a Firebase Auth user to a Client record
export interface StudentProfile {
  uid: string;        // Firebase Auth UID
  clientId: string;   // linked Client document ID
  trainerId: string;
  email: string;
  role: 'student';
  createdAt: Date;
}

// ==========================================
// Exercise & Workout
// ==========================================
export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'forearms' | 'core' | 'glutes' | 'quads' | 'hamstrings'
  | 'calves' | 'cardio' | 'fullBody' | 'other';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;     // "12", "8-12", "30s", "failure"
  rest: string;     // "60s", "90s", "2min"
  muscleGroup?: MuscleGroup;
  notes?: string;
}

export type WorkoutGoal = 'hypertrophy' | 'strength' | 'endurance' | 'weightLoss' | 'maintenance' | 'rehabilitation';
export type WorkoutLevel = 'beginner' | 'intermediate' | 'advanced';

export interface Workout {
  id: string;
  clientId: string;
  trainerId: string;
  name: string;
  description?: string;
  goal?: WorkoutGoal;
  level?: WorkoutLevel;
  daysPerWeek?: number;
  exercises: Exercise[];
  aiGenerated?: boolean;
  active?: boolean;     // the "current" workout for the client
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

// ==========================================
// Anamnesis (Basic Health Data)
// ==========================================
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'intense' | 'athlete';

export interface Anamnesis {
  injuryHistory?: string;
  healthConditions?: string;
  medications?: string;
  activityLevel?: ActivityLevel;
}

// ==========================================
// Skinfolds (Dobras Cutâneas — all in mm)
// ==========================================
export interface Skinfolds {
  chest?: number;
  abdomen?: number;
  suprailiac?: number;
  subscapular?: number;
  triceps?: number;
  midaxillary?: number;
  thigh?: number;
  biceps?: number;
  medialCalf?: number;
}

// ==========================================
// Postural Assessment
// ==========================================
export interface PosturalAssessment {
  shoulderAsymmetry?: boolean;
  scoliosis?: boolean;
  kyphosis?: boolean;
  lordosis?: boolean;
  valgusKnee?: boolean;
  varusKnee?: boolean;
  pronatedFoot?: boolean;
  supinatedFoot?: boolean;
  notes?: string;
}

// ==========================================
// Mobility & Flexibility Tests
// ==========================================
export interface MobilityTests {
  sitAndReach?: number;       // cm
  shoulderMobility?: string;  // pass/fail or cm
  hipMobility?: string;
  ankleMobility?: string;
  notes?: string;
}

// ==========================================
// Strength Tests
// ==========================================
export interface StrengthTests {
  rm1Squat?: number;         // kg
  rm1BenchPress?: number;    // kg
  rm1Deadlift?: number;      // kg
  pushUps?: number;          // reps
  sitUps?: number;           // reps
  plankSeconds?: number;     // seconds
  notes?: string;
}

// ==========================================
// Cardiorespiratory Tests
// ==========================================
export interface CardioTests {
  restingHeartRate?: number;  // bpm
  cooperTest?: number;        // meters in 12 min
  walk6MinTest?: number;      // meters in 6 min
  notes?: string;
}

// ==========================================
// Bone Diameters (Frame Size)
// ==========================================
export interface BoneDiameters {
  wrist?: number;    // cm — estima estrutura corporal
  elbow?: number;    // cm — biêpicondilo do úmero
  knee?: number;     // cm — biêpicondilo do fêmur
  ankle?: number;    // cm
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
  anamnesis?: Anamnesis;
  protocols: Protocols;
  skinfolds?: Skinfolds;
  circumferences: Circumferences;
  boneDiameters?: BoneDiameters;
  posturalAssessment?: PosturalAssessment;
  mobilityTests?: MobilityTests;
  strengthTests?: StrengthTests;
  cardioTests?: CardioTests;
  notes?: string;
  photos?: EvaluationPhotos;
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

export interface AnamnesisForm {
  injuryHistory: string;
  healthConditions: string;
  medications: string;
  activityLevel: ActivityLevel | '';
}

export interface SkinfoldsForm {
  chest: string;
  abdomen: string;
  suprailiac: string;
  subscapular: string;
  triceps: string;
  midaxillary: string;
  thigh: string;
  biceps: string;
  medialCalf: string;
}

export interface PosturalAssessmentForm {
  shoulderAsymmetry: boolean;
  scoliosis: boolean;
  kyphosis: boolean;
  lordosis: boolean;
  valgusKnee: boolean;
  varusKnee: boolean;
  pronatedFoot: boolean;
  supinatedFoot: boolean;
  notes: string;
}

export interface MobilityTestsForm {
  sitAndReach: string;
  shoulderMobility: string;
  hipMobility: string;
  ankleMobility: string;
  notes: string;
}

export interface StrengthTestsForm {
  rm1Squat: string;
  rm1BenchPress: string;
  rm1Deadlift: string;
  pushUps: string;
  sitUps: string;
  plankSeconds: string;
  notes: string;
}

export interface CardioTestsForm {
  restingHeartRate: string;
  cooperTest: string;
  walk6MinTest: string;
  notes: string;
}

export interface BoneDiametersForm {
  wrist: string;
  elbow: string;
  knee: string;
  ankle: string;
}

export interface CreateEvaluationForm {
  weight: string;
  anamnesis: AnamnesisForm;
  protocols: ProtocolsForm;
  skinfolds: SkinfoldsForm;
  circumferences: CircumferencesForm;
  boneDiameters: BoneDiametersForm;
  posturalAssessment: PosturalAssessmentForm;
  mobilityTests: MobilityTestsForm;
  strengthTests: StrengthTestsForm;
  cardioTests: CardioTestsForm;
  notes: string;
}
