import {
  createUserWithEmailAndPassword,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
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

export function shouldUseGooglePopup(): boolean {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1";
}

const googleProvider = () => {
  const p = new GoogleAuthProvider();
  p.addScope("profile");
  p.addScope("email");
  p.setCustomParameters({ prompt: "select_account" });
  return p;
};

export async function signInWithGoogle(): Promise<UserSession | null> {
  const auth = getFirebaseAuth();
  const provider = googleProvider();

  if (shouldUseGooglePopup()) {
    const { user } = await signInWithPopup(auth, provider);
    return mapFirebaseUser(user);
  }

  await signInWithRedirect(auth, provider);
  return null;
}

export async function startGoogleSignInRedirect(): Promise<void> {
  const auth = getFirebaseAuth();
  await signInWithRedirect(auth, googleProvider());
}

export async function completeGoogleRedirectSignIn(): Promise<UserSession | null> {
  const auth = getFirebaseAuth();
  await auth.authStateReady();
  const result = await getRedirectResult(auth);
  if (!result?.user) return null;
  return mapFirebaseUser(result.user);
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
  } catch (err) {
    console.error("[Firebase] onAuthStateChanged failed — check Authentication + Identity Toolkit API for this project:", err);
    return () => {};
  }
}
