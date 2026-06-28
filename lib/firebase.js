// Firebase web init for the hidden admin console. Lazy — only called from the
// client (inside useEffect) so static export prerender never touches it.
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: 'AIzaSyDnaSP4wXQe1nL_9GVckvVw56Mzv1uVUBs',
  authDomain: 'smart-hoem-98300.firebaseapp.com',
  projectId: 'smart-hoem-98300',
  storageBucket: 'smart-hoem-98300.appspot.com',
  messagingSenderId: '301523468995',
  appId: '1:301523468995:web:7ce89a7529e684d9e5d876',
  measurementId: 'G-XRB0PKEQZZ',
};

export function initFirebase() {
  const app = getApps().length ? getApp() : initializeApp(config);
  return { app, auth: getAuth(app), db: getFirestore(app) };
}

// Only these accounts may open the console (UI gate). Real write authorization
// still comes from Firestore security rules.
export const ADMIN_EMAILS = ['eseif0000@gmail.com', 'eseif102@gmail.com'];
