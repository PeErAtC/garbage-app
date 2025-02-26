import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkipFIjQxZ1WKSPbOYOxKhLrYr8AeEX_Q",
  authDomain: "garbage-web-c9745.firebaseapp.com",
  projectId: "garbage-web-c9745",
  storageBucket: "garbage-web-c9745.appspot.com",
  messagingSenderId: "366697440874",
  appId: "1:366697440874:web:90b5c3fc04fcf8b20ccc13",
  measurementId: "G-SG2J1KJRMV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
export const db = getFirestore(app);