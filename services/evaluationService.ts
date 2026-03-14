import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
  DocumentSnapshot,
  updateDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '@/firebase/config';
import { Evaluation, CreateEvaluationForm, EvaluationPhotos } from '@/types';

const COLLECTION = 'evaluations';
const PAGE_SIZE = 10;

function docToEvaluation(docSnap: DocumentSnapshot): Evaluation {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    clientId: data.clientId,
    trainerId: data.trainerId,
    weight: data.weight,
    bodyFatPercentage: data.bodyFatPercentage,
    muscleMass: data.muscleMass,
    waist: data.waist,
    chest: data.chest,
    arm: data.arm,
    thigh: data.thigh,
    bmi: data.bmi,
    notes: data.notes,
    photos: data.photos,
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt),
  };
}

async function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Failed to convert URI to blob'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

async function uploadPhoto(
  clientId: string,
  evaluationId: string,
  position: 'front' | 'side' | 'back',
  uri: string
): Promise<string> {
  const blob = await uriToBlob(uri);
  const storageRef = ref(
    storage,
    `clients/${clientId}/evaluations/${evaluationId}/${position}.jpg`
  );
  const metadata = { contentType: 'image/jpeg' };
  await uploadBytes(storageRef, blob, metadata);
  return getDownloadURL(storageRef);
}

export const evaluationService = {
  async create(
    trainerId: string,
    clientId: string,
    clientHeight: number,
    form: CreateEvaluationForm,
    photos?: { front?: string; side?: string; back?: string }
  ): Promise<string> {
    const weight = parseFloat(form.weight);
    const bmi = clientHeight > 0 ? weight / (clientHeight * clientHeight) : undefined;

    const evalData: Record<string, unknown> = {
      clientId,
      trainerId,
      weight,
      bmi: bmi ? parseFloat(bmi.toFixed(1)) : null,
      createdAt: serverTimestamp(),
    };

    // Only add optional fields if they have values
    if (form.bodyFatPercentage) evalData.bodyFatPercentage = parseFloat(form.bodyFatPercentage);
    if (form.muscleMass) evalData.muscleMass = parseFloat(form.muscleMass);
    if (form.waist) evalData.waist = parseFloat(form.waist);
    if (form.chest) evalData.chest = parseFloat(form.chest);
    if (form.arm) evalData.arm = parseFloat(form.arm);
    if (form.thigh) evalData.thigh = parseFloat(form.thigh);
    if (form.notes?.trim()) evalData.notes = form.notes.trim();

    const docRef = await addDoc(collection(db, COLLECTION), evalData);

    // Upload photos if provided
    if (photos) {
      const photoUrls: EvaluationPhotos = {};

      if (photos.front) {
        photoUrls.front = await uploadPhoto(clientId, docRef.id, 'front', photos.front);
      }
      if (photos.side) {
        photoUrls.side = await uploadPhoto(clientId, docRef.id, 'side', photos.side);
      }
      if (photos.back) {
        photoUrls.back = await uploadPhoto(clientId, docRef.id, 'back', photos.back);
      }

      if (Object.keys(photoUrls).length > 0) {
        await updateDoc(doc(db, COLLECTION, docRef.id), { photos: photoUrls });
      }
    }

    return docRef.id;
  },

  async getById(evaluationId: string): Promise<Evaluation | null> {
    const docSnap = await getDoc(doc(db, COLLECTION, evaluationId));
    if (!docSnap.exists()) return null;
    return docToEvaluation(docSnap);
  },

  async listByClient(
    clientId: string,
    lastDoc?: DocumentSnapshot
  ): Promise<{ evaluations: Evaluation[]; lastDoc: DocumentSnapshot | null }> {
    let q = query(
      collection(db, COLLECTION),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const evaluations = snapshot.docs.map(docToEvaluation);
    const last = snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

    return { evaluations, lastDoc: last };
  },

  async getRecentByTrainer(
    trainerId: string,
    count: number = 5
  ): Promise<Evaluation[]> {
    const q = query(
      collection(db, COLLECTION),
      where('trainerId', '==', trainerId),
      orderBy('createdAt', 'desc'),
      limit(count)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToEvaluation);
  },

  async getAllByClient(clientId: string): Promise<Evaluation[]> {
    const q = query(
      collection(db, COLLECTION),
      where('clientId', '==', clientId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToEvaluation);
  },
};
