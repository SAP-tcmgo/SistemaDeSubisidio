
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { 
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  getDocs
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCsFTpa3BjOUl7l3pBmmpnT7-q1w8OS4xY",
  authDomain: "siaap-subsidios.firebaseapp.com",
  projectId: "siaap-subsidios",
  storageBucket: "siaap-subsidios.appspot.com",
  messagingSenderId: "567063169065",
  appId: "1:567063169065:web:b80c4285e34d527c1cb438"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services after app initialization
const auth = getAuth(app);
auth.languageCode = 'pt';
const db = getFirestore(app);

export { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  collection, 
  addDoc,
  serverTimestamp,
  getDocs
};
