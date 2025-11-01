import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'

export const signUp = async (email, password, role, additionalData = {}) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user
  
  await updateProfile(user, { displayName: additionalData.name || email })
  
  await setDoc(doc(db, 'users', user.uid), {
    email,
    role,
    createdAt: new Date().toISOString(),
    ...additionalData
  })
  
  return user
}

export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  return userCredential.user
}

export const signOut = async () => {
  await firebaseSignOut(auth)
}

export const getCurrentUserData = async (uid) => {
  const docRef = doc(db, 'users', uid)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : null
}

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email)
}

