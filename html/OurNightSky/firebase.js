import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBz3KWF7i_5KhiHq4Nf8BGuRB5Ho_qJ2yU",
  authDomain: "our-night-sky.firebaseapp.com",
  projectId: "our-night-sky",
  storageBucket: "our-night-sky.firebasestorage.app",
  messagingSenderId: "84008589535",
  appId: "1:84008589535:web:429a198b41028ee9e9316a",
  measurementId: "G-GCK3Z5SGLP"
};

const STARS_COLLECTION = 'stars';

let db = null;
let isConfigured = false;

/** Lazily initialize Firebase, catching the common "still using placeholders" case. */
function ensureApp() {
  if (db) return db;
  const looksUnconfigured = Object.values(firebaseConfig).some((v) => String(v).startsWith('YOUR_'));
  isConfigured = !looksUnconfigured;
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  return db;
}

/** Whether real Firebase credentials have been filled in above. */
export function isFirebaseConfigured() {
  ensureApp();
  return isConfigured;
}

/**
 * Subscribe to realtime updates of every star in the shared sky.
 * @param {(stars: Array<object>) => void} onChange called with the full, current list of stars
 * @param {(error: Error) => void} onError called if the subscription fails
 * @returns {Function} unsubscribe function
 */
export function subscribeToStars(onChange, onError) {
  const database = ensureApp();
  const starsQuery = query(collection(database, STARS_COLLECTION), orderBy('createdAt', 'asc'));
  return onSnapshot(
    starsQuery,
    (snapshot) => {
      const stars = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      onChange(stars);
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/** Create a new star document. Returns the new document's id. */
export async function createStar(star) {
  const database = ensureApp();
  const payload = { ...star, createdAt: star.createdAt || serverTimestamp() };
  const docRef = await addDoc(collection(database, STARS_COLLECTION), payload);
  return docRef.id;
}

/** Update fields on an existing star document. */
export async function updateStar(id, fields) {
  const database = ensureApp();
  await updateDoc(doc(database, STARS_COLLECTION, id), fields);
}

/** Permanently delete a star document. */
export async function deleteStar(id) {
  const database = ensureApp();
  await deleteDoc(doc(database, STARS_COLLECTION, id));
}
