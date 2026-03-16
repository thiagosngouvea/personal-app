import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  initializeAuth,
} from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { StudentProfile, UserRole } from '@/types';

// Secondary Firebase app instance — used only to create student accounts
// without switching the trainer's auth session.
function getSecondaryAuth() {
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
  };

  const secondaryAppName = 'student-creation';
  const existingApps = getApps();
  const existing = existingApps.find((a: { name: string }) => a.name === secondaryAppName);

  const secondaryApp = existing ?? initializeApp(firebaseConfig, secondaryAppName);
  return initializeAuth(secondaryApp);
}

export const studentAuthService = {
  /**
   * Trainer creates student account linked to a client record.
   * Uses a secondary Firebase app instance so the trainer's session is NOT affected.
   * Returns the uid and a temporary password to share with the student.
   */
  async createStudentAccount(
    email: string,
    clientId: string,
    trainerId: string,
    clientName: string
  ): Promise<{ uid: string; tempPassword: string }> {
    // Generate a memorable temp password
    const tempPassword =
      Math.random().toString(36).slice(2, 6).toUpperCase() +
      Math.random().toString(36).slice(2, 6) +
      '1!';

    // Use secondary app — trainer stays logged in on the primary app
    const secondaryAuth = getSecondaryAuth();
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, tempPassword);
    const studentUid = cred.user.uid;

    // Write student profile to Firestore (trainer is still logged in on primary auth)
    await setDoc(doc(db, 'students', studentUid), {
      uid: studentUid,
      clientId,
      trainerId,
      email,
      name: clientName,
      role: 'student',
      mustChangePassword: true,
      createdAt: serverTimestamp(),
    });

    // Sign out of secondary app to keep it clean
    await secondaryAuth.signOut();

    return { uid: studentUid, tempPassword };
  },

  /**
   * Get user role from Firestore (student or trainer).
   */
  async getUserRole(uid: string): Promise<UserRole> {
    const [trainerDoc, studentDoc] = await Promise.all([
      getDoc(doc(db, 'trainers', uid)),
      getDoc(doc(db, 'students', uid)),
    ]);

    if (trainerDoc.exists()) return 'trainer';
    if (studentDoc.exists()) return 'student';

    // Default to trainer (backward-compat for accounts created before role system)
    return 'trainer';
  },

  /**
   * Get student profile for a given UID.
   */
  async getStudentProfile(uid: string): Promise<StudentProfile | null> {
    const docSnap = await getDoc(doc(db, 'students', uid));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      uid: data.uid,
      clientId: data.clientId,
      trainerId: data.trainerId,
      email: data.email,
      role: 'student',
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  },

  /**
   * Send password reset email to student.
   */
  async resetStudentPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },
};
