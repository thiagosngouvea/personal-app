import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Workout, Exercise } from '@/types';

const COLLECTION = 'workouts';

function generateExerciseId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function docToWorkout(docSnap: DocumentSnapshot): Workout {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    clientId: data.clientId,
    trainerId: data.trainerId,
    name: data.name,
    description: data.description || undefined,
    goal: data.goal || undefined,
    level: data.level || undefined,
    daysPerWeek: data.daysPerWeek || undefined,
    exercises: data.exercises || [],
    aiGenerated: data.aiGenerated || false,
    active: data.active || false,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt),
  };
}

export const workoutService = {
  async create(workout: Omit<Workout, 'id' | 'createdAt'>): Promise<string> {
    // Ensure each exercise has an ID
    const exercises = workout.exercises.map((e) => ({
      ...e,
      id: e.id || generateExerciseId(),
    }));

    const docRef = await addDoc(collection(db, COLLECTION), {
      ...workout,
      exercises,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  },

  async update(workoutId: string, updates: Partial<Omit<Workout, 'id' | 'createdAt'>>): Promise<void> {
    const data: Record<string, unknown> = { ...updates };
    if (updates.exercises) {
      data.exercises = updates.exercises.map((e) => ({
        ...e,
        id: e.id || generateExerciseId(),
      }));
    }
    await updateDoc(doc(db, COLLECTION, workoutId), data);
  },

  async delete(workoutId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, workoutId));
  },

  async getById(workoutId: string): Promise<Workout | null> {
    const docSnap = await getDoc(doc(db, COLLECTION, workoutId));
    if (!docSnap.exists()) return null;
    return docToWorkout(docSnap);
  },

  async listByClient(clientId: string): Promise<Workout[]> {
    const q = query(
      collection(db, COLLECTION),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToWorkout);
  },

  async listByTrainer(trainerId: string): Promise<Workout[]> {
    const q = query(
      collection(db, COLLECTION),
      where('trainerId', '==', trainerId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToWorkout);
  },

  async setActive(clientId: string, workoutId: string): Promise<void> {
    // First, deactivate all workouts for client
    const q = query(collection(db, COLLECTION), where('clientId', '==', clientId));
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map((d) =>
      updateDoc(d.ref, { active: d.id === workoutId })
    );
    await Promise.all(updates);
  },

  makeExerciseId: generateExerciseId,
};
