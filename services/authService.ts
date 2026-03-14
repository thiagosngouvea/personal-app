import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';

export const authService = {
  async signUp(email: string, password: string, name: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // Create trainer document
    await setDoc(doc(db, 'trainers', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
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

  onAuthChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },
};
