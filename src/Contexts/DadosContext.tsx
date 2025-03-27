// src/context/DadosContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Responsavel {
  nome: string;
  cargo: string;
  cpf: string;
}

interface Municipio {
  nome: string;
  codigo: string;
}

interface DadosContextType {
  numeroProcesso: string;
  municipio: Municipio;
  anoProcesso: string;
  responsaveis: Responsavel[];
  doQueSeTrata: string[];
  numeroHabitantes: number;
  leis: string[];
  leisColare: string[];
  setNumeroProcesso: (numero: string) => void;
  setMunicipio: (municipio: Municipio) => void;
  setAnoProcesso: (ano: string) => void;
  setResponsaveis: (responsaveis: Responsavel[]) => void;
  setDoQueSeTrata: (doQueSeTrata: string[]) => void;
  setNumeroHabitantes: (numero: number) => void;
  setLeis: (leis: string[]) => void;
  setLeisColare: (leisColare: string[]) => void;
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
  const [leisColare, setLeisColare] = useState<string[]>([]);

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
      }}
    >
      {children}
    </DadosContext.Provider>
  );
};
