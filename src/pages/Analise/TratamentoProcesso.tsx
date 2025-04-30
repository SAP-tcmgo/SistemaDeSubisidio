import React, { useState, ChangeEvent, useEffect } from 'react';
import { useIsAuthenticated } from "@azure/msal-react"; // Keep for auth check
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
// Textarea not used currently
// Select not used currently
// Button not used currently (except potentially in Icons)
import { Trash2 } from 'lucide-react'; // Only keep Trash2 if used by Icons erase
import { useNavigate } from 'react-router-dom';
// Dialog components not needed anymore
// ScrollArea not needed anymore
import BreadcrumbNav from '../../components/BreadcrumbNav'; // Import the new component
import Icons from '../../components/Icons'; // Import the new Icons component
import '../../styles/AppAnalise.css';
import '../../styles/indexAnalise.css';
import { useDados } from '../../Contexts/DadosContext';
import axios from 'axios'; // Keep axios for IBGE API call


// Removed LeiPoliticaInflacionaria interface

const TratamentoProcesso: React.FC = () => { // Renamed component conceptually
  const navigate = useNavigate();
  // Removed instance, accounts from useMsal()
  const isAuthenticated = useIsAuthenticated(); // Keep for auth check

  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Removed user state
  // Removed graphError state
  const {
    municipio,
    numeroHabitantes,
    setNumeroHabitantes,
    doQueSeTrata,
    setDoQueSeTrata,
    // Removed leis and setLeis from context usage here
    leisColare, // Keep this as requested
    setLeisColare, // Keep this as requested
    numeroProcesso
  } = useDados();

  useEffect(() => {
    const ApiPopulacao = async () => {
      if (municipio && municipio.ID_IBGE) { // Use ID_IBGE
        try {
          const response = await axios.get(
            `https://apisidra.ibge.gov.br/values/t/6579/n6/${municipio.ID_IBGE}/v/9324/p/last` // Use ID_IBGE
          );
          const populationData = response.data[1];
          const population = populationData?.V || '0';
          setNumeroHabitantes(parseInt(population, 10));
        } catch (error: any) {
          console.error('Erro ao buscar população:', error);
          if (axios.isAxiosError(error) && error.response) {
            console.error('Erro ao buscar população (detalhes):', error.response.data);
          }
          setNumeroHabitantes(0); // Reset or handle error appropriately
        }
      } else {
        setNumeroHabitantes(0); // Reset if no municipio is selected
      }
    };

    ApiPopulacao();
  }, [municipio?.ID_IBGE, setNumeroHabitantes, municipio]); // Use ID_IBGE in dependency array

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleTratamentoCheckboxChange = (value: string) => {
    const newState = doQueSeTrata.includes(value)
      ? doQueSeTrata.filter((item: string) => item !== value)
      : [...doQueSeTrata, value];
    setDoQueSeTrata(newState);
  };

  const handleHabitantesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const numericValue = parseInt(event.target.value.replace(/\D/g, ''), 10);
    setNumeroHabitantes(isNaN(numericValue) ? 0 : numericValue);
  };

  const formatHabitantes = (num: number): string => {
    if (typeof num !== 'number' || isNaN(num)) {
      return '0';
    }
    return num.toLocaleString('pt-BR');
  };

  // --- Clear Screen Function ---
  const handleClearScreen = () => {
    // Reset context state related to this screen
    setDoQueSeTrata([]);
    // Removed reset for leis
    setLeisColare([]); // Keep this reset as requested

    // Removed reset for local state (leisInflacionarias, graphError, dialogs)
  };

  // --- Icon Click Handlers ---
  const handleErase = () => {
    handleClearScreen();
  };

  const handleBack = () => {
    navigate('/MunicipioEResponsaveis');
  };

  const handleNext = () => {
    navigate('/Fixacao');
  };

  // Removed MSAL Login Handler


  return (
    <div className="analise-theme flex min-h-screen flex-col bg-gray-50">
      <div className="min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="flex justify-between items-center">
          <Header toggleSidebar={toggleSidebar} />
          </div>

          {/* Update BreadcrumbNav currentPage */}
          <BreadcrumbNav currentPage="Tratamento Processo" sidebarOpen={sidebarOpen} />

          <main className="min-h-screen bg-pattern bg-gray-100 py-8 px-4 ">
              <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md overflow-hidden ">
                <div className="p-6">
                  <div className="mt-[-20px] flex justify-end">
                    <Icons
                        onEraseClick={handleErase}
                        onBackClick={handleBack}
                        onNextClick={handleNext}
                        // onSaveClick is omitted as it does nothing yet
                      />
                </div>
                <div className="relative mb-8 text-primary text-center">
                  <h1 className="text-2xl font-bold mt-[-20px]">Trata-se de Processo de Subsídio {numeroProcesso && `(${numeroProcesso})`}</h1>
                </div>

                {/* Keep Checkboxes */}
                <div className="text-gray-700 flex flex-wrap gap-6 mb-8">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fixacaoCheckbox"
                      checked={doQueSeTrata.includes("fixacao")}
                      onCheckedChange={() => handleTratamentoCheckboxChange("fixacao")}
                    />
                    <Label htmlFor="fixacaoCheckbox" className="text-sm">Fixação</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="revisaoGeralCheckbox"
                      checked={doQueSeTrata.includes("revisaoGeral")}
                      onCheckedChange={() => handleTratamentoCheckboxChange("revisaoGeral")}
                    />
                    <Label htmlFor="revisaoGeralCheckbox" className="text-sm">Revisão Geral Anual</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="decimoTerceiroCheckbox"
                      checked={doQueSeTrata.includes("decimoTerceiro")}
                      onCheckedChange={() => handleTratamentoCheckboxChange("decimoTerceiro")} // Corrected handler call
                    />
                    <Label htmlFor="decimoTerceiroCheckbox" className="text-sm">Décimo Terceiro</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="feriasCheckbox"
                      checked={doQueSeTrata.includes("ferias")}
                      onCheckedChange={() => handleTratamentoCheckboxChange("ferias")}
                    />
                    <Label htmlFor="feriasCheckbox" className="text-sm">Férias</Label>
                  </div>
                </div>

                {/* Keep Population Input */}
                <div className="text-gray-700 mb-8">
                  <h2 className="mb-2 font-medium text-sm">Número de Habitantes no município de {municipio?.Municipio || '...'}</h2>
                  <Input
                    type="text"
                    value={formatHabitantes(numeroHabitantes)}
                    onChange={handleHabitantesChange}
                    className="border-2 border-gray-300 h-12 w-32"
                    placeholder="0"
                  />
                </div>
              </div> {/* End p-6 */}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TratamentoProcesso; // Renamed export
