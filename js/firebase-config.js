import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYDXTXsNjd25HPRshJihSk9T8nu1Mjbqs",
  authDomain: "hypergenius12.firebaseapp.com",
  databaseURL: "https://hypergenius12-default-rtdb.firebaseio.com",
  projectId: "hypergenius12",
  storageBucket: "hypergenius12.firebasestorage.app",
  messagingSenderId: "10551503942",
  appId: "1:10551503942:web:ec247d362edc94f3faae47",
  measurementId: "G-JWFT8DNWZK"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
