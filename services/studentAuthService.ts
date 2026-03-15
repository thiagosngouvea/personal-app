import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { StudentProfile, UserRole } from '@/types';

export const studentAuthService = {
  /**
   * Trainer creates student account linked to a client record.
   * Returns a temporary password (trainer must share with student).
   */
  async createStudentAccount(
    email: string,
    clientId: string,
    trainerId: string,
    clientName: string
  ): Promise<{ uid: string; tempPassword: string }> {
    // Generate a temp password
    const tempPassword = Math.random().toString(36).slice(2, 10) + 'A1!';

    const cred = await createUserWithEmailAndPassword(auth, email, tempPassword);

    // Create student profile in Firestore
    await setDoc(doc(db, 'students', cred.user.uid), {
      uid: cred.user.uid,
      clientId,
      trainerId,
      email,
      name: clientName,
      role: 'student',
      mustChangePassword: true,
      createdAt: serverTimestamp(),
    });

    return { uid: cred.user.uid, tempPassword };
  },

  /**
   * Get user role from Firestore (student or trainer).
   */
  async getUserRole(uid: string): Promise<UserRole> {
    // Check trainers collection
    const trainerDoc = await getDoc(doc(db, 'trainers', uid));
    if (trainerDoc.exists()) return 'trainer';

    // Check students collection
    const studentDoc = await getDoc(doc(db, 'students', uid));
    if (studentDoc.exists()) return 'student';

    // Default to trainer for backward compatibility
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
   * Send password reset to student.
   */
  async resetStudentPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },
};
