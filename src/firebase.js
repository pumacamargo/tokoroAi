import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCz2mw-P3Vx4YZgCLICdBVzdpfYL-7B1qc",
  authDomain: "torokoai.firebaseapp.com",
  projectId: "torokoai",
  storageBucket: "torokoai.firebasestorage.app",
  messagingSenderId: "155635510176",
  appId: "1:155635510176:web:ad8feb1b16c985700712c5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);
