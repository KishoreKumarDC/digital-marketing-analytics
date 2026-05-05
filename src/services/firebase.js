// import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKf0LhtBD0xlZVh9iGjkjGLsmpQxvoFm8",
  authDomain: "digitalmarketingdashboard-46.firebaseapp.com",
  projectId: "digitalmarketingdashboard-46",
  storageBucket: "digitalmarketingdashboard-46.firebasestorage.app",
  messagingSenderId: "300607268885",
  appId: "1:300607268885:web:c1cdd4fc43cd3164ff861c",
  measurementId: "G-GCTLN1LD8Y",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();