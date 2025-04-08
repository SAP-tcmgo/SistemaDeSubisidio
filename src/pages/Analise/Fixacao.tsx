import React, { useState, useEffect, useMemo } from 'react'; // Added useEffect, useMemo
import { Calendar, Info } from 'lucide-react'; // Added Info icon for messages
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import BreadcrumbNav from '../../components/BreadcrumbNav'; // Added BreadcrumbNav
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import Icons from '../../components/Icons';
import { useDados } from '../../Contexts/DadosContext'; // Added useDados
import '../../styles/AppAnalise.css'; // Added styles
import '../../styles/indexAnalise.css';
import VerificationIcon from '../../components/VerificationIcon';
import { db } from '../../firebase'; // Import db
import { collection, query, where, getDocs, limit } from 'firebase/firestore'; // Import Firestore functions
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Import Tooltip for messages

// Interfaces for Firebase data
interface SubsidioFirebase {
  AnoLegislatura: string;
  Valor: number;
  fixadoPelaLei: string;
  dataEntradaVigorLei: string;
}

interface PercentualFirebase {
  AnoLegislatura: string;
  NrHabitantes: string;
  PercentualUtilizado: string;
  RangeStart: number;
  RangeEnd: number | null;
  PercentageValue: number;
}

// Interface for validation results
interface ValidationResult {
  isValid: boolean;
  message: string | null;
}

// Define structure for subsidy data within the component
interface SubsidioItem {
  cargo: string;
  valorKey: string; // Key in formData for the value input
  validationKey: string; // Key for the validation result state
}


