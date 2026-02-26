import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyBYn1ODpb2Qt_5II2Zoe6GwAvQyorfOg_c',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'auricapri-868b7.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'auricapri-868b7',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'auricapri-868b7.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '317188491969',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:317188491969:web:71f625527265eea7c32240',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');
