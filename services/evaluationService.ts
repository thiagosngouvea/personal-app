import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  deleteDoc,
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
  deleteObject,
  listAll,
} from 'firebase/storage';
import { db, storage } from '@/firebase/config';
import {
  Evaluation,
  CreateEvaluationForm,
} from '@/types';

const COLLECTION = 'evaluations';
const PAGE_SIZE = 10;

function docToEvaluation(docSnap: DocumentSnapshot): Evaluation {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    clientId: data.clientId,
    trainerId: data.trainerId,
    weight: data.weight,
    protocols: data.protocols || {},
    circumferences: data.circumferences || {},
    notes: data.notes,
    photos: data.photos || [],
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt),
  };
}

/** Parse a string to number, return undefined if empty/invalid */
function parseOpt(value: string): number | undefined {
  if (!value || value.trim() === '') return undefined;
  const n = parseFloat(value);
  return isNaN(n) ? undefined : n;
}

/** Remove undefined keys from an object */
function cleanObj(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) result[key] = value;
  }
  return result;
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

/** Upload a single photo and return its download URL */
async function uploadSinglePhoto(
  clientId: string,
  evaluationId: string,
  index: number,
  uri: string
): Promise<string> {
  const blob = await uriToBlob(uri);
  const storageRef = ref(
    storage,
    `clients/${clientId}/evaluations/${evaluationId}/photo_${index}.jpg`
  );
  const metadata = { contentType: 'image/jpeg' };
  await uploadBytes(storageRef, blob, metadata);
  return getDownloadURL(storageRef);
}

/** Check if a string is a local file URI (not already uploaded) */
function isLocalUri(uri: string): boolean {
  return !uri.startsWith('https://');
}

/** Upload new photos and keep existing URLs, returns array of all URLs */
async function uploadPhotos(
  clientId: string,
  evaluationId: string,
  photoUris: string[]
): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < photoUris.length; i++) {
    if (isLocalUri(photoUris[i])) {
      const url = await uploadSinglePhoto(clientId, evaluationId, Date.now() + i, photoUris[i]);
      urls.push(url);
    } else {
      urls.push(photoUris[i]); // already uploaded
    }
  }
  return urls;
}

/** Build evaluation data from form */
function buildEvalData(
  form: CreateEvaluationForm,
  clientHeight: number
): Record<string, unknown> {
  const weight = parseFloat(form.weight);
  const bmi = clientHeight > 0 ? parseFloat((weight / (clientHeight * clientHeight)).toFixed(1)) : undefined;

  const protocols = cleanObj({
    pollock3: parseOpt(form.protocols.pollock3),
    pollock7: parseOpt(form.protocols.pollock7),
    leanMass: parseOpt(form.protocols.leanMass),
    fatMass: parseOpt(form.protocols.fatMass),
    idealWeight: parseOpt(form.protocols.idealWeight),
    bmi,
    maxHeartRate: parseOpt(form.protocols.maxHeartRate),
    waistHipRatio: parseOpt(form.protocols.waistHipRatio),
    usNavy: parseOpt(form.protocols.usNavy),
  });

  const circumferences = cleanObj({
    neck: parseOpt(form.circumferences.neck),
    chest: parseOpt(form.circumferences.chest),
    waist: parseOpt(form.circumferences.waist),
    abdomen: parseOpt(form.circumferences.abdomen),
    hip: parseOpt(form.circumferences.hip),
    shoulder: parseOpt(form.circumferences.shoulder),
    rightForearm: parseOpt(form.circumferences.rightForearm),
    leftForearm: parseOpt(form.circumferences.leftForearm),
    rightArmRelaxed: parseOpt(form.circumferences.rightArmRelaxed),
    leftArmRelaxed: parseOpt(form.circumferences.leftArmRelaxed),
    rightArmFlexed: parseOpt(form.circumferences.rightArmFlexed),
    leftArmFlexed: parseOpt(form.circumferences.leftArmFlexed),
    rightThigh: parseOpt(form.circumferences.rightThigh),
    leftThigh: parseOpt(form.circumferences.leftThigh),
    rightCalf: parseOpt(form.circumferences.rightCalf),
    leftCalf: parseOpt(form.circumferences.leftCalf),
  });

  const evalData: Record<string, unknown> = {
    weight,
    protocols,
    circumferences,
  };

  if (form.notes?.trim()) {
    evalData.notes = form.notes.trim();
  } else {
    evalData.notes = null;
  }

  return evalData;
}

export const evaluationService = {
  async create(
    trainerId: string,
    clientId: string,
    clientHeight: number,
    form: CreateEvaluationForm,
    photoUris?: string[]
  ): Promise<string> {
    const evalData = buildEvalData(form, clientHeight);
    evalData.clientId = clientId;
    evalData.trainerId = trainerId;
    evalData.createdAt = serverTimestamp();

    const docRef = await addDoc(collection(db, COLLECTION), evalData);

    // Upload photos if provided
    if (photoUris && photoUris.length > 0) {
      const urls = await uploadPhotos(clientId, docRef.id, photoUris);
      if (urls.length > 0) {
        await updateDoc(doc(db, COLLECTION, docRef.id), { photos: urls });
      }
    }

    return docRef.id;
  },

  async update(
    evaluationId: string,
    clientId: string,
    clientHeight: number,
    form: CreateEvaluationForm,
    photoUris?: string[]
  ): Promise<void> {
    const evalData = buildEvalData(form, clientHeight);

    // Upload new photos
    if (photoUris) {
      const urls = await uploadPhotos(clientId, evaluationId, photoUris);
      evalData.photos = urls;
    }

    await updateDoc(doc(db, COLLECTION, evaluationId), evalData);
  },

  async remove(evaluationId: string, clientId: string): Promise<void> {
    // Delete photos from storage
    try {
      const folderRef = ref(storage, `clients/${clientId}/evaluations/${evaluationId}`);
      const list = await listAll(folderRef);
      await Promise.all(list.items.map((item) => deleteObject(item)));
    } catch {
      // Folder may not exist, ignore
    }

    // Delete the Firestore document
    await deleteDoc(doc(db, COLLECTION, evaluationId));
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
