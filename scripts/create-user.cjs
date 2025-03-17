const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, collection, addDoc } = require("firebase/firestore");

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsFTpa3BjOUl7l3pBmmpnT7-q1w8OS4xY",
  authDomain: "siaap-subsidios.firebaseapp.com",
  projectId: "siaap-subsidios",
  storageBucket: "siaap-subsidios.firebasestorage.app",
  messagingSenderId: "567063169065",
  appId: "1:567063169065:web:b80c4285e34d527c1cb438",
  measurementId: "G-randomstring"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createUser(email, password, cargoId) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    console.log("Successfully created new user:", user.uid);

    // Add user ID to usuario_cargo collection
    const cargosCollection = collection(db, "usuario_cargo");
    await addDoc(cargosCollection, {
      usuarioId: user.uid,
      cargoId: cargoId
    });

    console.log("User ID added to usuario_cargo collection");
  } catch (error) {
    console.log("Error creating user:", error);
  }
}

// Get email, password, and cargoId from command line arguments
const email = process.argv[2];
const password = process.argv[3];
const cargoId = process.argv[4];

if (!email || !password || !cargoId) {
  console.error("Usage: node create-user.cjs <email> <password> <cargoId>");
  process.exit(1);
}

createUser(email, password, cargoId);
