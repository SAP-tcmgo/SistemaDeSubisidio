import React, { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import InputMask from 'react-input-mask'; // Import InputMask
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Trash2, Edit, XCircle } from "lucide-react"; // Added icons
import PercentageRangeItem, { PercentageRangeItemProps } from "../components/PercentageRangeItem"; // Import props type
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

interface PercentageRange {
  id: string; // Firestore document ID or temporary ID
  maximo: string;
  minimo: string;
  porcentagem: string;
}

// Helper to format number to Brazilian currency string (for display in mask)
const formatCurrencyForMask = (value: number | string | undefined | null): string => {
    if (value === null || value === undefined || value === '') return '';
    let num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
    if (isNaN(num)) return '';
    // Format to BRL without the R$ symbol, ensuring two decimal places
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper to parse masked currency string to number (for saving)
const parseMaskedCurrency = (maskedValue: string): number => {
    if (!maskedValue) return 0;
    const cleaned = maskedValue.replace(/\./g, '').replace(',', '.').replace(/_/g, ''); // Remove dots, replace comma, remove mask placeholders
    const value = parseFloat(cleaned);
    return isNaN(value) ? 0 : value;
};


const formatCurrency = (value: string): string => {
  if (!value) return "";

  let digits = value.replace(/\D/g, "");

  if (digits === "") return "";

  const numValue = Number(digits) / 100;

  let formatted = new Intl.NumberFormat('pt-BR', {
    style: 'decimal', 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);

  // Handle the edge case where the user deletes everything, results in "0,00"
  // but maybe you want an empty string instead?
  // if (formatted === "0,00" && digits !== "0" && digits !== "00" ) {
      // Check if the original digits weren't explicitly zero
      // Decide if you want to return "" or "0,00" when input is cleared or becomes zero
  // }

  return formatted;
};





const CadastroADM = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // State for edit mode
  const [initialDeputadosFaixas, setInitialDeputadosFaixas] = useState<SubsidioFaixa[]>([]); // Store initial state for delete detection
  const [initialMinistrosFaixas, setInitialMinistrosFaixas] = useState<SubsidioFaixa[]>([]); // Store initial state for delete detection
  const [initialPercentageRanges, setInitialPercentageRanges] = useState<PercentageRange[]>([]); // Store initial state for delete detection

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
  }, [setDeputadosFaixas, setInitialDeputadosFaixas, setMinistrosFaixas, setInitialMinistrosFaixas, setPercentageRanges, setInitialPercentageRanges]); // Add dependency array to useCallback

  useEffect(() => {
    fetchData();
  }, [fetchData]); // Fetch data on mount

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
    setIsEditing(!isEditing);
  };

  // --- Form Submission ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return; // Only submit if in edit mode

    const batch = writeBatch(db); // Use batch writes for atomicity

    try {
      // --- Process Deputados Faixas ---
      const currentDeputadoIds = new Set(deputadosFaixas.map((f: SubsidioFaixa) => f.id)); // Add type
      initialDeputadosFaixas.forEach((initialFaixa: SubsidioFaixa) => { // Add type
        if (!initialFaixa.id.startsWith('temp_') && !currentDeputadoIds.has(initialFaixa.id)) {
          const docRef = doc(db, "SubsidiosDeputadosEstaduais", initialFaixa.id);
          batch.delete(docRef);
        }
      });
      // Add or Update current ranges
      deputadosFaixas.forEach((faixa: SubsidioFaixa) => { // Add type
        const data = {
          AnoLegislatura: faixa.legislatura,
          Valor: parseMaskedCurrency(faixa.valor),
          fixadoPelaLei: faixa.lei,
          dataEntradaVigorLei: faixa.dataLei,
          updatedAt: serverTimestamp() // Add timestamp
        };
        if (faixa.id.startsWith('temp_')) { // New range
          const newDocRef = doc(collection(db, "SubsidiosDeputadosEstaduais")); // Auto-generate ID
          batch.set(newDocRef, data);
        } else { // Existing range
          const docRef = doc(db, "SubsidiosDeputadosEstaduais", faixa.id);
          batch.update(docRef, data);
        }
      });

      // --- Process Ministros Faixas ---
      const currentMinistroIds = new Set(ministrosFaixas.map((f: SubsidioFaixa) => f.id)); // Add type
      initialMinistrosFaixas.forEach((initialFaixa: SubsidioFaixa) => { // Add type
        if (!initialFaixa.id.startsWith('temp_') && !currentMinistroIds.has(initialFaixa.id)) {
          const docRef = doc(db, "SubsidiosMinistrosSTF", initialFaixa.id);
          batch.delete(docRef);
        }
      });
      // Add or Update current ranges
      ministrosFaixas.forEach((faixa: SubsidioFaixa) => { // Add type
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

      // --- Process Percentage Ranges ---
      const currentPercentageIds = new Set(percentageRanges.map((r: PercentageRange) => r.id)); // Add type
       // Helper function to format habitant range string
      const formatHabitanteRange = (minStr: string, maxStr: string): string => {
        const min = parseInt(minStr.replace(/\./g, '')) || 0;
        const max = maxStr ? parseInt(maxStr.replace(/\./g, '')) : null;

        if (max === null || max === Infinity || max === 0) {
          return `Acima de ${min.toLocaleString('pt-BR')}`;
        }
        // Ensure min is actually smaller than max if both exist
        const actualMin = Math.min(min, max);
        const actualMax = Math.max(min, max);
        return `${actualMin.toLocaleString('pt-BR')} - ${actualMax.toLocaleString('pt-BR')}`;
      };
      // Delete ranges removed in UI
      initialPercentageRanges.forEach((initialRange: PercentageRange) => { // Add type
        if (!initialRange.id.startsWith('temp_') && !currentPercentageIds.has(initialRange.id)) {
          const docRef = doc(db, "PercentualSalarioDep", initialRange.id);
          batch.delete(docRef);
        }
      });
      // Add or Update current ranges
      percentageRanges.forEach((range: PercentageRange) => { // Add type
         const minVal = parseInt(range.minimo.replace(/\./g, '')) || 0;
         const maxVal = range.maximo ? parseInt(range.maximo.replace(/\./g, '')) : null;

         const data = {
           // AnoLegislatura might need to be linked or stored here if relevant per range
           NrHabitantes: formatHabitanteRange(range.minimo, range.maximo),
           PercentualUtilizado: `${range.porcentagem}%`,
           minimo: minVal,
           maximo: maxVal,
           porcentagemValor: parseInt(range.porcentagem) || 0,
           updatedAt: serverTimestamp()
         };
        if (range.id.startsWith('temp_')) {
          const newDocRef = doc(collection(db, "PercentualSalarioDep"));
          batch.set(newDocRef, data);
        } else {
          const docRef = doc(db, "PercentualSalarioDep", range.id);
          batch.update(docRef, data);
        }
      });

      // Commit all changes
      await batch.commit();

      // Correct toast call signature for sonner
      toast.success("Dados salvos com sucesso!", {
        description: "As informações do administrador foram atualizadas no Firebase.",
        // variant: "success", // Sonner might infer success from toast.success
      });
      setIsEditing(false); // Exit edit mode
      fetchData(); // Re-fetch data to get updated IDs and potentially server-generated timestamps

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
                    {/* Inputs */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label htmlFor={`dep-leg-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Ano/Legislatura</label>
                        <Input
                          id={`dep-leg-${faixa.id}`}
                          value={faixa.legislatura}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDeputadoFaixa(faixa.id, "legislatura", e.target.value)} // Add type
                          placeholder="xxxx/xxxx"
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-100' : ''}
                        />
                      </div>
                      <div>
                        <label htmlFor={`dep-val-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                        <Input
                          id={`dep-val-${faixa.id}`}
                          placeholder="00.000,00"
                          value={faixa.valor}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const formattedValue = formatCurrency(e.target.value); 
                            updateDeputadoFaixa(faixa.id, "valor", formattedValue);
                          }}
                          disabled={!isEditing}
                          className={!isEditing ? "bg-gray-100" : ""}
                        />
                      </div>
                      <div>
                        <label htmlFor={`dep-lei-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Fixado pela Lei</label>
                         <InputMask
                          mask="9.999/99"
                          maskChar={null} // Use null instead of "_"
                          value={faixa.lei}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDeputadoFaixa(faixa.id, "lei", e.target.value)} // Add type
                          disabled={!isEditing}
                        >
                          {(inputProps: any) => <Input {...inputProps} id={`dep-lei-${faixa.id}`} placeholder="x.xxx/xx" className={!isEditing ? 'bg-gray-100' : ''} />}
                        </InputMask>
                      </div>
                      <div>
                        <label htmlFor={`dep-data-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Data entrada em vigor</label>
                        <div className="relative">
                          <Input
                            id={`dep-data-${faixa.id}`}
                            type="date"
                            value={faixa.dataLei}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateDeputadoFaixa(faixa.id, "dataLei", e.target.value)} // Add type
                            disabled={!isEditing}
                            className={`pl-10 ${!isEditing ? 'bg-gray-100' : ''}`}
                          />
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        </div>
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
                        aria-label="Remover faixa deputado"
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
                    {/* Inputs */}
                     <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label htmlFor={`min-leg-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Ano/Legislatura</label>
                        <Input
                          id={`min-leg-${faixa.id}`}
                          value={faixa.legislatura}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMinistroFaixa(faixa.id, "legislatura", e.target.value)} // Add type
                          placeholder="xxxx/xxxx"
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-gray-100' : ''}
                        />
                      </div>
<div>
                        <label htmlFor={`min-val-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
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
                      <div>
                        <label htmlFor={`min-lei-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Fixado pela Lei</label>
                         <InputMask
                          mask="9.999/99"
                          maskChar={null} // Use null instead of "_"
                          value={faixa.lei}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMinistroFaixa(faixa.id, "lei", e.target.value)} // Add type
                          disabled={!isEditing}
                        >
                           {(inputProps: any) => <Input {...inputProps} id={`min-lei-${faixa.id}`} placeholder="x.xxx/xx" className={!isEditing ? 'bg-gray-100' : ''} />}
                        </InputMask>
                      </div>
                      <div>
                        <label htmlFor={`min-data-${faixa.id}`} className="block text-sm font-medium text-gray-700 mb-1">Data entrada em vigor</label>
                        <div className="relative">
                          <Input
                            id={`min-data-${faixa.id}`}
                            type="date"
                            value={faixa.dataLei}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateMinistroFaixa(faixa.id, "dataLei", e.target.value)} // Add type
                            disabled={!isEditing}
                            className={`pl-10 ${!isEditing ? 'bg-gray-100' : ''}`}
                          />
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        </div>
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
                        aria-label="Remover faixa ministro"
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
