import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getFirestore, collection, query, where, getDocs, updateDoc } from "firebase/firestore";

// Definindo as interfaces de tipos
interface UsuarioData {
  id: string;
  NomeCompleto: string;
  cpf: string;  // Adicionando o campo cpf
  email: string;  // Adicionando o campo email
  // Adicione outros campos do usuário se necessário
}

interface CargoData {
  nome: string;
  // Adicione outros campos do cargo se necessário
}

export interface UsuarioContextType {
  userId: string;
  userName: string;
  userRoles: string[];
  usercpf: string;
  userEmail: string;
  updateUser: (userData: { userName: string; userEmail: string; usercpf: string }) => Promise<void>;
}

const UserContext = createContext<UsuarioContextType>({
  userId: '',
  userName: 'SAP',
  userRoles: [],
  usercpf: '',
  userEmail: '',
  updateUser: async () => { },
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string>('');
  const [userName, setUserName] = useState<string>('SAP');
  const [userRoles, setUserRoles] = useState<string[]>([]);  // Estado agora tem o tipo string[]
  const [usercpf, setUsercpf] = useState<string>('');  // Estado para o cpf
  const [userEmail, setUserEmail] = useState<string>('');  // Estado para o email
  const db = getFirestore();

  const updateUser = async (userData: { userName: string; userEmail: string; usercpf: string }) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, "usuarios", user.uid);
        await updateDoc(userRef, {
          NomeCompleto: userData.userName,
          email: userData.userEmail,
          cpf: userData.usercpf,
        });

        setUserName(userData.userName);
        setUserEmail(userData.userEmail);
        setUsercpf(userData.usercpf);
      }
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);
      throw error;
    }
  };

  useEffect(() => {
    const auth = getAuth();

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Buscar dados do usuário
          const userRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            const userData = docSnap.data() as UsuarioData;  // Aqui fazemos o cast para o tipo correto
            if (userData) {
              if (userData.NomeCompleto) {
                setUserName(userData.NomeCompleto);
              }
              if (userData.cpf) {
                setUsercpf(userData.cpf);  // Atualizando o estado com o cpf
              }
              if (userData.email) {
                setUserEmail(userData.email);  // Atualizando o estado com o email
              }
              if(userData.id){
                setUserId(userData.id);
              }
            }
          }

          // Buscar cargos do usuário
          const userCargoRef = collection(db, "usuario_cargo");
          const q = query(userCargoRef, where("usuario_id", "==", user.uid));
          const userCargoSnapshot = await getDocs(q);

          // Coletar os cargoIds
          const cargoIds = userCargoSnapshot.docs
            .map(doc => doc.data().cargo_id)
            .filter(cargoId => cargoId !== undefined); // Filter out undefined cargoIds

          // Buscar os nomes dos cargos
          const cargoPromises = cargoIds.map(async (cargoId) => {
            const cargoRef = doc(db, "cargos", cargoId);
            const cargoSnap = await getDoc(cargoRef);
            if (cargoSnap.exists()) {
              const cargoData = cargoSnap.data() as CargoData;  // Cast para o tipo CargoData
              if (cargoData && cargoData.nome) {
                return cargoData.nome || null;
              }
            }
            return null;
          });

          const cargos = await Promise.all(cargoPromises);
          setUserRoles(cargos.filter(cargo => cargo !== null) as string[]);  // Filtra cargos válidos e faz o cast para string[]
          
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      } else {
        setUserId('');
        setUserName('SAP');
        setUserRoles([]);  // Limpa os cargos quando o usuário não está logado
        setUsercpf('');  // Limpa o cpf quando o usuário não está logado
        setUserEmail('');  // Limpa o email quando o usuário não está logado
      }
    });
  }, []);

  return (
    <UserContext.Provider value={{ userId, userName, userRoles, usercpf, userEmail, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;
