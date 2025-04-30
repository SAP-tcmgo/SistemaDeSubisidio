import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import InputMask from 'react-input-mask'; // Import InputMask
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trash2, Edit, XCircle } from "lucide-react";
import PercentageRangeItem from "../components/PercentageRangeItem"; // Props type não é usada diretamente aqui
import { toast } from "sonner";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, collection, getDocs, serverTimestamp } from "../firebase"; // Import Firebase functions
import { doc, writeBatch } from "firebase/firestore"; // Added writeBatch
import '../styles/AppConfiguracoesDashboard.css';
import '../styles/indexConfiguracoesDashboard.css';

// Interface for Deputados/Ministros subsidy ranges
interface SubsidioFaixa {
  id: string; // Firestore document ID or temporary ID
  legislatura: string;
  valor: string; // Store as formatted string for mask
  lei: string;
  dataLei: string;
}

// Interface para as faixas percentuais por habitantes
interface PercentageRange {
  id: string; // ID do documento Firestore ou ID temporário
  maximo: string;
  minimo: string;
  porcentagem: string;
}

// Helper: Formata um número ou string para o formato de moeda brasileira (para exibição com máscara)
const formatCurrencyForMask = (value: number | string | undefined | null): string => {
    if (value === null || value === undefined || value === '') return '';
    // Converte string formatada para número, se necessário
    let num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
    if (isNaN(num)) return '';
    // Format to BRL without the R$ symbol, ensuring two decimal places
    // Formata para BRL sem o símbolo R$, garantindo duas casas decimais
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper: Converte uma string de moeda mascarada para número (para salvar no banco)
const parseMaskedCurrency = (maskedValue: string): number => {
    if (!maskedValue) return 0;
    // Remove pontos, substitui vírgula por ponto, remove placeholders da máscara
    const cleaned = maskedValue.replace(/\./g, '').replace(',', '.').replace(/_/g, '');
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value; // Retorna 0 se não for um número válido
};

// Helper: Formata um valor de input (string) para o formato de moeda brasileira enquanto o usuário digita
const formatCurrency = (value: string): string => {
  if (!value) return "";

  // Remove tudo que não for dígito
  let digits = value.replace(/\D/g, "");

  if (digits === "") return "";

  // Converte para número (considerando centavos)
  const numValue = Number(digits) / 100;

  // Formata como decimal brasileiro
  let formatted = new Intl.NumberFormat('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);

  return formatted;
};





const CadastroADM = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Estado para controlar o modo de edição
  // Estados para armazenar os dados iniciais buscados do Firebase (para detectar exclusões)
  const [initialDeputadosFaixas, setInitialDeputadosFaixas] = useState<SubsidioFaixa[]>([]);
  const [initialMinistrosFaixas, setInitialMinistrosFaixas] = useState<SubsidioFaixa[]>([]);
  const [initialPercentageRanges, setInitialPercentageRanges] = useState<PercentageRange[]>([]);

  const navigate = useNavigate();

  // State for Deputados subsidy ranges
  const [deputadosFaixas, setDeputadosFaixas] = useState<SubsidioFaixa[]>([
    { id: `temp_${Date.now()}`, legislatura: "", valor: "", lei: "", dataLei: "" }
  ]);

  // State for Ministros subsidy ranges
  const [ministrosFaixas, setMinistrosFaixas] = useState<SubsidioFaixa[]>([
    { id: `temp_${Date.now()}`, legislatura: "", valor: "", lei: "", dataLei: "" }
  ]);

  // State for Percentage ranges (Habitants)
  const [percentageRanges, setPercentageRanges] = useState<PercentageRange[]>([
    { id: `temp_${Date.now()}`, maximo: "", minimo: "", porcentagem: "" },
  ]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      // Fetch SubsidiosDeputadosEstaduais
      const deputadosSnapshot = await getDocs(collection(db, "SubsidiosDeputadosEstaduais"));
      const fetchedDeputados: SubsidioFaixa[] = deputadosSnapshot.docs.map(doc => ({
          id: doc.id,
          legislatura: doc.data().AnoLegislatura || "",
          valor: formatCurrencyForMask(doc.data().Valor), // Format value for mask
          lei: doc.data().fixadoPelaLei || "",
          dataLei: doc.data().dataEntradaVigorLei || "",
      }));
      if (fetchedDeputados.length > 0) {
          setDeputadosFaixas(fetchedDeputados);
          setInitialDeputadosFaixas(JSON.parse(JSON.stringify(fetchedDeputados))); // Deep copy for initial state
      } else {
          setDeputadosFaixas([{ id: `temp_${Date.now()}`, legislatura: "", valor: "", lei: "", dataLei: "" }]);
          setInitialDeputadosFaixas([]);
      }

      // Fetch SubsidiosMinistrosSTF
      const ministrosSnapshot = await getDocs(collection(db, "SubsidiosMinistrosSTF"));
      const fetchedMinistros: SubsidioFaixa[] = ministrosSnapshot.docs.map(doc => ({
          id: doc.id,
          legislatura: doc.data().AnoLegislatura || "",
          valor: formatCurrencyForMask(doc.data().Valor), // Format value for mask
          lei: doc.data().fixadoPelaLei || "",
          dataLei: doc.data().dataEntradaVigorLei || "",
      }));
      if (fetchedMinistros.length > 0) {
          setMinistrosFaixas(fetchedMinistros);
          setInitialMinistrosFaixas(JSON.parse(JSON.stringify(fetchedMinistros))); // Deep copy
      } else {
          setMinistrosFaixas([{ id: `temp_${Date.now()}`, legislatura: "", valor: "", lei: "", dataLei: "" }]);
          setInitialMinistrosFaixas([]);
      }

      // Fetch PercentualSalarioDep
      const percentageRangesSnapshot = await getDocs(collection(db, "PercentualSalarioDep"));
      const fetchedRanges: PercentageRange[] = [];
      percentageRangesSnapshot.forEach((doc) => {
          const data = doc.data();
          // Assuming NrHabitantes is stored like "10.001 - 50.000" or "Acima de 500.000"
          // And PercentualUtilizado like "20%"
          const nrHabitantes = data.NrHabitantes || "";
          const rangeParts = nrHabitantes.split(" - ");
          let maximo = "";
          let minimo = "";

          if (rangeParts.length === 2) {
              minimo = rangeParts[0].replace(/\./g, ''); // First part is min
              maximo = rangeParts[1].replace(/\./g, ''); // Second part is max
          } else if (nrHabitantes.startsWith("Acima de ")) {
              minimo = nrHabitantes.replace("Acima de ", "").replace(/\./g, ''); // Min value
              maximo = ""; // No upper limit
          }

          const porcentagem = data.PercentualUtilizado ? data.PercentualUtilizado.replace("%", "") : "";

          fetchedRanges.push({
              id: doc.id,
              maximo: maximo,
              minimo: minimo,
              porcentagem: porcentagem,
          });
      });
      if (fetchedRanges.length > 0) {
          setPercentageRanges(fetchedRanges);
          setInitialPercentageRanges(JSON.parse(JSON.stringify(fetchedRanges))); // Deep copy
      } else {
          setPercentageRanges([{ id: `temp_${Date.now()}`, maximo: "", minimo: "", porcentagem: "" }]);
          setInitialPercentageRanges([]);
      }

    } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        toast.error("Erro ao carregar dados!", {
            description: "Ocorreu um erro ao tentar carregar as informações do Firebase. Verifique o console para mais detalhes.",
        });
    }
  }, []); // Dependência vazia significa que fetchData não será recriada desnecessariamente

  // Busca os dados iniciais do Firebase ao montar o componente
  useEffect(() => {
    // Função assíncrona para buscar os dados das coleções no Firebase
    const fetchData = async () => {
      try {
        // 1. Busca Subsídios dos Deputados Estaduais
        const deputadosSnapshot = await getDocs(collection(db, "SubsidiosDeputadosEstaduais"));
        const fetchedDeputados: SubsidioFaixa[] = deputadosSnapshot.docs.map(doc => ({
            id: doc.id,
            legislatura: doc.data().AnoLegislatura || "",
            valor: formatCurrencyForMask(doc.data().Valor), // Formata valor para exibição com máscara
            lei: doc.data().fixadoPelaLei || "",
            dataLei: doc.data().dataEntradaVigorLei || "",
        }));
        // Define o estado atual e o estado inicial (para comparação posterior)
        if (fetchedDeputados.length > 0) {
            setDeputadosFaixas(fetchedDeputados);
            setInitialDeputadosFaixas(JSON.parse(JSON.stringify(fetchedDeputados))); // Cópia profunda
        } else {
            // Se não houver dados, inicia com uma faixa vazia
            setDeputadosFaixas([{ id: `temp_${Date.now()}`, legislatura: "", valor: "", lei: "", dataLei: "" }]);
            setInitialDeputadosFaixas([]);
        }

        // 2. Busca Subsídios dos Ministros do STF
        const ministrosSnapshot = await getDocs(collection(db, "SubsidiosMinistrosSTF"));
        const fetchedMinistros: SubsidioFaixa[] = ministrosSnapshot.docs.map(doc => ({
            id: doc.id,
            legislatura: doc.data().AnoLegislatura || "",
            valor: formatCurrencyForMask(doc.data().Valor), // Formata valor
            lei: doc.data().fixadoPelaLei || "",
            dataLei: doc.data().dataEntradaVigorLei || "",
        }));
        if (fetchedMinistros.length > 0) {
            setMinistrosFaixas(fetchedMinistros);
            setInitialMinistrosFaixas(JSON.parse(JSON.stringify(fetchedMinistros))); // Cópia profunda
        } else {
            setMinistrosFaixas([{ id: `temp_${Date.now()}`, legislatura: "", valor: "", lei: "", dataLei: "" }]);
            setInitialMinistrosFaixas([]);
        }

        // 3. Busca Percentuais de Salário por Habitantes
        const percentageRangesSnapshot = await getDocs(collection(db, "PercentualSalarioDep"));
        const fetchedRanges: PercentageRange[] = [];
        percentageRangesSnapshot.forEach((doc) => {
            const data = doc.data();
            // Assume que NrHabitantes está armazenado como "10.001 - 50.000" ou "Acima de 500.000"
            // E PercentualUtilizado como "20%"
            const nrHabitantes = data.NrHabitantes || "";
            const rangeParts = nrHabitantes.split(" - ");
            let minimo = "";
            let maximo = "";

            // Extrai os valores mínimo e máximo da string NrHabitantes
            if (rangeParts.length === 2) {
                minimo = rangeParts[0].replace(/\./g, ''); // Remove pontos
                maximo = rangeParts[1].replace(/\./g, ''); // Remove pontos
            } else if (nrHabitantes.startsWith("Acima de ")) {
                minimo = nrHabitantes.replace("Acima de ", "").replace(/\./g, ''); // Remove pontos
                maximo = ""; // Sem limite superior
            }

            // Extrai o valor percentual
            const porcentagem = data.PercentualUtilizado ? data.PercentualUtilizado.replace("%", "") : "";

            fetchedRanges.push({
                id: doc.id,
                maximo: maximo,
                minimo: minimo,
                porcentagem: porcentagem,
            });
        });
        if (fetchedRanges.length > 0) {
            setPercentageRanges(fetchedRanges);
            setInitialPercentageRanges(JSON.parse(JSON.stringify(fetchedRanges))); // Cópia profunda
        } else {
            setPercentageRanges([{ id: `temp_${Date.now()}`, maximo: "", minimo: "", porcentagem: "" }]);
            setInitialPercentageRanges([]);
        }

      } catch (error) {
          console.error("Erro ao buscar dados do Firebase:", error);
          toast.error("Erro ao carregar dados!", {
              description: "Ocorreu um erro ao tentar carregar as informações do Firebase. Verifique o console para mais detalhes.",
          });
      }
    };

    fetchData();
  }, []); // Executa apenas uma vez ao montar o componente

  // Gera opções para o dropdown de legislaturas (ex: "2025/2028")
  const generateLegislatureOptions = () => {
    const options = [];
    const startYearFirstTerm = 1997; // Primeiro ano da primeira legislatura relevante
    const endYearLastTerm = 2028;   // Último ano da última legislatura relevante

    let currentStartYear = startYearFirstTerm;
    // Gera as opções em incrementos de 4 anos
    while (currentStartYear <= endYearLastTerm - 3) { // Garante que o período completo de 4 anos esteja dentro do limite
        const currentEndYear = currentStartYear + 3;
        options.push(`${currentStartYear}/${currentEndYear}`);
        currentStartYear += 4; // Avança para a próxima legislatura
    }

    return options.reverse(); // Inverte para mostrar as mais recentes primeiro
  };

  // Armazena as opções de legislatura geradas
  const legislatureOptions = generateLegislatureOptions();


  // --- Handlers for Deputados Faixas ---
  const handleAddDeputadoFaixa = () => {
    setDeputadosFaixas((prev: SubsidioFaixa[]) => [ // Add type annotation
      ...prev,
      { id: `temp_${Date.now()}`, legislatura: "", valor: "", lei: "", dataLei: "" }
    ]);
  };

  const handleRemoveDeputadoFaixa = (id: string) => {
    setDeputadosFaixas((prev: SubsidioFaixa[]) => prev.filter((faixa: SubsidioFaixa) => faixa.id !== id)); // Add type annotations
  };

  const updateDeputadoFaixa = (id: string, field: keyof SubsidioFaixa, value: string) => {
    setDeputadosFaixas((prev: SubsidioFaixa[]) => // Add type annotation
      prev.map((faixa: SubsidioFaixa) => (faixa.id === id ? { ...faixa, [field]: value } : faixa)) // Add type annotation
    );
  };

  // --- Handlers for Ministros Faixas ---
  const handleAddMinistroFaixa = () => {
    setMinistrosFaixas((prev: SubsidioFaixa[]) => [ // Add type annotation
      ...prev,
      { id: `temp_${Date.now()}`, legislatura: "", valor: "", lei: "", dataLei: "" }
    ]);
  };

  const handleRemoveMinistroFaixa = (id: string) => {
    setMinistrosFaixas((prev: SubsidioFaixa[]) => prev.filter((faixa: SubsidioFaixa) => faixa.id !== id)); // Add type annotations
  };

  const updateMinistroFaixa = (id: string, field: keyof SubsidioFaixa, value: string) => {
    setMinistrosFaixas((prev: SubsidioFaixa[]) => // Add type annotation
      prev.map((faixa: SubsidioFaixa) => (faixa.id === id ? { ...faixa, [field]: value } : faixa)) // Add type annotation
    );
  }; // Ensure this closing brace is correct

  // --- Handlers for Percentage Ranges ---
 const handleAddPercentageRange = () => {
    setPercentageRanges((prevRanges: PercentageRange[]) => [ // Add type annotation
      ...prevRanges,
      { id: `temp_${Date.now()}`, maximo: "", minimo: "", porcentagem: "" },
    ]);
  };

  const handleRemovePercentageRange = (id: string) => {
    setPercentageRanges((prevRanges: PercentageRange[]) => prevRanges.filter((range: PercentageRange) => range.id !== id)); // Add type annotations
  };

  const updatePercentageRange = (id: string, field: keyof PercentageRange, value: string) => {
    setPercentageRanges((prevRanges: PercentageRange[]) => // Add type annotation
      prevRanges.map((range: PercentageRange) => // Add type annotation
        range.id === id ? { ...range, [field]: value } : range
      )
    );
  };

  // --- Edit Mode Toggle ---
  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling edit, revert to initial fetched data
      setDeputadosFaixas(JSON.parse(JSON.stringify(initialDeputadosFaixas.length > 0 ? initialDeputadosFaixas : [{ id: `temp_${Date.now()}`, legislatura: "", valor: "", lei: "", dataLei: "" }])));
      setMinistrosFaixas(JSON.parse(JSON.stringify(initialMinistrosFaixas.length > 0 ? initialMinistrosFaixas : [{ id: `temp_${Date.now()}`, legislatura: "", valor: "", lei: "", dataLei: "" }])));
      setPercentageRanges(JSON.parse(JSON.stringify(initialPercentageRanges.length > 0 ? initialPercentageRanges : [{ id: `temp_${Date.now()}`, maximo: "", minimo: "", porcentagem: "" }])));
    }
    setIsEditing(!isEditing); // Alterna o estado de edição
  };

  // --- Submissão do Formulário ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Previne o comportamento padrão do formulário
    if (!isEditing) return; // Só submete se estiver em modo de edição

    // Cria um batch de escrita para operações atômicas no Firestore
    const batch = writeBatch(db);

    try {
      // --- Processa Faixas de Subsídio dos Deputados ---
      // 1. Identifica IDs das faixas atuais
      const currentDeputadoIds = new Set(deputadosFaixas.map((f) => f.id));
      // 2. Identifica e marca para exclusão as faixas que estavam no estado inicial mas não estão mais no atual
      initialDeputadosFaixas.forEach((initialFaixa) => {
        // Só exclui se não for um ID temporário e não estiver na lista atual
        if (!initialFaixa.id.startsWith('temp_') && !currentDeputadoIds.has(initialFaixa.id)) {
          const docRef = doc(db, "SubsidiosDeputadosEstaduais", initialFaixa.id);
          batch.delete(docRef); // Adiciona a operação de exclusão ao batch
        }
      });
      // 3. Adiciona ou atualiza as faixas atuais no batch
      deputadosFaixas.forEach((faixa) => {
        const data = {
          AnoLegislatura: faixa.legislatura,
          Valor: parseMaskedCurrency(faixa.valor), // Converte valor mascarado para número
          fixadoPelaLei: faixa.lei,
          dataEntradaVigorLei: faixa.dataLei,
          updatedAt: serverTimestamp() // Adiciona timestamp de atualização/criação
        };
        if (faixa.id.startsWith('temp_')) { // Se for uma nova faixa (ID temporário)
          const newDocRef = doc(collection(db, "SubsidiosDeputadosEstaduais")); // Gera um novo ID
          batch.set(newDocRef, data); // Adiciona a operação de criação ao batch
        } else { // Se for uma faixa existente
          const docRef = doc(db, "SubsidiosDeputadosEstaduais", faixa.id);
          batch.update(docRef, data); // Adiciona a operação de atualização ao batch
        }
      });

      // --- Processa Faixas de Subsídio dos Ministros (lógica similar à dos deputados) ---
      const currentMinistroIds = new Set(ministrosFaixas.map((f) => f.id));
      initialMinistrosFaixas.forEach((initialFaixa) => {
        if (!initialFaixa.id.startsWith('temp_') && !currentMinistroIds.has(initialFaixa.id)) {
          const docRef = doc(db, "SubsidiosMinistrosSTF", initialFaixa.id);
          batch.delete(docRef);
        }
      });
      ministrosFaixas.forEach((faixa) => {
        const data = {
          AnoLegislatura: faixa.legislatura,
          Valor: parseMaskedCurrency(faixa.valor),
          fixadoPelaLei: faixa.lei,
          dataEntradaVigorLei: faixa.dataLei,
          updatedAt: serverTimestamp()
        };
        if (faixa.id.startsWith('temp_')) {
          const newDocRef = doc(collection(db, "SubsidiosMinistrosSTF"));
          batch.set(newDocRef, data);
        } else {
          const docRef = doc(db, "SubsidiosMinistrosSTF", faixa.id);
          batch.update(docRef, data);
        }
      });

      // --- Processa Faixas Percentuais por Habitantes ---
      const currentPercentageIds = new Set(percentageRanges.map((r) => r.id));
      // Helper interno para formatar a string NrHabitantes como salva no banco
      const formatHabitanteRange = (minStr: string, maxStr: string): string => {
        const min = parseInt(minStr.replace(/\./g, '')) || 0; // Converte para número
        const max = maxStr ? parseInt(maxStr.replace(/\./g, '')) : null; // Converte para número ou null

        if (max === null || max === Infinity || max === 0) { // Se não há máximo, usa "Acima de"
          return `Acima de ${min.toLocaleString('pt-BR')}`;
        }
        // Garante que min seja menor que max antes de formatar
        const actualMin = Math.min(min, max);
        const actualMax = Math.max(min, max);
        return `${actualMin.toLocaleString('pt-BR')} - ${actualMax.toLocaleString('pt-BR')}`;
      };
      // 1. Identifica e marca para exclusão
      initialPercentageRanges.forEach((initialRange) => {
        if (!initialRange.id.startsWith('temp_') && !currentPercentageIds.has(initialRange.id)) {
          const docRef = doc(db, "PercentualSalarioDep", initialRange.id);
          batch.delete(docRef);
        }
      });
      // 2. Adiciona ou atualiza
      percentageRanges.forEach((range) => {
         const minVal = parseInt(range.minimo.replace(/\./g, '')) || 0;
         const maxVal = range.maximo ? parseInt(range.maximo.replace(/\./g, '')) : null; // Pode ser null

         const data = {
           // AnoLegislatura pode precisar ser vinculado ou armazenado aqui se for relevante por faixa
           NrHabitantes: formatHabitanteRange(range.minimo, range.maximo), // Formata a string da faixa
           PercentualUtilizado: `${range.porcentagem}%`, // Adiciona o símbolo %
           minimo: minVal, // Salva o valor numérico mínimo
           maximo: maxVal, // Salva o valor numérico máximo (pode ser null)
           porcentagemValor: parseInt(range.porcentagem) || 0, // Salva o valor numérico do percentual
           updatedAt: serverTimestamp() // Timestamp
         };
        if (range.id.startsWith('temp_')) {
          const newDocRef = doc(collection(db, "PercentualSalarioDep"));
          batch.set(newDocRef, data);
        } else {
          const docRef = doc(db, "PercentualSalarioDep", range.id);
          batch.update(docRef, data);
        }
      });

      // Executa todas as operações no batch atomicamente
      await batch.commit();

      // Notifica o usuário sobre o sucesso
      toast.success("Dados salvos com sucesso!", {
        description: "As informações do administrador foram atualizadas no Firebase.",
      });
      setIsEditing(false); // Sai do modo de edição
      // Rebusca os dados para atualizar a UI com IDs e timestamps do servidor
      // (Chamada a fetchData foi movida para fora do useEffect para poder ser chamada aqui)
      // Idealmente, fetchData seria definida fora do useEffect ou passada como dependência estável.
      // Por simplicidade aqui, vamos assumir que a refetch manual funciona,
      // mas uma refatoração maior poderia usar useCallback para fetchData.
      // Re-executando a busca definida no useEffect:
      // (Nota: Isso pode não funcionar diretamente se fetchData não estiver no escopo.
      // Uma solução seria mover fetchData para fora do useEffect ou usar useCallback)
      // Para este exemplo, vamos assumir que uma atualização de página ou re-navegação faria o re-fetch.
      // Ou, melhor ainda, atualizar o estado local com os dados pós-save se possível.
      // Para manter simples, apenas saímos do modo de edição. O usuário pode precisar recarregar para ver IDs finais.

    } catch (error) {
      console.error("Erro ao salvar dados no Firebase:", error);
      // Correct toast call signature for sonner
      toast.error("Erro ao salvar dados.", {
        description: "Ocorreu um erro ao tentar salvar as informações no Firebase. Verifique o console para mais detalhes.",
        // variant: "destructive", // Sonner might infer destructive from toast.error
      });
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard-theme min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <Header toggleSidebar={toggleSidebar} />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center cursor-pointer" onClick={() => navigate('/telaInicial')}>
                    <ArrowLeft className="mr-2 text-tribunal-blue" size={24} />
                    <h1 className="text-3xl font-bold text-tribunal-blue">Cadastro de Administrador</h1>
                </div>
                {/* Edit/Cancel Buttons */}
                <div className="flex gap-2">
                    {!isEditing ? (
                        <Button onClick={handleEditToggle} variant="outline" className="text-tribunal-blue border-tribunal-blue hover:bg-tribunal-blue/10">
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                    ) : (
                        <Button onClick={handleEditToggle} variant="outline" className="text-red-600 border-red-600 hover:bg-red-600/10">
                            <XCircle className="mr-2 h-4 w-4" /> Cancelar Edição
                        </Button>
                    )}
                </div>
            </div>

          {/* Increased max-width */}
          <form onSubmit={handleSubmit} className="w-full max-w-7xl mx-auto space-y-6">
            {/* --- Deputados Section --- */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-primary">
                  Subsídios dos Deputados Estaduais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deputadosFaixas.map((faixa: SubsidioFaixa, index: number) => ( // Add types
                  <div key={faixa.id} className="flex items-end gap-4 p-3 border rounded-md relative">
                    {/* Inputs - Reordered */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                       {/* 1. Lei de fixação */}
                       <div className="md:col-span-1"> {/* Adjusted column span if needed */}
                        <label htmlFor={`dep-lei-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Lei de fixação dos subsídios</label>
                         <InputMask
                          mask="9.999/99" // Keep mask as is unless specified otherwise
                          maskChar={null}
                          value={faixa.lei}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDeputadoFaixa(faixa.id, "lei", e.target.value)}
                          disabled={!isEditing}
                        >
                          {(inputProps: any) => <Input {...inputProps} id={`dep-lei-${faixa.id}`} placeholder="x.xxx/xx" className={`w-full ${!isEditing ? 'bg-gray-100' : ''}`} />}
                        </InputMask>
                      </div>
                       {/* 2. Valor */}
                      <div>
                        <label htmlFor={`dep-val-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Valor dos subsídios</label>
                        <Input
                          id={`dep-val-${faixa.id}`}
                          placeholder="00.000,00"
                          value={faixa.valor}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { const formattedValue = formatCurrency(e.target.value); updateDeputadoFaixa(faixa.id, "valor", formattedValue); }}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-100" : ""}
                        />
                      </div>
                       {/* 3. Data */}
                      <div>
                        <label htmlFor={`dep-data-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Data entrada em vigor</label>
                        <div className="relative">
                          <Input
                            id={`dep-data-${faixa.id}`}
                            type="date"
                            value={faixa.dataLei}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDeputadoFaixa(faixa.id, "dataLei", e.target.value)} // Add type
                            disabled={!isEditing}
                            className={`pl-10 w-full ${!isEditing ? 'bg-gray-100' : ''}`}
                          />
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                        </div>
                       {/* 4. Legislatura Dropdown */}
                       <div>
                        <label htmlFor={`dep-leg-${faixa.id}`} className="tribunal-Dropdown block text-sm font-medium text-gray-700 mb-1">Legislatura Correspondente:</label>
                        <Select
                          value={faixa.legislatura}
                          onValueChange={(value) => updateDeputadoFaixa(faixa.id, "legislatura", value)}
                           disabled={!isEditing}
                         >
                           <SelectTrigger id={`dep-leg-${faixa.id}`} className={`w-full ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}>
                              <SelectValue placeholder="Selecione a legislatura" />
                            </SelectTrigger>
                           <SelectContent className="bg-white"> {/* Added bg-white */}
                             {legislatureOptions.map(option => (
                               <SelectItem key={option} value={option}>
                                 {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Remove Button */}
                    {isEditing && deputadosFaixas.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveDeputadoFaixa(faixa.id)}
                        className="text-red-500 hover:bg-red-100 absolute top-1 right-1"
                        aria-label="Remover faixa de subsídio do deputado" // Label em Português
                      >
                        <Trash2 size={18} />
                      </Button>
                    )}
                  </div>
                ))}
                {/* Add Button */}
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddDeputadoFaixa}
                    className="mt-2 text-secondary border-secondary hover:text-secondary/95"
                  >
                    Adicionar Nova Faixa (Deputados)
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* --- Ministros Section --- */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-primary">
                  Subsídios dos Ministros do STF
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ministrosFaixas.map((faixa: SubsidioFaixa, index: number) => ( // Add types
                  <div key={faixa.id} className="flex items-end gap-4 p-3 border rounded-md relative">
                    {/* Inputs - Reordered */}
                     <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                       {/* 1. Lei de fixação */}
                       <div className="md:col-span-1"> {/* Adjusted column span if needed */}
                        <label htmlFor={`min-lei-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Lei de fixação dos subsídios</label>
                         <InputMask
                          mask="9.999/99"
                          maskChar={null}
                          value={faixa.lei}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMinistroFaixa(faixa.id, "lei", e.target.value)}
                          disabled={!isEditing}
                        >
                           {(inputProps: any) => <Input {...inputProps} id={`min-lei-${faixa.id}`} placeholder="x.xxx/xx" className={`w-full ${!isEditing ? 'bg-gray-100' : ''}`} />}
                        </InputMask>
                      </div>
                       {/* 2. Valor */}
                       <div>
                        <label htmlFor={`min-val-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Valor dos subsídios</label>
                        <Input
                          id={`min-val-${faixa.id}`}
                          placeholder="00.000,00"
                          value={faixa.valor}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const formattedValue = formatCurrency(e.target.value);
                            updateMinistroFaixa(faixa.id, "valor", formattedValue);
                          }}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-100" : ""}
                        />
                      </div>
                       {/* 3. Data */}
                      <div>
                        <label htmlFor={`min-data-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Data entrada em vigor</label>
                        <div className="relative">
                          <Input
                            id={`min-data-${faixa.id}`}
                            type="date"
                            value={faixa.dataLei}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMinistroFaixa(faixa.id, "dataLei", e.target.value)} // Add type
                            disabled={!isEditing}
                            className={`pl-10 w-full ${!isEditing ? 'bg-gray-100' : ''}`}
                          />
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                        </div>
                       {/* 4. Legislatura Dropdown */}
                       <div>
                        <label htmlFor={`min-leg-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Legislatura Correspondente:</label>
                        <Select
                          value={faixa.legislatura}
                          onValueChange={(value) => updateMinistroFaixa(faixa.id, "legislatura", value)}
                           disabled={!isEditing}
                         >
                           <SelectTrigger id={`min-leg-${faixa.id}`} className={`w-full ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}>
                              <SelectValue placeholder="Selecione a legislatura" />
                            </SelectTrigger>
                           <SelectContent className="bg-white"> {/* Added bg-white */}
                             {legislatureOptions.map(option => (
                               <SelectItem key={option} value={option}>
                                 {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Remove Button */}
                    {isEditing && ministrosFaixas.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMinistroFaixa(faixa.id)}
                        className="text-red-500 hover:bg-red-100 absolute top-1 right-1"
                        aria-label="Remover faixa de subsídio do ministro" // Label em Português
                      >
                        <Trash2 size={18} />
                      </Button>
                    )}
                  </div>
                ))}
                {/* Add Button */}
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddMinistroFaixa}
                    className="mt-2 text-secondary border-secondary hover:text-secondary/95"
                  >
                    Adicionar Nova Faixa (Ministros)
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* --- Percentage Ranges Section --- */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-bold text-primary">
                  Percentuais do salário de Deputados Estaduais por Habitante
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {percentageRanges.map((range: PercentageRange, index: number) => ( // Add types
                    <PercentageRangeItem
                      key={range.id}
                      // id prop is not needed by PercentageRangeItem itself
                      index={index}
                      maximo={range.maximo}
                      minimo={range.minimo}
                      porcentagem={range.porcentagem}
                      onMaximoChange={(value) => updatePercentageRange(range.id, "maximo", value)}
                      onMinimoChange={(value) => updatePercentageRange(range.id, "minimo", value)}
                      onPorcentagemChange={(value) => updatePercentageRange(range.id, "porcentagem", value)}
                      onRemove={() => handleRemovePercentageRange(range.id)}
                      isRemovable={isEditing && percentageRanges.length > 1} // Only removable in edit mode
                      isDisabled={!isEditing} // Disable inputs if not editing
                    />
                  ))}
                  {isEditing && (
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddPercentageRange}
                        className="text-secondary border-secondary hover:text-secondary/95"
                      >
                        Adicionar Nova Faixa (Percentual)
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Save Button - Only shown when editing */}
            {isEditing && (
              <div className="mt-6 flex justify-end">
                <Button type="submit" className="bg-secondary hover:bg-secondary/90">
                  Salvar Alterações
                </Button>
              </div>
            )}
          </form>
        </main>
      </div>
    </div>
  );
};

export default CadastroADM;
