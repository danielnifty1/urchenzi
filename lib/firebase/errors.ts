export function getFirebaseErrorInfo(err: unknown): { code: string; message: string } {
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    "message" in err &&
    typeof (err as { code: unknown }).code === "string"
  ) {
    const e = err as { code: string; message: string };
    return { code: e.code, message: e.message };
  }
  if (err instanceof Error) {
    return { code: "", message: err.message };
  }
  return { code: "", message: "" };
}

export function firebaseAuthUserMessage(code: string): string {
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Pop-up was blocked. This app uses a full-page Google sign-in instead — try again.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with a different sign-in method.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled. In Firebase Console → Authentication → Sign-in method, turn on Google.";
    case "auth/unauthorized-domain":
      return "This domain is not allowed. In Firebase Console → Authentication → Settings → Authorized domains, add localhost (and your site domain).";
    case "auth/invalid-api-key":
      return "Invalid Firebase API key. Check NEXT_PUBLIC_FIREBASE_API_KEY in .env.local and restart the dev server.";
    case "auth/configuration-not-found": {
      const pid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID";
      return `Auth isn’t provisioned for this Google Cloud project (often not an .env typo). Do: (1) Firebase → Authentication → Get started. (2) Enable “Identity Toolkit API” for ${pid}. (3) If your API key is restricted in Google Cloud → Credentials, allow Identity Toolkit API. With dev running, open /api/dev/firebase-env to verify env is loaded. Restart npm run dev after any .env edit.`;
    }
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    case "auth/internal-error":
      return "Firebase internal error. Confirm authDomain is your-project-id.firebaseapp.com and Google provider is enabled.";
    case "auth/web-storage-unsupported":
      return "This browser blocks storage needed for sign-in. Try another browser or disable strict tracking protection.";
    default:
      return "";
  }
}

export function formatGoogleAuthError(err: unknown): string {
  const { code, message } = getFirebaseErrorInfo(err);
  const hint = firebaseAuthUserMessage(code);
  if (hint) return hint;
  if (message) return `${message}${code ? ` (${code})` : ""}`;
  return "Google sign-in failed. Check the browser console and Firebase Console (Google provider + authorized domains).";
}

export function formatEmailAuthError(err: unknown): string {
  const { code, message } = getFirebaseErrorInfo(err);
  switch (code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Sign in instead.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/weak-password":
      return "Use a stronger password (at least 6 characters).";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    default: {
      const hint = firebaseAuthUserMessage(code);
      if (hint) return hint;
      if (message) return `${message}${code ? ` (${code})` : ""}`;
      return "Something went wrong. Try again.";
    }
  }
}
