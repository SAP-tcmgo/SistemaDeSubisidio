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
  minimo: number; // Corresponds to minimo
  maximo: number | null; // Corresponds to RangeEnd (Firestore might store 0 or null for open end)
  porcentagemValor: number; // Corresponds to PercentageValue
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


const formatCurrency = (value: string): string => {
  if (!value) return "";

  // 1. Obter apenas os dígitos do valor inserido
  let digits = value.replace(/\D/g, "");

  // Se não houver dígitos, retorna string vazia
  if (digits === "") return "";

  // Opcional: Remover zeros à esquerda, exceto se for o único dígito
  // Ex: "050" -> "50", "007" -> "7", mas "0" -> "0"
  if (digits.length > 1 && digits.startsWith('0')) {
     digits = digits.replace(/^0+/, "");
     // Se após remover zeros ficar vazio (ex: input "000"), considera como "0"
     if (digits === "") digits = "0";
  }


  // 2. Converter a string de dígitos para número, tratando os 2 últimos como centavos
  // Ex: "5555" -> 55.55; "555" -> 5.55; "55" -> 0.55
  const numValue = Number(digits) / 100;

  // 3. Usar Intl.NumberFormat para formatação pt-BR confiável
  let formatted = new Intl.NumberFormat('pt-BR', {
    style: 'decimal', // 'decimal' para evitar o símbolo 'R$' no input
    minimumFractionDigits: 2, // Sempre mostrar 2 casas decimais
    maximumFractionDigits: 2, // Nunca mostrar mais de 2 casas decimais
  }).format(numValue);

  return formatted;
};

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
  anotacaoPlanilha: boolean;
  numeroLei: string;
  numeroAcordao: string;
  ressalvaLivre: boolean;
  [key: string]: any; // Add index signature to allow dynamic keys like valor-0, vicio-1 etc.
}

