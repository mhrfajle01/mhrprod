import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// You can find this in your Firebase console under Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDZaxrB0UG3Q76q3lRVnamIy-3d3YfsDfA",
  authDomain: "mhrprod.firebaseapp.com",
  projectId: "mhrprod",
  storageBucket: "mhrprod.firebasestorage.app",
  messagingSenderId: "719753783",
  appId: "1:71975193783:web:6beeaaac56aec325f4d132"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
