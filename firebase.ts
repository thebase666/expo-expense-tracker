// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaNs2iSTTbietgY4E8-3cxriXMaKtU-QU",
  authDomain: "expo-expense-tracker-1cd8e.firebaseapp.com",
  projectId: "expo-expense-tracker-1cd8e",
  storageBucket: "expo-expense-tracker-1cd8e.firebasestorage.app",
  messagingSenderId: "883425432810",
  appId: "1:883425432810:web:722fd733d762c1cb1ef393",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
