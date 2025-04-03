// src/context/DadosContext.tsx
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Assuming your firebase config is exported from here

interface Responsavel {
  nome: string;
  cargo: string;
  cpf: string;
}

interface Municipio {
  nome: string;
  codigo: string;
}

// New interface for the structure of included Colare laws
export interface LeiIncluida {
  id: number; // idEnvioColare from the original API object
  text: string; // Formatted law string
}

interface DadosContextType {
  numeroProcesso: string;
  municipio: Municipio;
  anoProcesso: string;
  responsaveis: Responsavel[];
  doQueSeTrata: string[];
  numeroHabitantes: number;
  leis: string[];
  leisColare: LeiIncluida[]; // Use the new interface
  loadAnaliseData: (numeroProcesso: string) => Promise<void>; // Function to load data
  setNumeroProcesso: React.Dispatch<React.SetStateAction<string>>;
  setMunicipio: React.Dispatch<React.SetStateAction<Municipio>>;
  setAnoProcesso: React.Dispatch<React.SetStateAction<string>>;
  setResponsaveis: React.Dispatch<React.SetStateAction<Responsavel[]>>;
  setDoQueSeTrata: React.Dispatch<React.SetStateAction<string[]>>;
  setNumeroHabitantes: React.Dispatch<React.SetStateAction<number>>;
  setLeis: React.Dispatch<React.SetStateAction<string[]>>;
  setLeisColare: React.Dispatch<React.SetStateAction<LeiIncluida[]>>; // Use the new interface
  resetDados: () => void; // Função para resetar os dados
}

const DadosContext = createContext<DadosContextType | undefined>(undefined);

// Custom Hook
export const useDados = () => {
  const context = useContext(DadosContext);
  if (!context) {
    throw new Error('useDados must be used within a DadosProvider');
  }
  return context;
};

// Definição do DadosProvider para aceitar children
interface DadosProviderProps {
  children: ReactNode;
}

export const DadosProvider: React.FC<DadosProviderProps> = ({ children }) => {
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [municipio, setMunicipio] = useState<Municipio>({ nome: '', codigo: '' });
  const [anoProcesso, setAnoProcesso] = useState('');
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [doQueSeTrata, setDoQueSeTrata] = useState<string[]>([]);
  const [numeroHabitantes, setNumeroHabitantes] = useState(0);
  const [leis, setLeis] = useState<string[]>([]);
  const [leisColare, setLeisColare] = useState<LeiIncluida[]>([]); // Use the new interface

  // Função para resetar todos os dados
  const resetDados = useCallback(() => {
    setNumeroProcesso('');
    setMunicipio({ nome: '', codigo: '' });
    setAnoProcesso('');
    setResponsaveis([]);
    setDoQueSeTrata([]);
    setNumeroHabitantes(0);
    setLeis([]);
    setLeisColare([]);
  }, []);

  // Função para carregar dados da análise do Firebase
  const loadAnaliseData = useCallback(async (numeroProc: string) => {
    if (!numeroProc) {
      console.log("Número do processo não fornecido, resetando dados.");
      resetDados(); // Reseta se não houver número de processo
      setNumeroProcesso(''); // Garante que numeroProcesso seja limpo
      return;
    }

    console.log(`Tentando carregar dados para o processo: ${numeroProc}`);
    const docRef = doc(db, 'analise', numeroProc); // Referência ao documento na coleção 'analise'
    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("Documento encontrado:", docSnap.data());
        const data = docSnap.data();
        // Atualiza todos os estados com os dados do Firebase
        setNumeroProcesso(numeroProc); // Mantém o número do processo atual
        setMunicipio(data.municipio || { nome: '', codigo: '' });
        setAnoProcesso(data.anoProcesso || '');
        setResponsaveis(data.responsaveis || []);
        setDoQueSeTrata(data.doQueSeTrata || []);
        setNumeroHabitantes(data.numeroHabitantes || 0);
        setLeis(data.leis || []);
        // Ensure loaded data conforms to the new structure or provide default
        setLeisColare(Array.isArray(data.leisColare) ? data.leisColare.map((item: any) => ({ id: item?.id ?? 0, text: item?.text ?? '' })) : []);
        // Adicione outros setters conforme necessário se houver mais campos
      } else {
        // Documento não encontrado, reseta os dados exceto o número do processo
        console.log("Nenhum documento encontrado para o processo:", numeroProc);
        resetDados();
        setNumeroProcesso(numeroProc); // Mantém o número do processo que foi buscado
      }
    } catch (error) {
      console.error("Erro ao buscar dados da análise:", error);
      // Em caso de erro, reseta os dados para evitar inconsistências
      resetDados();
      setNumeroProcesso(numeroProc); // Mantém o número do processo
    }
  }, [resetDados]); // Inclui resetDados nas dependências

  return (
    <DadosContext.Provider
      value={{
        numeroProcesso,
        municipio,
        anoProcesso,
        responsaveis,
        doQueSeTrata,
        numeroHabitantes,
        leis,
        leisColare,
        setNumeroProcesso,
        setMunicipio,
        setAnoProcesso,
        setResponsaveis,
        setDoQueSeTrata,
        setNumeroHabitantes,
        setLeis,
        setLeisColare,
        loadAnaliseData, // Disponibiliza a função de carregamento
        resetDados, // Disponibiliza a função reset para ser usada nas telas
      }}
    >
      {children}
    </DadosContext.Provider>
  );
};
