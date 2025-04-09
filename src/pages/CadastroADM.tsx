import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import PercentageRangeItem from "../components/PercentageRangeItem";
import { toast } from "sonner";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, collection, addDoc, getDocs } from "../firebase"; // Import Firebase functions
import { updateDoc, doc, query, where, deleteDoc } from "firebase/firestore";
import '../styles/AppConfiguracoesDashboard.css';
import '../styles/indexConfiguracoesDashboard.css';

interface PercentageRange {
  id: string;
  maximo: string;
  minimo: string;
  porcentagem: string;
}

const CadastroADM = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [deputadosLegislatura, setDeputadosLegislatura] = useState("");
  const [deputadosValor, setDeputadosValor] = useState("");
  const [deputadosLei, setDeputadosLei] = useState("");
  const [deputadosDataLei, setDeputadosDataLei] = useState("");

  const [ministrosLegislatura, setMinistrosLegislatura] = useState("");
  const [ministrosValor, setMinistrosValor] = useState("");
  const [ministrosLei, setMinistrosLei] = useState("");
  const [ministrosDataLei, setMinistrosDataLei] = useState("");

  const [percentageRanges, setPercentageRanges] = useState<PercentageRange[]>([
    { id: "1", maximo: "", minimo: "10000", porcentagem: "20" },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch SubsidiosDeputadosEstaduais
        const deputadosSnapshot = await getDocs(collection(db, "SubsidiosDeputadosEstaduais"));
        deputadosSnapshot.forEach((doc) => {
          const data = doc.data();
          setDeputadosLegislatura(data.AnoLegislatura || "");
          setDeputadosValor(data.Valor ? data.Valor.toString() : "");
          setDeputadosLei(data.fixadoPelaLei || "");
          setDeputadosDataLei(data.dataEntradaVigorLei || "");
        });

        // Fetch SubsidiosMinistrosSTF
        const ministrosSnapshot = await getDocs(collection(db, "SubsidiosMinistrosSTF"));
        ministrosSnapshot.forEach((doc) => {
          const data = doc.data();
          setMinistrosLegislatura(data.AnoLegislatura || "");
          setMinistrosValor(data.Valor ? data.Valor.toString() : "");
          setMinistrosLei(data.fixadoPelaLei || "");
          setMinistrosDataLei(data.dataEntradaVigorLei || "");
        });

        // Fetch PercentualSalarioDep
        const percentageRangesSnapshot = await getDocs(collection(db, "PercentualSalarioDep"));
        const ranges: PercentageRange[] = [];
        percentageRangesSnapshot.forEach((doc) => {
          const data = doc.data();
          const nrHabitantes = data.NrHabitantes;
          const rangeParts = nrHabitantes.split(" - ");

          let maximo = "";
          let minimo = "";

          if (rangeParts.length === 2) {
              maximo = rangeParts[0].replace(/\./g, '');
              minimo = rangeParts[1].replace(/\./g, '');
          } else if (nrHabitantes.startsWith("Acima de ")) {
              maximo = nrHabitantes.replace("Acima de ", "").replace(/\./g, '');
              minimo = "";
          }

          const porcentagem = data.PercentualUtilizado ? data.PercentualUtilizado.replace("%", "") : "";

          ranges.push({
              id: doc.id,
              maximo: maximo,
              minimo: minimo,
              porcentagem: porcentagem,
          });
        });
        // Merge fetched ranges with initial state
        setPercentageRanges(prevRanges => {
          // If there are existing ranges in Firebase, use them. Otherwise, keep the initial range.
          return ranges.length > 0 ? ranges : prevRanges;
        });

      } catch (error) {
        console.error("Error fetching data from Firebase:", error);
        toast("Erro ao carregar dados!",{
          description: "Ocorreu um erro ao tentar carregar as informações do Firebase. Verifique o console para mais detalhes.",
        });
      }
    };

    fetchData();
  }, []);

 const handleAddRange = () => {
    const lastRange = percentageRanges[percentageRanges.length - 1];
    const newMaximo = lastRange ? lastRange.minimo : "";

    setPercentageRanges(prevRanges => [
      ...prevRanges,
      {
        id: Date.now().toString(),
        maximo: newMaximo,
        minimo: "",
        porcentagem: "",
      },
    ]);
  };

  const handleRemoveRange = (id: string) => {
    setPercentageRanges(percentageRanges.filter((range) => range.id !== id));
  };

  const updateRange = (id: string, field: keyof PercentageRange, value: string) => {
    setPercentageRanges(
      percentageRanges.map((range) =>
        range.id === id ? { ...range, [field]: value } : range
      )
    );
  };

  // Refined helper function to parse currency, handling various pt-BR formats
  const parseCurrency = (value: string): number => {
      if (!value) return 0;
      // 1. Remove currency symbols and whitespace
      let cleanedValue = value.replace(/R\$|\s/g, '');

      // 2. Standardize to use '.' as decimal separator
      // Check if comma exists (likely pt-BR decimal separator)
      if (cleanedValue.includes(',')) {
          // Remove thousand separators (dots)
          cleanedValue = cleanedValue.replace(/\./g, '');
          // Replace comma decimal separator with dot
          cleanedValue = cleanedValue.replace(',', '.');
      } else {
          // No comma found. Dot might be a decimal or thousand separator.
          const dotCount = (cleanedValue.match(/\./g) || []).length;

          if (dotCount === 1 && cleanedValue.endsWith('.')) {
               // Handle case like "3500." -> treat as 3500
               cleanedValue = cleanedValue.slice(0, -1);
          } else if (dotCount === 1 && cleanedValue.indexOf('.') === cleanedValue.length - 3) {
              // Single dot, two digits after it (e.g., "3500.00") -> Treat as decimal
              // No change needed for parseFloat.
          } else if (dotCount >= 1) {
               // Multiple dots, or single dot not followed by 2 digits -> Assume dots are thousand separators
               cleanedValue = cleanedValue.replace(/\./g, '');
          }
          // If no dots or commas (e.g., "3500"), cleanedValue remains "3500"
      }

      // 3. Parse the standardized string
      const numericValue = parseFloat(cleanedValue);
      return isNaN(numericValue) ? 0 : numericValue;
  };

  const handleSubmit = async (e: React.FormEvent) => { // Make async
    e.preventDefault();

    // Helper function to format habitant range using the actual lower and upper bounds
    const formatHabitanteRange = (lower: number, upper: number | null): string => {
      if (upper === null || upper === Infinity) {
        return `Acima de ${lower.toLocaleString('pt-BR')}`;
      }
      return `${lower.toLocaleString('pt-BR')} - ${upper.toLocaleString('pt-BR')}`;
    };

    try {
      // 1. Save Deputados Estaduais Subsidio
      // Consider adding logic to update existing record for the same AnoLegislatura if needed
      const deputadosData = {
        AnoLegislatura: deputadosLegislatura,
        Valor: parseCurrency(deputadosValor),
        fixadoPelaLei: deputadosLei,
        dataEntradaVigorLei: deputadosDataLei, // Keep as string for now
      };
      // Check if a document with the same AnoLegislatura exists
      const deputadosQuery = query(
        collection(db, "SubsidiosDeputadosEstaduais"),
        where("AnoLegislatura", "==", deputadosLegislatura)
      );
      const deputadosSnapshot = await getDocs(deputadosQuery);

      if (deputadosSnapshot.docs.length > 0) {
        // Update existing document
        const docRef = doc(db, "SubsidiosDeputadosEstaduais", deputadosSnapshot.docs[0].id);
        await updateDoc(docRef, deputadosData);
      } else {
        // Create new document
        await addDoc(collection(db, "SubsidiosDeputadosEstaduais"), deputadosData);
      }

      // 2. Save Ministros STF Subsidio
      // Consider adding logic to update existing record for the same AnoLegislatura if needed
      const ministrosData = {
        AnoLegislatura: ministrosLegislatura,
        Valor: parseCurrency(ministrosValor),
        fixadoPelaLei: ministrosLei,
        dataEntradaVigorLei: ministrosDataLei, // Keep as string for now
      };
     // Check if a document with the same AnoLegislatura exists
      const ministrosQuery = query(
        collection(db, "SubsidiosMinistrosSTF"),
        where("AnoLegislatura", "==", ministrosLegislatura)
      );
      const ministrosSnapshot = await getDocs(ministrosQuery);

      if (ministrosSnapshot.docs.length > 0) {
        // Update existing document
        const docRef = doc(db, "SubsidiosMinistrosSTF", ministrosSnapshot.docs[0].id);
        await updateDoc(docRef, ministrosData);
      } else {
        // Create new document
        await addDoc(collection(db, "SubsidiosMinistrosSTF"), ministrosData);
      }

      // 3. Save Percentual Salario Dep (one document per range)
      // Delete existing documents for the same AnoLegislatura first
      const percentualQuery = query(
        collection(db, "PercentualSalarioDep"),
        where("AnoLegislatura", "==", deputadosLegislatura)
      );
      const percentualSnapshot = await getDocs(percentualQuery);
      for (const docToDelete of percentualSnapshot.docs) {
        await deleteDoc(doc(db, "PercentualSalarioDep", docToDelete.id));
      }

      // Add new documents for each range, ensuring correct min/max assignment
      for (const range of percentageRanges) {
        // Parse the potentially swapped values from state
        const val1 = parseInt(range.maximo) || 0; // Value from the 'maximo' state field (might be lower bound)
        const val2Str = range.minimo; // Value from the 'minimo' state field (might be upper bound or empty)
        const val2 = val2Str ? parseInt(val2Str) : null; // Parse if not empty

        let actualMinimo: number;
        let actualMaximo: number | null;

        if (val2 === null) {
          // Open-ended range (e.g., "Acima de X")
          actualMinimo = val1;
          actualMaximo = null;
        } else {
          // Closed range, determine actual min and max
          actualMinimo = Math.min(val1, val2);
          actualMaximo = Math.max(val1, val2);
        }

        const percentualData = {
          AnoLegislatura: deputadosLegislatura,
          // Use actualMinimo and actualMaximo for formatting and saving
          NrHabitantes: formatHabitanteRange(actualMinimo, actualMaximo),
          PercentualUtilizado: `${range.porcentagem}%`,
          minimo: actualMinimo, // Save the smaller value as minimo
          maximo: actualMaximo, // Save the larger value (or null) as maximo
          porcentagemValor: parseInt(range.porcentagem) || 0,
        };
        await addDoc(collection(db, "PercentualSalarioDep"), percentualData);
      }

      toast("Dados salvos com sucesso!", {
        description: "As informações do administrador foram cadastradas no Firebase.",
      });

    } catch (error) {
      console.error("Erro ao salvar dados no Firebase:", error);
      toast("Erro ao salvar dados!", {
        description: "Ocorreu um erro ao tentar salvar as informações no Firebase. Verifique o console para mais detalhes.",
        // variant: "destructive", // Uncomment if sonner supports variants
      });
    }
  };


  const toggleSidebar = () => { // Added toggleSidebar function
    setSidebarOpen(!sidebarOpen);
  };

  return (
    // Removed flex flex-col from the outermost div as it's handled internally now
    <div className="dashboard-theme min-h-screen bg-gray-50"> 
        {/* Sidebar remains fixed */}
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} /> 

        {/* This div now wraps Header and main, and handles the margin shift */}
        <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {/* Header moved inside the shifting container */}
          <Header toggleSidebar={toggleSidebar} /> 

          {/* Main content no longer needs individual margin adjustment */}
          <main className="flex-1 p-6"> 
            <div className="flex items-center mb-6 cursor-pointer" onClick={() => navigate('/telaInicial')}>
              <ArrowLeft className="mr-2 text-tribunal-blue" size={24} />
              <h1 className="text-3xl font-bold text-tribunal-blue">Cadastro de Administrador</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="w-full max-w-6xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2"> {/* Removed space-y-3 */}
              <Card className="md:col-span-1 h-full">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary">
                      Subsídios dos Deputados Estaduais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[15px]">
                      <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ano/Legislatura
                      </label>
                      <Input
                        value={deputadosLegislatura}
                        onChange={(e) => setDeputadosLegislatura(e.target.value)}
                        placeholder="2020/2024"
                      />
                    </div>
                    <div className="ml-[-5px] w-[90px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor
                      </label>
                      <div className="relative">
                        <Input
                          value={deputadosValor}
                          onChange={(e) => setDeputadosValor(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div className="ml-[-40px] w-[120px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fixado pela Lei
                      </label>
                      <Input
                        value={deputadosLei}
                        onChange={(e) => setDeputadosLei(e.target.value)}
                        placeholder="1.111/11"
                      />
                    </div>
                    <div className="ml-[-43px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data entrada em vigor
                      </label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={deputadosDataLei}
                          onChange={(e) => setDeputadosDataLei(e.target.value)}
                          className="pl-10"
                        />
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-1 h-full">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-primary">
                      Subsídios dos Ministros do STF
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[15px]">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ano/Legislatura
                      </label>
                      <Input
                        value={ministrosLegislatura}
                        onChange={(e) => setMinistrosLegislatura(e.target.value)}
                        placeholder="2020/2024"
                      />
                    </div>
                    <div className="ml-[-5px] w-[90px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor
                      </label>
                      <div className="relative">
                        <Input
                          value={ministrosValor}
                          onChange={(e) => setMinistrosValor(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <div className="ml-[-40px] w-[120px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fixado pela Lei
                      </label>
                      <Input
                        value={ministrosLei}
                        onChange={(e) => setMinistrosLei(e.target.value)}
                        placeholder="1.111/11"
                      />
                    </div>
                    <div className="ml-[-43px]">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data entrada em vigor
                      </label>
                      <div className="relative">
                        <Input
                          type="date"
                          value={ministrosDataLei}
                          onChange={(e) => setMinistrosDataLei(e.target.value)}
                          className="pl-10"
                        />
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-[10px] md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-primary">
                    Percentuais do salário de Deputados Estaduais a ser utilizado para cálculo por habitante
                  </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {percentageRanges.map((range, index) => (
                        <PercentageRangeItem
                          key={range.id}
                          index={index}
                          maximo={range.maximo}
                          minimo={range.minimo}
                          porcentagem={range.porcentagem}
                          onMaximoChange={(value) =>
                            updateRange(range.id, "maximo", value)
                          }
                          onMinimoChange={(value) =>
                            updateRange(range.id, "minimo", value)
                          }
                          onPorcentagemChange={(value) =>
                            updateRange(range.id, "porcentagem", value)
                          }
                          onRemove={() => handleRemoveRange(range.id)}
                          isRemovable={percentageRanges.length > 1}
                        />
                      ))}
                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddRange}
                          className="text-secondary border-secondary hover:text-secondary/95"
                        >
                          Adicionar Nova Faixa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <Button type="submit" className="bg-secondary hover:bg-secondary/90">
                      Salvar Dados
                    </Button>
                  </div>
                </form>
              </main>
            </div>
          </div>
        );
      };

      export default CadastroADM;
