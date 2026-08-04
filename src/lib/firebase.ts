import { initializeApp, getApp, getApps } from "firebase/app";
import {
  inMemoryPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Tokens are intentionally memory-only; a browser refresh requires re-authentication.
export const authPersistenceReady = setPersistence(auth, inMemoryPersistence);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle(): Promise<User> {
  await authPersistenceReady;
  return (await signInWithPopup(auth, googleProvider)).user;
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  await authPersistenceReady;
  return (await signInWithEmailAndPassword(auth, email, password)).user;
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
