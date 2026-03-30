import { FirebaseApp, FirebaseOptions, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";

/** Must use static process.env.NEXT_PUBLIC_* so Next inlines values in the browser bundle (dynamic process.env[key] is empty client-side). */
function pub(v: string | undefined): string | undefined {
  if (v == null) return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

function buildFirebaseConfig(): FirebaseOptions {
  const apiKey = pub(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const authDomain = pub(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
  const projectId = pub(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  const appId = pub(process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
  const storageBucket = pub(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  const messagingSenderId = pub(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
  const measurementId = pub(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID);

  const config: FirebaseOptions = {
    apiKey: apiKey ?? "",
    authDomain: authDomain ?? "",
    projectId: projectId ?? "",
    appId: appId ?? "",
  };
  if (storageBucket) config.storageBucket = storageBucket;
  if (messagingSenderId) config.messagingSenderId = messagingSenderId;
  if (measurementId) config.measurementId = measurementId;
  return config;
}

export function getFirebaseConfig(): FirebaseOptions {
  return buildFirebaseConfig();
}

export function isFirebaseConfigured(): boolean {
  const c = getFirebaseConfig();
  return Boolean(c.apiKey && c.projectId && c.authDomain && c.appId);
}

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Firebase can only be used in the browser.");
  }
  const firebaseConfig = getFirebaseConfig();
  if (
    !firebaseConfig.apiKey ||
    !firebaseConfig.projectId ||
    !firebaseConfig.authDomain ||
    !firebaseConfig.appId
  ) {
    throw new Error(
      "Missing Firebase env vars. Set NEXT_PUBLIC_FIREBASE_* in .env or .env.local (from Firebase Console → Project settings → Your apps), then restart the dev server.",
    );
  }
  if (!getApps().length) {
    initializeApp(firebaseConfig);
    if (process.env.NODE_ENV === "development") {
      console.info(
        "[Firebase] Initialized:",
        firebaseConfig.projectId,
        "| authDomain:",
        firebaseConfig.authDomain,
      );
    }
  }
  return getApps()[0]!;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