const [formData, setFormData] = useState<FormData>({
    atoNormativo: '',
    legislatura: '',
    anotacaoPlanilha: false,
    numeroLei: '',
    numeroAcordao: '',
    ressalvaLivre: false,
    // Explicitly define subsidy value keys if needed, or handle dynamically
    'valor-0': '', // Prefeito - Assuming handled by subsidiosConfig logic
    'valor-1': '', // Vice-Prefeito
    'valor-2': '', // Secretários
    'valor-3': '', // Vereadores
    'valor-4': '', // Presidente da Câmara
  });


  // Define the subsidies structure for the table
  const subsidiosConfig: SubsidioItem[] = [
    { cargo: "Prefeito", valorKey: "valor-0", validationKey: "prefeito" },
    { cargo: "Vice-Prefeito", valorKey: "valor-1", validationKey: "vicePrefeito" },
    { cargo: "Secretários", valorKey: "valor-2", validationKey: "secretarios" },
    { cargo: "Vereadores", valorKey: "valor-3", validationKey: "vereadores" },
    { cargo: "Presidente da Câmara", valorKey: "valor-4", validationKey: "presidenteCamara" },
  ];

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


  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // TODO: Implement handleClearScreen if needed
  const handleClearScreen = () => {
     console.log("Clear screen action triggered");
     setFormData({
       atoNormativo: '',
       legislatura: '',
       anotacaoPlanilha: true,
       numeroLei: '',
       numeroAcordao: '',
       ressalvaLivre: false,
       'valor-0': '',
       'valor-1': '',
       'valor-2': '',
       'valor-3': '',
       'valor-4': '',
     });
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
        const legislaturaValue = formData.legislatura.trim();

        // Fetch Deputados Estaduais
        const depQuery = query(
          collection(db, "SubsidiosDeputadosEstaduais"),
          where("AnoLegislatura", "==", legislaturaValue),
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
          where("AnoLegislatura", "==", legislaturaValue),
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
        const percQuery = query(
          collection(db, "PercentualSalarioDep"),
          where("AnoLegislatura", "==", legislaturaValue)
        );
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

  const validationCalculations = useMemo(() => {
    const results: { [key: string]: ValidationResult } = {
      prefeito: { isValid: true, message: null },
      vicePrefeito: { isValid: true, message: null },
      secretarios: { isValid: true, message: null },
      vereadores: { isValid: true, message: null },
      presidenteCamara: { isValid: true, message: null },
    };

    const prefeitoValor = parseCurrency(formData['valor-0'] || "0");
    const vicePrefeitoValor = parseCurrency(formData['valor-1'] || "0");
    const secretariosValor = parseCurrency(formData['valor-2'] || "0");
    const vereadoresValor = parseCurrency(formData['valor-3'] || "0");
    const presidenteCamaraValor = parseCurrency(formData['valor-4'] || "0");

    if (subsidioDeputadoEstadual && percentuaisSalarioDep.length > 0) {
      const applicablePercentual = percentuaisSalarioDep
        .sort((a, b) => Math.min(a.minimo, a.maximo ?? Infinity) - Math.min(b.minimo, b.maximo ?? Infinity))
        .find(p => {
            const lowerBound = Math.min(p.minimo, p.maximo ?? Infinity);
            const upperBound = p.maximo === null || p.maximo === 0 ? Infinity : Math.max(p.minimo, p.maximo);
            return numeroHabitantes >= lowerBound && numeroHabitantes <= upperBound;
        });

      if (applicablePercentual) {
        const percentualDecimal = applicablePercentual.porcentagemValor / 100;
        const tetoVereador = subsidioDeputadoEstadual.Valor * percentualDecimal;
          if (formData['valor-3'] !== '') { // Check if input is not empty, allowing 0
            if (Number(vereadoresValor) >= tetoVereador) {
               results.vereadores = { isValid: false, message: `Subsídio (R$ ${vereadoresValor.toFixed(2)}) excede o teto de ${applicablePercentual.porcentagemValor}% do Dep. Estadual (Teto: R$ ${tetoVereador.toFixed(2)}).` };
            } else if (tetoVereador >= Number(prefeitoValor)) { // This check now runs even if prefeitoValor is 0
               results.vereadores = { isValid: false, message: `Teto calculado (R$ ${tetoVereador.toFixed(2)}) é maior ou igual ao subsídio do Prefeito (R$ ${prefeitoValor.toFixed(2)}).` };
            }
          }
          if (formData['valor-4'] !== '') { // Check if input is not empty, allowing 0
             if (Number(presidenteCamaraValor) >= tetoVereador) {
               results.presidenteCamara = { isValid: false, message: `Subsídio (R$ ${presidenteCamaraValor.toFixed(2)}) excede o teto de ${applicablePercentual.porcentagemValor}% do Dep. Estadual (Teto: R$ ${tetoVereador.toFixed(2)}).` };
             } else if (tetoVereador >= Number(prefeitoValor)) { // This check now runs even if prefeitoValor is 0
               results.presidenteCamara = { isValid: false, message: `Teto calculado (R$ ${tetoVereador.toFixed(2)}) é maior ou igual ao subsídio do Prefeito (R$ ${prefeitoValor.toFixed(2)}).` };
            }
          }

      } else {
        const message = `Faixa percentual para ${numeroHabitantes} habitantes não encontrada.`;
        if (Number(vereadoresValor) > 0) results.vereadores = { isValid: false, message };
        if (Number(presidenteCamaraValor) > 0) results.presidenteCamara = { isValid: false, message };
      }
    } else if ((Number(vereadoresValor) > 0 || Number(presidenteCamaraValor) > 0) && (!subsidioDeputadoEstadual || percentuaisSalarioDep.length === 0)) {
        const message = `Dados de Dep. Estadual ou Percentuais para a legislatura ${formData.legislatura} não encontrados.`;
        if (Number(vereadoresValor) > 0) results.vereadores = { isValid: false, message };
        if (Number(presidenteCamaraValor) > 0) results.presidenteCamara = { isValid: false, message };
    }

    if (Number(prefeitoValor) > 0 && subsidioMinistroSTF) {
      if (Number(prefeitoValor) >= subsidioMinistroSTF.Valor) {
        results.prefeito = { isValid: false, message: `Subsídio do Prefeito (R$ ${prefeitoValor.toFixed(2)}) deve ser menor que o do Ministro STF (R$ ${subsidioMinistroSTF.Valor.toFixed(2)}).` };
      }
    } else if (Number(prefeitoValor) > 0 && !subsidioMinistroSTF) {
       results.prefeito = { isValid: false, message: `Dados do subsídio STF para a legislatura ${formData.legislatura} não encontrados.` };
    }
    if (formData['valor-1'] !== '') { // Check if input is not empty, allowing 0
      if (Number(vicePrefeitoValor) >= Number(prefeitoValor)) {
        results.vicePrefeito = { isValid: false, message: `Subsídio do Vice-Prefeito (R$ ${vicePrefeitoValor.toFixed(2)}) deve ser menor que o do Prefeito (R$ ${prefeitoValor.toFixed(2)}).` };
      }
    }
    if (formData['valor-2'] !== '') { // Check if input is not empty, allowing 0
      if (Number(secretariosValor) >= Number(prefeitoValor)) {
        results.secretarios = { isValid: false, message: `Subsídio dos Secretários (R$ ${secretariosValor.toFixed(2)}) deve ser menor que o do Prefeito (R$ ${prefeitoValor.toFixed(2)}).` };
      }
    }


    return results;
  }, [formData, subsidioDeputadoEstadual, subsidioMinistroSTF, percentuaisSalarioDep, numeroHabitantes]);

  // Update validationResults state when calculations change
  useEffect(() => {
    setValidationResults(validationCalculations);
  }, [validationCalculations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('valor-')) {
      const numericValue = value.replace(/[^\d,]/g, ''); // Allow only digits and comma
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // --- Icon Click Handlers ---
  const handleErase = () => {
    handleClearScreen(); // Reuse the existing clear logic
  };

  const handleBack = () => {
    navigate('/TelaInicial');
  };

  const handleNext = () => {
    //navigate('/Fixacao');
  };

  return (
    // Added Page Wrapper Structure
    <div className="analise-theme flex min-h-screen flex-col bg-gray-50">
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
                  <h1 className="text-2xl font-bold text-center mb-4 mt-[-20px]">Pós Acordão {numeroProcesso && `(${numeroProcesso})`}</h1>
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
                      placeholder="x.xxx/xx"
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
                      placeholder="xxxx/xxxx"
                    />
                  </div>
                </div>

              <div className="mb-8 w-[80%] md:w-full">
                <h2 className="text-xl font-bold mb-4 text-center">Editar o valor dos subsídios:</h2>
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
                              onChange={(e) => {
                                const rawValue = formatCurrency(e.target.value);
                                setFormData({ ...formData, [subsidio.valorKey]: rawValue });
                              }}
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
                <span className="text-base font-medium">Número do Acórdão:</span>
                <div className="relative max-w-xs">
                  <Input
                    type="string" // Change type to date
                    name="NumeroAcordao"
                    className="w-[100px] md:max-w-xs"
                    value={formData.NumeroAcordao}
                    onChange={handleInputChange}
                    placeholder="xxxx/xx" // Placeholder might not show for date type
                  />
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

              {/* Conditional rendering for the annotation text block */}
              {formData.anotacaoPlanilha && (
                <div className="mb-8">
                  <div className="bg-gray-100 p-4 rounded text-sm">
                    <p>Trata-se de procedimento de anotação, para fins de controle de gastos, da Lei nº 
                      <span className="bg-white px-2 py-0.5 rounded mx-1">1.500/00</span> que fixou os subsídios dos agentes políticos de 
                      <span className="bg-yellow-100 px-2 py-0.5 rounded mx-1">MUNICÍPIO</span> para a legislatura 
                      <span className="bg-white px-2 py-0.5 rounded mx-1">2020-2024</span>.
                    </p>
                  </div>
                </div>
              )} 

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox 
                    id="ressalvaLivre" 
                    checked={formData.ressalvaLivre} 
                    onCheckedChange={(checked) => handleCheckboxChange('ressalvaLivre', !!checked)} 
                  />
                  <label htmlFor="ressalvaLivre" className="font-medium">Inserir Ressalva Livre</label>
                </div>
              </div>
              {formData.ressalvaLivre && (
                <div className="mb-8">
                  <h3 className="font-medium mb-2">Ressalva</h3>
                  <Textarea className="w-full h-32" />
                </div>
              )}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Conferência do Texto da Anotação de Subsídios</h2>
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