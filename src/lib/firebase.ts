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

/**
 * Ensure the user has an anonymous Firebase auth session.
 * Resolves immediately if already signed in; otherwise triggers signInAnonymously.
 * Called once on app init before any DB operations.
 */
let authReady: Promise<void> | null = null;

export function ensureAuth(): Promise<void> {
  if (authReady) return authReady;

  authReady = new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      if (user) {
        resolve();
      } else {
        signInAnonymously(auth).then(() => resolve()).catch(reject);
      }
    });
  });

  return authReady;
}
