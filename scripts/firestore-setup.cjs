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
    // Verifica se já existe um usuário com o email "sap.estagiario08@gmail.com"
    const usuariosRef = collection(db, "usuarios");
    const q = query(usuariosRef, where("email", "==", "sap.estagiario08@gmail.com"));
    const usuariosSnapshot = await getDocs(q);

    if (usuariosSnapshot.empty) {
      // Criando documentos com ID automático
      const usuarioRef = await addDoc(collection(db, "usuarios"), {
        nome_completo: "Agnes Yasmini Vieira Santos",
        email: "sap.estagiario08@gmail.com",
        senha: "Yrjfiz11",
        data_criacao: new Date()
      });

      // Verifica se já existe um cargo com o nome "Administrador"
      const cargosRef = collection(db, "cargos");
      const q2 = query(cargosRef, where("nome", "==", "Administrador"));
      const cargosSnapshot = await getDocs(q2);

      if (cargosSnapshot.empty) {
        const cargoRef = await addDoc(collection(db, "cargos"), {
          nome: "Administrador"
        });

        // Criando documento em usuario_cargo
        const usuarioCargoRef = await addDoc(collection(db, "usuario_cargo"), {
          usuario_id: usuarioRef.id, // Pegamos o ID do usuário criado
          cargo_id: cargoRef.id // Pegamos o ID do cargo criado
        });
      }
    }

    // Verifica se já existe um token
    const tokensRef = collection(db, "tokens");
    const q3 = query(tokensRef);
    const tokensSnapshot = await getDocs(q3);

    if (tokensSnapshot.empty) {
      const tokenRef = await addDoc(collection(db, "tokens"), {
        token: nanoid(),
        usado: false,
        data_geracao: new Date()
      });
    }

    console.log("Coleções e documentos criados com sucesso!");
  } catch (e) {
    console.error("Erro ao configurar o Firestore:", e);
  }
}

// Chamando a função para executar
setupFirestore();
