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
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { db, storage } from '@/firebase/config';
import { Client, CreateClientForm } from '@/types';

const COLLECTION = 'clients';
const PAGE_SIZE = 20;

function docToClient(docSnap: DocumentSnapshot): Client {
  const data = docSnap.data()!;
  return {
    id: docSnap.id,
    trainerId: data.trainerId,
    name: data.name,
    age: data.age,
    height: data.height,
    gender: data.gender,
    whatsapp: data.whatsapp || undefined,
    email: data.email || undefined,
    photoUrl: data.photoUrl || undefined,
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

async function uploadClientPhoto(
  clientId: string,
  uri: string
): Promise<string> {
  const blob = await uriToBlob(uri);
  const storageRef = ref(storage, `clients/${clientId}/profile.jpg`);
  const metadata = { contentType: 'image/jpeg' };
  await uploadBytes(storageRef, blob, metadata);
  return getDownloadURL(storageRef);
}

export const clientService = {
  async create(
    trainerId: string,
    form: CreateClientForm,
    photoUri?: string
  ): Promise<{ id: string; photoUrl?: string }> {
    const clientData: Record<string, unknown> = {
      trainerId,
      name: form.name.trim(),
      age: parseInt(form.age, 10),
      height: parseFloat(form.height),
      gender: form.gender,
      createdAt: serverTimestamp(),
    };

    if (form.whatsapp?.trim()) clientData.whatsapp = form.whatsapp.trim();
    if (form.email?.trim()) clientData.email = form.email.trim();

    const docRef = await addDoc(collection(db, COLLECTION), clientData);

    let photoUrl: string | undefined;
    if (photoUri) {
      photoUrl = await uploadClientPhoto(docRef.id, photoUri);
      await updateDoc(doc(db, COLLECTION, docRef.id), { photoUrl });
    }

    return { id: docRef.id, photoUrl };
  },

  async getById(clientId: string): Promise<Client | null> {
    const docSnap = await getDoc(doc(db, COLLECTION, clientId));
    if (!docSnap.exists()) return null;
    return docToClient(docSnap);
  },

  async listByTrainer(
    trainerId: string,
    lastDoc?: DocumentSnapshot
  ): Promise<{ clients: Client[]; lastDoc: DocumentSnapshot | null }> {
    let q = query(
      collection(db, COLLECTION),
      where('trainerId', '==', trainerId),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    const clients = snapshot.docs.map(docToClient);
    const last = snapshot.docs.length > 0
      ? snapshot.docs[snapshot.docs.length - 1]
      : null;

    return { clients, lastDoc: last };
  },

  async getClientCount(trainerId: string): Promise<number> {
    const q = query(
      collection(db, COLLECTION),
      where('trainerId', '==', trainerId)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  },

  async update(
    clientId: string,
    data: Partial<CreateClientForm>,
    photoUri?: string
  ): Promise<string | undefined> {
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.age) updateData.age = parseInt(data.age, 10);
    if (data.height) updateData.height = parseFloat(data.height);
    if (data.gender) updateData.gender = data.gender;
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp.trim() || null;
    if (data.email !== undefined) updateData.email = data.email.trim() || null;

    let photoUrl: string | undefined;
    if (photoUri) {
      photoUrl = await uploadClientPhoto(clientId, photoUri);
      updateData.photoUrl = photoUrl;
    }

    await updateDoc(doc(db, COLLECTION, clientId), updateData);
    return photoUrl;
  },

  async delete(clientId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, clientId));
  },
};
