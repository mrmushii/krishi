import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCnQKe2MTeLq7TX8xnBdfuAiC-5DIpEcuI",
  authDomain: "krishi-4bb11.firebaseapp.com",
  projectId: "krishi-4bb11",
  storageBucket: "krishi-4bb11.firebasestorage.app",
  messagingSenderId: "113672811333",
  appId: "1:113672811333:web:f004761b2c5c62602c842c"
};

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
// Note: Using Cloudinary for image storage instead of Firebase Storage (free tier)

