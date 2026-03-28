import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/config";
import type { UserSession } from "@/types";

export function mapFirebaseUser(user: User): UserSession {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "User",
    email: user.email || "",
    photoURL: user.photoURL ?? undefined,
  };
}

export async function signInWithGoogle(): Promise<UserSession> {
  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const { user } = await signInWithPopup(auth, provider);
  return mapFirebaseUser(user);
}

export async function signInWithEmail(email: string, password: string): Promise<UserSession> {
  const auth = getFirebaseAuth();
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(user);
}

export async function signUpWithEmail(email: string, password: string): Promise<UserSession> {
  const auth = getFirebaseAuth();
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(user);
}

export async function firebaseSignOut(): Promise<void> {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return;
  try {
    await signOut(getFirebaseAuth());
  } catch {
    // ignore if app not initialized
  }
}

export function subscribeAuth(callback: (session: UserSession | null) => void): () => void {
  if (typeof window === "undefined" || !isFirebaseConfigured()) {
    return () => {};
  }
  try {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (user) => {
      callback(user ? mapFirebaseUser(user) : null);
    });
  } catch {
    return () => {};
  }
}
