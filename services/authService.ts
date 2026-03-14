import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/firebase/config';

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

async function uploadTrainerPhoto(uid: string, uri: string): Promise<string> {
  const blob = await uriToBlob(uri);
  const storageRef = ref(storage, `trainers/${uid}/profile.jpg`);
  const metadata = { contentType: 'image/jpeg' };
  await uploadBytes(storageRef, blob, metadata);
  return getDownloadURL(storageRef);
}

export const authService = {
  async signUp(
    email: string,
    password: string,
    name: string,
    photoUri?: string
  ): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Upload photo first if provided
    let photoURL: string | undefined;
    if (photoUri) {
      photoURL = await uploadTrainerPhoto(cred.user.uid, photoUri);
    }

    await updateProfile(cred.user, {
      displayName: name,
      photoURL: photoURL || null,
    });

    // Create trainer document
    await setDoc(doc(db, 'trainers', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      photoURL: photoURL || null,
      createdAt: serverTimestamp(),
    });

    return cred.user;
  },

  async signIn(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  },

  async logOut(): Promise<void> {
    await signOut(auth);
  },

  async updateDisplayName(name: string): Promise<void> {
    if (!auth.currentUser) throw new Error('Not authenticated');
    await updateProfile(auth.currentUser, { displayName: name });
  },

  async updateProfilePhoto(photoUri: string): Promise<string> {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const photoURL = await uploadTrainerPhoto(auth.currentUser.uid, photoUri);
    await updateProfile(auth.currentUser, { photoURL });
    return photoURL;
  },

  async updateProfileFull(name: string, photoUri?: string): Promise<string | undefined> {
    if (!auth.currentUser) throw new Error('Not authenticated');
    let photoURL: string | undefined;
    if (photoUri) {
      photoURL = await uploadTrainerPhoto(auth.currentUser.uid, photoUri);
    }
    await updateProfile(auth.currentUser, {
      displayName: name,
      ...(photoURL ? { photoURL } : {}),
    });
    return photoURL;
  },

  onAuthChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};
