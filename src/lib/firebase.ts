import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

/**
 * Firebase config — uses environment variables.
 * Set these in .env.local for local dev or Netlify env vars for prod.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);

/** Observable auth error — components can subscribe to show UI */
type AuthErrorListener = (error: string | null) => void;
const authErrorListeners = new Set<AuthErrorListener>();
let currentAuthError: string | null = null;

function setAuthError(error: string | null) {
  currentAuthError = error;
  authErrorListeners.forEach((cb) => cb(error));
}

/** Subscribe to auth error state. Returns unsubscribe function. */
export function onAuthError(cb: AuthErrorListener): () => void {
  cb(currentAuthError); // emit current state immediately
  authErrorListeners.add(cb);
  return () => authErrorListeners.delete(cb);
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Ensure the user has an anonymous Firebase auth session.
 * Resolves immediately if already signed in; otherwise triggers signInAnonymously
 * with exponential backoff retry (up to 3 attempts).
 */
let authReady: Promise<void> | null = null;

export function ensureAuth(): Promise<void> {
  if (authReady) return authReady;

  authReady = new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) {
        setAuthError(null);
        resolve();
      } else {
        attemptSignIn(0, resolve, reject);
      }
    });
  });

  return authReady;
}

function attemptSignIn(
  attempt: number,
  resolve: () => void,
  reject: (err: Error) => void,
) {
  signInAnonymously(auth)
    .then(() => {
      setAuthError(null);
      resolve();
    })
    .catch((err) => {
      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `[War Room] Auth attempt ${attempt + 1}/${MAX_RETRIES} failed, retrying in ${delay}ms`,
          err,
        );
        setAuthError("Connecting to server...");
        setTimeout(() => attemptSignIn(attempt + 1, resolve, reject), delay);
      } else {
        console.error("[War Room] Auth failed after all retries", err);
        setAuthError("Unable to connect. Check your internet and refresh.");
        reject(new Error("Firebase auth failed after retries"));
      }
    });
}
