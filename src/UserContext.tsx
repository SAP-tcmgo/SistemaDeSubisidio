import React, { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";


const UserContext = createContext({ userName: 'SAP' });

export const UserProvider = ({ children }) => {
  const [userName, setUserName] = useState('SAP');
  const db = getFirestore();

  useEffect(() => {
    const auth = getAuth();

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "usuarios", user.uid);
          const docSnap = await getDoc(userRef);

          if (docSnap.exists()) {
            const userData = docSnap.data();
            if (userData && userData.NomeCompleto) {
              setUserName(userData.NomeCompleto);
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      } else {
        setUserName('SAP');
      }
    });
  }, []);

  return (
    <UserContext.Provider value={{ userName }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
