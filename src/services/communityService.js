import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  orderBy, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  increment 
} from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Post a new question
 */
export const postQuestion = async (questionData) => {
  const docRef = await addDoc(collection(db, 'questions'), {
    ...questionData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    views: 0,
    votes: 0,
    answersCount: 0
  })
  return docRef.id
}

/**
 * Get all questions with filters
 */
export const getQuestions = async (filters = {}) => {
  let q = collection(db, 'questions')
  
  if (filters.category) {
    q = query(q, where('category', '==', filters.category))
  }
  
  if (filters.userId) {
    q = query(q, where('userId', '==', filters.userId))
  }
  
  // Order by
  const orderByField = filters.sortBy || 'createdAt'
  const orderDirection = filters.order || 'desc'
  q = query(q, orderBy(orderByField, orderDirection))
  
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

/**
 * Get a single question with answers
 */
export const getQuestion = async (questionId) => {
  const questionRef = doc(db, 'questions', questionId)
  const questionSnap = await getDoc(questionRef)
  
  if (!questionSnap.exists()) return null
  
  const questionData = { 
    id: questionSnap.id, 
    ...questionSnap.data() 
  }
  
  // Get answers
  const answersSnapshot = await getDocs(
    query(
      collection(db, 'answers'),
      where('questionId', '==', questionId),
      orderBy('votes', 'desc'),
      orderBy('createdAt', 'asc')
    )
  )
  
  questionData.answers = answersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  
  return questionData
}

/**
 * Post an answer to a question
 */
export const postAnswer = async (answerData) => {
  const docRef = await addDoc(collection(db, 'answers'), {
    ...answerData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    votes: 0,
    isAccepted: false
  })
  
  // Increment answer count on question
  await updateDoc(doc(db, 'questions', answerData.questionId), {
    answersCount: increment(1),
    updatedAt: Timestamp.now()
  })
  
  return docRef.id
}

/**
 * Vote on a question or answer
 */
export const voteOnPost = async (postType, postId, userId, voteType) => {
  const collectionName = postType === 'question' ? 'questions' : 'answers'
  const postRef = doc(db, collectionName, postId)
  
  // Update votes
  await updateDoc(postRef, {
    votes: increment(voteType === 'up' ? 1 : -1),
    updatedAt: Timestamp.now()
  })
  
  // Track user vote (prevent double voting)
  await addDoc(collection(db, 'votes'), {
    postType,
    postId,
    userId,
    voteType,
    createdAt: Timestamp.now()
  })
}

/**
 * Mark answer as accepted
 */
export const acceptAnswer = async (questionId, answerId, userId) => {
  // Verify user owns the question
  const questionRef = doc(db, 'questions', questionId)
  await updateDoc(questionRef, {
    acceptedAnswerId: answerId,
    updatedAt: Timestamp.now()
  })
  
  // Mark answer as accepted
  const answerRef = doc(db, 'answers', answerId)
  await updateDoc(answerRef, {
    isAccepted: true,
    updatedAt: Timestamp.now()
  })
}

/**
 * Increment question views
 */
export const incrementViews = async (questionId) => {
  await updateDoc(doc(db, 'questions', questionId), {
    views: increment(1)
  })
}

