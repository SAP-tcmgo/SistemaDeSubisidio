import React, { useState } from "react";
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
import { db, collection, addDoc } from "../firebase"; // Import Firebase functions
import '../styles/AppConfiguracoesDashboard.css';
import '../styles/indexConfiguracoesDashboard.css';

interface PercentageRange {
  id: string;
  rangeStart: string;
  rangeEnd: string;
  percentage: string;
}

const CadastroADM = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Added sidebar state
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
    { id: "1", rangeStart: "", rangeEnd: "10000", percentage: "20" },
  ]);

  const handleAddRange = () => {
    const lastRange = percentageRanges[percentageRanges.length - 1];
    const newRangeStart = lastRange.rangeEnd;
    
    setPercentageRanges([
      ...percentageRanges,
      {
        id: Date.now().toString(),
        rangeStart: newRangeStart,
        rangeEnd: "",
        percentage: "",
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

  // Helper function to convert currency string to number
  const parseCurrency = (value: string): number => {
    if (!value) return 0;
    // Remove dots, replace comma with dot, then parse
    const numericString = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(numericString) || 0; // Return 0 if parsing fails
  };

  const handleSubmit = async (e: React.FormEvent) => { // Make async
    e.preventDefault();

    // Helper function to format habitant range
    const formatHabitanteRange = (start: string, end: string): string => {
      const startNum = parseInt(start) || 0;
      if (!end) {
        return `Acima de ${startNum.toLocaleString('pt-BR')}`;
      }
      return `${startNum.toLocaleString('pt-BR')} - ${parseInt(end).toLocaleString('pt-BR')}`;
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
      await addDoc(collection(db, "SubsidiosDeputadosEstaduais"), deputadosData);

      // 2. Save Ministros STF Subsidio
      // Consider adding logic to update existing record for the same AnoLegislatura if needed
      const ministrosData = {
        AnoLegislatura: ministrosLegislatura,
        Valor: parseCurrency(ministrosValor),
        fixadoPelaLei: ministrosLei,
        dataEntradaVigorLei: ministrosDataLei, // Keep as string for now
      };
      await addDoc(collection(db, "SubsidiosMinistrosSTF"), ministrosData);

      // 3. Save Percentual Salario Dep (one document per range)
      // Consider clearing existing ranges for this legislature before adding new ones if needed.
      // For now, just adding new ones. A better approach might be to store ranges within the Deputados document.
      for (const range of percentageRanges) {
        const percentualData = {
          // Assuming AnoLegislatura from Deputados is relevant here, or add a separate field if needed
          AnoLegislatura: deputadosLegislatura, // Or maybe a general config identifier?
          NrHabitantes: formatHabitanteRange(range.rangeStart, range.rangeEnd),
          PercentualUtilizado: `${range.percentage}%`,
          // Store raw values too if needed for calculations
          RangeStart: parseInt(range.rangeStart) || 0,
          RangeEnd: range.rangeEnd ? parseInt(range.rangeEnd) : null, // Use null for open-ended range
          PercentageValue: parseInt(range.percentage) || 0,
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
    <div className="dashboard-theme min-h-screen bg-gray-50 flex flex-col">
        <Header toggleSidebar={toggleSidebar} />

        <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        {/* Apply conditional margin and transition to the main content */}
        <main className={`flex-1 p-6 transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
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
                        rangeStart={range.rangeStart}
                        rangeEnd={range.rangeEnd}
                        percentage={range.percentage}
                        onRangeStartChange={(value) =>
                          updateRange(range.id, "rangeStart", value)
                        }
                        onRangeEndChange={(value) =>
                          updateRange(range.id, "rangeEnd", value)
                        }
                        onPercentageChange={(value) =>
                          updateRange(range.id, "percentage", value)
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
