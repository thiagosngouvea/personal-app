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
import { db } from '@/firebase/config';
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
    createdAt: data.createdAt instanceof Timestamp
      ? data.createdAt.toDate()
      : new Date(data.createdAt),
  };
}

export const clientService = {
  async create(trainerId: string, form: CreateClientForm): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
      trainerId,
      name: form.name.trim(),
      age: parseInt(form.age, 10),
      height: parseFloat(form.height),
      gender: form.gender,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
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

  async update(clientId: string, data: Partial<CreateClientForm>): Promise<void> {
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.age) updateData.age = parseInt(data.age, 10);
    if (data.height) updateData.height = parseFloat(data.height);
    if (data.gender) updateData.gender = data.gender;

    await updateDoc(doc(db, COLLECTION, clientId), updateData);
  },

  async delete(clientId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION, clientId));
  },
};