const Fixacao: React.FC = () => {
  const navigate = useNavigate();
  const { numeroProcesso, numeroHabitantes } = useDados(); // Get numeroHabitantes
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for fetched Firebase data
  const [subsidioDeputadoEstadual, setSubsidioDeputadoEstadual] = useState<SubsidioFirebase | null>(null);
  const [subsidioMinistroSTF, setSubsidioMinistroSTF] = useState<SubsidioFirebase | null>(null);
  const [percentuaisSalarioDep, setPercentuaisSalarioDep] = useState<PercentualFirebase[]>([]);

  // State for validation results
  const [validationResults, setValidationResults] = useState<{ [key: string]: ValidationResult }>({
    prefeito: { isValid: true, message: null },
    vicePrefeito: { isValid: true, message: null },
    secretarios: { isValid: true, message: null },
    vereadores: { isValid: true, message: null },
    presidenteCamara: { isValid: true, message: null },
  });


  interface FormData {
  atoNormativo: string;
  legislatura: string;
  dataFixacao: string;
  anotacaoPlanilha: boolean;
  numeroLei: string;
  numeroAcordao: string;
  ressalvaLivre: boolean;
  [key: string]: any; // Allow dynamic keys for subsidy values and vicios
}

const [formData, setFormData] = useState<FormData>({
    atoNormativo: '',
    legislatura: '',
    dataFixacao: '',
    anotacaoPlanilha: true,
    numeroLei: '',
    numeroAcordao: '',
    ressalvaLivre: false,
    // Add keys for subsidy values if not already present implicitly
    'valor-0': '', // Prefeito
    'valor-1': '', // Vice-Prefeito
    'valor-2': '', // Secretários
    'valor-3': '', // Vereadores
    'valor-4': '', // Presidente da Câmara
  });

  const [selectedVicio, setSelectedVicio] = useState<number | null>(0);

  // Define the subsidies structure for the table
  const subsidiosConfig: SubsidioItem[] = [
    { cargo: "Prefeito", valorKey: "valor-0", validationKey: "prefeito" },
    { cargo: "Vice-Prefeito", valorKey: "valor-1", validationKey: "vicePrefeito" },
    { cargo: "Secretários", valorKey: "valor-2", validationKey: "secretarios" },
    { cargo: "Vereadores", valorKey: "valor-3", validationKey: "vereadores" },
    { cargo: "Presidente da Câmara", valorKey: "valor-4", validationKey: "presidenteCamara" },
  ];

  // Helper function to parse currency (ensure it exists)
  const parseCurrency = (value: string): number => {
      if (!value) return 0;
      const numericString = value.replace(/[^\d,]/g, '').replace(',', '.'); // Allow only digits and comma
      return parseFloat(numericString) || 0;
  };


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // TODO: Implement handleClearScreen if needed
  const handleClearScreen = () => {
     console.log("Clear screen action triggered");
     // Reset formData, selectedVicio etc.
     setFormData({
       atoNormativo: '',
       legislatura: '',
       dataFixacao: '',
       anotacaoPlanilha: true,
       numeroLei: '',
       numeroAcordao: '',
       ressalvaLivre: false,
     });
     setSelectedVicio(0); // Reset to default or null
      // Add toast notification if desired
  };

  // Fetch Firebase data based on legislatura
  useEffect(() => {
    const fetchData = async () => {
      if (!formData.legislatura) {
        // Reset fetched data if legislatura is cleared
        setSubsidioDeputadoEstadual(null);
        setSubsidioMinistroSTF(null);
        setPercentuaisSalarioDep([]);
        return;
      }

      try {
        // Fetch Deputados Estaduais
        const depQuery = query(
          collection(db, "SubsidiosDeputadosEstaduais"),
          where("AnoLegislatura", "==", formData.legislatura),
          limit(1) // Assuming only one entry per legislatura
        );
        const depSnapshot = await getDocs(depQuery);
        if (!depSnapshot.empty) {
          setSubsidioDeputadoEstadual(depSnapshot.docs[0].data() as SubsidioFirebase);
        } else {
          setSubsidioDeputadoEstadual(null); // Not found
        }

        // Fetch Ministros STF
        const stfQuery = query(
          collection(db, "SubsidiosMinistrosSTF"),
          where("AnoLegislatura", "==", formData.legislatura),
          limit(1) // Assuming only one entry per legislatura
        );
        const stfSnapshot = await getDocs(stfQuery);
        if (!stfSnapshot.empty) {
          setSubsidioMinistroSTF(stfSnapshot.docs[0].data() as SubsidioFirebase);
        } else {
          setSubsidioMinistroSTF(null); // Not found
        }

        // Fetch Percentuais Salario Dep (consider filtering by legislatura if applicable)
        // If AnoLegislatura in PercentualSalarioDep should match formData.legislatura, add a where clause
        const percQuery = query(collection(db, "PercentualSalarioDep"));
        // const percQuery = query(collection(db, "PercentualSalarioDep"), where("AnoLegislatura", "==", formData.legislatura));
        const percSnapshot = await getDocs(percQuery);
        const percentuais = percSnapshot.docs.map(doc => doc.data() as PercentualFirebase);
        setPercentuaisSalarioDep(percentuais);

      } catch (error) {
        console.error("Erro ao buscar dados do Firebase:", error);
        // Handle error appropriately (e.g., show toast)
        setSubsidioDeputadoEstadual(null);
        setSubsidioMinistroSTF(null);
        setPercentuaisSalarioDep([]);
      }
    };

    fetchData();
  }, [formData.legislatura]); // Re-fetch when legislatura changes


  // --- Validation Logic ---
  const validationCalculations = useMemo(() => {
    const results: { [key: string]: ValidationResult } = {
      prefeito: { isValid: true, message: null },
      vicePrefeito: { isValid: true, message: null },
      secretarios: { isValid: true, message: null },
      vereadores: { isValid: true, message: null },
      presidenteCamara: { isValid: true, message: null },
    };

    const prefeitoValor = parseCurrency(formData['valor-0']);
    const vicePrefeitoValor = parseCurrency(formData['valor-1']);
    const secretariosValor = parseCurrency(formData['valor-2']);
    const vereadoresValor = parseCurrency(formData['valor-3']);
    const presidenteCamaraValor = parseCurrency(formData['valor-4']);

    // --- Prefeito Validation (Rule 2) ---
    if (prefeitoValor > 0 && subsidioMinistroSTF) {
      if (prefeitoValor >= subsidioMinistroSTF.Valor) {
        results.prefeito = { isValid: false, message: `Subsídio do Prefeito (R$ ${prefeitoValor.toFixed(2)}) deve ser menor que o do Ministro STF (R$ ${subsidioMinistroSTF.Valor.toFixed(2)}).` };
      }
    } else if (prefeitoValor > 0 && !subsidioMinistroSTF) {
       results.prefeito = { isValid: false, message: `Dados do subsídio STF para a legislatura ${formData.legislatura} não encontrados.` };
    }

    // --- Vice-Prefeito Validation (Rule 3) ---
    if (vicePrefeitoValor > 0 && prefeitoValor > 0) {
      if (vicePrefeitoValor >= prefeitoValor) {
        results.vicePrefeito = { isValid: false, message: `Subsídio do Vice-Prefeito (R$ ${vicePrefeitoValor.toFixed(2)}) deve ser menor que o do Prefeito (R$ ${prefeitoValor.toFixed(2)}).` };
      }
    }

    // --- Secretários Validation (Rule 4) ---
    if (secretariosValor > 0 && prefeitoValor > 0) {
      if (secretariosValor >= prefeitoValor) {
        results.secretarios = { isValid: false, message: `Subsídio dos Secretários (R$ ${secretariosValor.toFixed(2)}) deve ser menor que o do Prefeito (R$ ${prefeitoValor.toFixed(2)}).` };
      }
    }

    // --- Vereadores/Presidente Validation (Rule 1) ---
    if (subsidioDeputadoEstadual && percentuaisSalarioDep.length > 0 && prefeitoValor > 0) {
      // Find the correct percentage based on numeroHabitantes
      const applicablePercentual = percentuaisSalarioDep
        .sort((a, b) => a.RangeStart - b.RangeStart) // Ensure sorted ranges
        .find(p => numeroHabitantes >= p.RangeStart && (p.RangeEnd === null || numeroHabitantes <= p.RangeEnd));

      if (applicablePercentual) {
        const percentualDecimal = applicablePercentual.PercentageValue / 100;
        const tetoVereador = subsidioDeputadoEstadual.Valor * percentualDecimal;

        // Vereador Check
        if (vereadoresValor > 0) {
          if (vereadoresValor >= tetoVereador) {
             results.vereadores = { isValid: false, message: `Subsídio (R$ ${vereadoresValor.toFixed(2)}) excede o teto de ${applicablePercentual.PercentageValue}% do Dep. Estadual (Teto: R$ ${tetoVereador.toFixed(2)}).` };
          } else if (tetoVereador >= prefeitoValor) {
             results.vereadores = { isValid: false, message: `Teto calculado (R$ ${tetoVereador.toFixed(2)}) é maior ou igual ao subsídio do Prefeito (R$ ${prefeitoValor.toFixed(2)}).` };
          }
        }

        // Presidente Câmara Check (same logic, different input value)
        if (presidenteCamaraValor > 0) {
           if (presidenteCamaraValor >= tetoVereador) {
             results.presidenteCamara = { isValid: false, message: `Subsídio (R$ ${presidenteCamaraValor.toFixed(2)}) excede o teto de ${applicablePercentual.PercentageValue}% do Dep. Estadual (Teto: R$ ${tetoVereador.toFixed(2)}).` };
           } else if (tetoVereador >= prefeitoValor) {
             results.presidenteCamara = { isValid: false, message: `Teto calculado (R$ ${tetoVereador.toFixed(2)}) é maior ou igual ao subsídio do Prefeito (R$ ${prefeitoValor.toFixed(2)}).` };
           }
        }

      } else {
        const message = `Faixa percentual para ${numeroHabitantes} habitantes não encontrada.`;
        if (vereadoresValor > 0) results.vereadores = { isValid: false, message };
        if (presidenteCamaraValor > 0) results.presidenteCamara = { isValid: false, message };
      }
    } else if ((vereadoresValor > 0 || presidenteCamaraValor > 0) && (!subsidioDeputadoEstadual || percentuaisSalarioDep.length === 0)) {
        const message = `Dados de Dep. Estadual ou Percentuais para a legislatura ${formData.legislatura} não encontrados.`;
        if (vereadoresValor > 0) results.vereadores = { isValid: false, message };
        if (presidenteCamaraValor > 0) results.presidenteCamara = { isValid: false, message };
    }

    return results;
  }, [formData, subsidioDeputadoEstadual, subsidioMinistroSTF, percentuaisSalarioDep, numeroHabitantes]);

  // Update validationResults state when calculations change
  useEffect(() => {
    setValidationResults(validationCalculations);
  }, [validationCalculations]);


  // Removed static subsidios array

  const vicios = [
    "1 - Ausência de Documentação Essencial",
    "2 -A fixação dos subsídios do Prefeito, do Vice-Prefeito, dos Secretários e dos Vereadores, NÃO deu-se mediante lei de iniciativa da Câmara.",
    "3 - NÃO houve declaração do Prefeito no ato de sanção",
    "4 - A fixação do subsídio dos vereadores ocorreu por meio de outra norma.",
    "5 -A Lei que fixou os subsídios dos vereadores NÃO deu-se mediante iniciativa da Câmara.",
    "6 -Subsídio fixado excede ao teto regulamentar.",
    "7 - Houve Desobediência ao Princípio da Anterioridade.",
    "8 -houve alteração de norma para retirar a exigência da anterioridade",
    "9 -Existe divergência entres als fixatório e Lei Municipal.",
    "10 -O total da despesa com a remuneração dos vereadores ultrapassa o montante de 5% da receita do município.",
    "11- Houve Desobedencia ao Princípio da Generalidade",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  
  // --- Icon Click Handlers ---
  const handleErase = () => {
    handleClearScreen(); // Reuse the existing clear logic
  };

  const handleBack = () => {
    navigate('/TratamentoLeis');
  };

  const handleNext = () => {
    navigate('/Fixacao');
  };

  return (
    // Added Page Wrapper Structure
    <div className="municipios-theme flex min-h-screen flex-col bg-gray-50">
      <div className="min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="flex justify-between items-center">
            <Header toggleSidebar={toggleSidebar} />
          </div>

          {/* Use the new BreadcrumbNav component */}
          <BreadcrumbNav currentPage="Fixação" sidebarOpen={sidebarOpen} />

          <main className="min-h-screen bg-pattern bg-gray-100 py-8 px-4 ">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md overflow-hidden ">
              <div className="p-6 ">
                <div className="mt-[-20px] flex justify-end">
                      <Icons
                        onEraseClick={handleErase}
                        onBackClick={handleBack}
                        onNextClick={handleNext}
                        // onSaveClick is omitted as it does nothing yet
                      />
                </div>

                <div className="relative mb-8 text-primary text-center">
                  <h1 className="text-2xl font-bold text-center mb-4 mt-[-20px]">Fixação {numeroProcesso && `(${numeroProcesso})`}</h1>
                </div>

                <div className="mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    <Label htmlFor="atoNormativo" className="text-base font-medium w-128">Ato Normativo que concedeu a Fixação dos Subsídios n.:</Label>
                    <Input
                      id="atoNormativo"
                      name="atoNormativo"
                      value={formData.atoNormativo}
                      onChange={handleInputChange}
                      className="w-[100px] md:max-w-xs"
                      placeholder="1.500/00"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    <Label htmlFor="legislatura" className="text-base font-medium w-18">A fixação dos subsídios refere-se a qual legislatura:</Label>
                    <Input
                      id="legislatura"
                      name="legislatura"
                      value={formData.legislatura}
                      onChange={handleInputChange}
                      className="w-[100px] md:max-w-xs"
                      placeholder="2020-2024"
                    />
                  </div>
                </div>

              <div className="mb-8 w-[80%] md:w-full">
                <h2 className="text-xl font-bold mb-4 text-center">Sobre o valor dos subsídios:</h2>
                <table className="w-[70%] border-collapse text-center mx-auto">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="w-64 border p-2 text-center">Agente Político</th>
                      <th className="border p-2 text-center">Valor dos Subsídios</th>
                      <th className="border p-2 text-center">Válido?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subsidiosConfig.map((subsidio) => {
                      const validation = validationResults[subsidio.validationKey] || { isValid: true, message: null };
                      const hasValue = !!formData[subsidio.valorKey]; // Check if input has a value

                      return (
                        <tr key={subsidio.validationKey}>
                          <td className="border p-2 text-left">{subsidio.cargo}</td>
                          <td className="border-b p-2 flex text-center justify-center">
                            <Input
                              type="text"
                              name={subsidio.valorKey}
                              value={formData[subsidio.valorKey] || ''}
                              onChange={(e) =>
                                setFormData({ ...formData, [subsidio.valorKey]: e.target.value })
                              }
                              className="w-32"
                              placeholder="R$ 0,00"
                            />
                          </td>
                          <td className="border p-2 w-22">
                            {/* Only show icon if there's a value */}
                            {hasValue && (
                              <div className='flex justify-center items-center gap-1'>
                                <VerificationIcon isValid={validation.isValid} />
                                {!validation.isValid && validation.message && (
                                  <TooltipProvider delayDuration={100}>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Info size={16} className="text-red-600 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-black text-white">
                                        <p>{validation.message}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center">
                <span className="text-base font-medium">Data da Fixação:</span>
                <div className="relative max-w-xs">
                  <Input 
                    name="dataFixacao" 
                    value={formData.dataFixacao} 
                    onChange={handleInputChange} 
                    className="pl-10" 
                    placeholder="24/04/2000" 
                  />
                  <Calendar className="absolute left-3 top-2.5 text-gray-500 h-5 w-5" />
                </div>
              </div>

              <div className="mb-6 flex items-center gap-2 border p-4 rounded bg-blue-50">
                <Checkbox 
                  id="anotacao" 
                  checked={formData.anotacaoPlanilha} 
                  onCheckedChange={(checked) => handleCheckboxChange('anotacaoPlanilha', !!checked)} 
                />
                <label htmlFor="anotacao" className="text-blue-800 font-medium">Anotação na planilha de controle de gastos</label>
              </div>

              <div className="mb-8 p-4 border rounded-md bg-gray-50 text-sm">
                <p className="mb-2">Trata-se de procedimento de anotação, para fins de controle de gastos, da Lei nº 
                  <Input 
                    name="numeroLei" 
                    value={formData.numeroLei} 
                    onChange={handleInputChange} 
                    className="inline-block w-24 mx-1" 
                    placeholder="000/000" 
                  /> que que fixou os subsídios dos agentes políticos de MUNICÍPIO para a legislatura <span className="bg-white border px-2 py-0.5 rounded">2020-2024</span> do Setor de Recursos, com a informação de que os dados da planilha de subsídios 
                  <span className="bg-white border px-2 py-0.5 rounded mx-1">2020-2023</span> foram atualizados em consonância com o disposto no Acórdão nº
                  <Input 
                    name="numeroAcordao" 
                    value={formData.numeroAcordao} 
                    onChange={handleInputChange} 
                    className="inline-block w-24 mx-1" 
                    placeholder="000/000" 
                  />.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4">Vícios ou Ressalvas da Fixação de Subsídios:</h2>

                <div className="space-y-2">
                  {vicios.map((vicio, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`vicio-${index}`}
                        checked={formData[`vicio-${index}`] || false} // Use unique name for state
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, [`vicio-${index}`]: !!checked })
                        }
                      />
                      <Label htmlFor={`vicio-${index}`} className="text-base font-normal">{vicio}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8 flex items-center gap-2">
                <Checkbox 
                  id="ressalvaLivre" 
                  checked={formData.ressalvaLivre} 
                  onCheckedChange={(checked) => handleCheckboxChange('ressalvaLivre', !!checked)} 
                />
                <label htmlFor="ressalvaLivre" className="font-medium">Inserir Ressalva Livre</label>
              </div>

              {formData.ressalvaLivre && (
                <div className="mb-8">
                  <h3 className="font-medium mb-2">Ressalva</h3>
                  <Textarea className="w-full h-32" />
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Conferência do Texto de Fixação de Subsídios</h2>
                <div className="border rounded-md w-full h-64"></div>
              </div>
            </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Fixacao; // Renamed export
