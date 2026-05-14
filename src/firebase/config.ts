import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, 'ai-studio-58b85cc8-9de8-43e4-9c34-1ca1d1bc74a9');
export const auth = getAuth(app);
