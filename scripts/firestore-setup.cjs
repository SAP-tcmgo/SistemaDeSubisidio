const { nanoid } = require('nanoid');
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc, addDoc, getDocs, query, where } = require("firebase/firestore");

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCsFTpa3BjOUl7l3pBmmpnT7-q1w8OS4xY",
  authDomain: "siaap-subsidios.firebaseapp.com",
  projectId: "siaap-subsidios",
  storageBucket: "siaap-subsidios.firebasestorage.app",
  messagingSenderId: "567063169065",
  appId: "1:567063169065:web:b80c4285e34d527c1cb438",
  measurementId: "G-randomstring"
};

// Inicializando Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setupFirestore() {
  try {
    console.log("Firestore setup completo!");
  } catch (e) {
    console.error("Erro ao configurar o Firestore:", e);
  }
}

// Chamando a função para executar
// setupFirestore();
