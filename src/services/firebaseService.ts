import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot,
  Timestamp,
  deleteDoc,
  writeBatch,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { DailyWord, Submission, ArchivedWord } from '../types';

// Enable offline persistence (deprecated warning suppressed)
try {
  enableIndexedDbPersistence(db).catch(() => {});
} catch (err) {}

const COLLECTIONS = {
  DAILY_WORDS: 'dailyWords',
  SUBMISSIONS: 'submissions',
  ARCHIVE: 'archive'
};

// Connection state
let isOnline = true;

// Check connection status
export const checkConnection = async (): Promise<boolean> => {
  try {
    await getDoc(doc(db, '_connection_test', 'test'));
    isOnline = true;
    return true;
  } catch (error) {
    isOnline = false;
    return false;
  }
};

// Daily Word Operations
export const saveDailyWord = async (word: DailyWord) => {
  try {
    const docRef = doc(db, COLLECTIONS.DAILY_WORDS, word.date);
    await setDoc(docRef, word, { merge: true });
  } catch (error) {
    console.error('Failed to save daily word:', error);
    throw error;
  }
};

export const getDailyWord = async (date: string): Promise<DailyWord | null> => {
  try {
    const docRef = doc(db, COLLECTIONS.DAILY_WORDS, date);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as DailyWord : null;
  } catch (error) {
    console.error('Failed to get daily word:', error);
    return null;
  }
};

// Submission Operations
export const addSubmission = async (submission: Omit<Submission, 'id'> & { wordId?: string }) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.SUBMISSIONS), {
      ...submission,
      timestamp: Timestamp.now()
    });
    return { ...submission, id: docRef.id };
  } catch (error) {
    console.error('Failed to add submission:', error);
    throw error;
  }
};

export const getSubmissions = async (): Promise<Submission[]> => {
  try {
    const q = query(collection(db, COLLECTIONS.SUBMISSIONS), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission));
  } catch (error) {
    console.error('Failed to get submissions:', error);
    return [];
  }
};

export const updateSubmissionLikes = async (id: string, likes: number, likedBy: string[]) => {
  try {
    const docRef = doc(db, COLLECTIONS.SUBMISSIONS, id);
    await updateDoc(docRef, { likes, likedBy });
  } catch (error) {
    console.error('Failed to update likes:', error);
    throw error;
  }
};

export const clearSubmissions = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTIONS.SUBMISSIONS));
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  } catch (error) {
    console.error('Failed to clear submissions:', error);
    throw error;
  }
};

// Archive Operations
export const saveToArchive = async (archivedWord: ArchivedWord) => {
  try {
    const docRef = doc(db, COLLECTIONS.ARCHIVE, `${archivedWord.word}_${archivedWord.date}`);
    await setDoc(docRef, { ...archivedWord, timestamp: Timestamp.now() }, { merge: true });
  } catch (error) {
    console.error('Failed to save to archive:', error);
    throw error;
  }
};

export const getArchive = async (): Promise<ArchivedWord[]> => {
  try {
    const q = query(collection(db, COLLECTIONS.ARCHIVE), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as ArchivedWord);
  } catch (error) {
    console.error('Failed to get archive:', error);
    return [];
  }
};

// Real-time Listeners
export const subscribeToSubmissions = (
  callback: (submissions: Submission[]) => void,
  onError?: (error: Error) => void,
  wordId?: string
) => {
  const q = query(collection(db, COLLECTIONS.SUBMISSIONS), orderBy('timestamp', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const submissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission))
        .filter(sub => !wordId || (sub as any).wordId === wordId);
      callback(submissions);
    },
    (error) => {
      console.error('Subscription error:', error);
      if (onError) onError(error);
    }
  );
};



// Batch operations for better performance
export const batchAddSubmissions = async (submissions: Omit<Submission, 'id'>[]) => {
  try {
    const batch = writeBatch(db);
    submissions.forEach(submission => {
      const docRef = doc(collection(db, COLLECTIONS.SUBMISSIONS));
      batch.set(docRef, { ...submission, timestamp: Timestamp.now() });
    });
    await batch.commit();
  } catch (error) {
    console.error('Failed to batch add submissions:', error);
    throw error;
  }
};
