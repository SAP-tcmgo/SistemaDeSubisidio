import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Added useEffect, useMemo, useCallback
import { Calendar, Info, PlusCircle } from 'lucide-react'; // Added Info icon for messages, PlusCircle for dialog trigger
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { Button } from '@/components/ui/button'; // Added Button
import BreadcrumbNav from '../../components/BreadcrumbNav'; // Added BreadcrumbNav
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Added Table components
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"; // Added Dialog components
import { ScrollArea } from '@/components/ui/scroll-area'; // Added ScrollArea for dialog
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // Added Switch
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import Icons from '../../components/Icons';
import { useDados } from '../../Contexts/DadosContext'; // Added useDados
import '../../styles/AppAnalise.css'; // Added styles
import '../../styles/indexAnalise.css';
import VerificationIcon from '../../components/VerificationIcon';
import { db } from '../../firebase'; // Import db
import { collection, query, where, getDocs, limit, Timestamp } from 'firebase/firestore'; // Import Firestore functions, Timestamp
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

// Interface for LeisGenericas from Firebase (based on provided structure)
interface LeiGenerica {
  id: string; // Firebase document ID
  ID_Migracao?: string; // Original SharePoint ID if migrated
  ID?: string;
  ID_Espelho?: string;
  ID_Municipio: string; // Used for filtering
  Municipio?: string;
  Num_Lei?: number;
  Ano_Lei?: number;
  Mes_Data_Base?: string;
  Indice_Correcao?: string;
  Num_Processo?: number;
  Ano_Processo?: number;
  Data_Inicial?: string; // ISO string or Firestore Timestamp
  Data_Final?: string; // ISO string or Firestore Timestamp
  Anotacao?: string;
  Situacao?: string;
  Conclusao?: string;
  Historico_Atualizacao?: string;
  Criado_por?: string;
  Modificado?: Timestamp; // Firestore Timestamp
  Modificado_por?: string;
  // Fields potentially needed for Fixacao/Revisao tables (might be in same collection or different)
  Legislatura?: string;
  Cargo?: string;
  Subsidio?: number; // Assuming number for value
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
} // <-- Added missing closing brace

// Helper to format Firestore Timestamp or date string
const formatDate = (dateInput: string | Timestamp | undefined | null): string => {
  if (!dateInput) return '-';
  let date: Date | null = null;
  if (dateInput instanceof Timestamp) {
    date = dateInput.toDate();
  } else if (typeof dateInput === 'string') {
    try {
      date = new Date(dateInput);
      // Check if the date is valid after parsing
      if (isNaN(date.getTime())) {
        // If invalid, try parsing as DD/MM/YYYY (common manual input format)
        const parts = dateInput.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          const year = parseInt(parts[2], 10);
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            date = new Date(Date.UTC(year, month, day)); // Use UTC
            if (isNaN(date.getTime())) date = null; // Still invalid
          } else {
             date = null;
          }
        } else {
           date = null;
        }
      }
    } catch (e) {
      console.error("Error parsing date string:", dateInput, e);
      date = null;
    }
  }

  if (date && !isNaN(date.getTime())) {
    // Use UTC methods to avoid timezone shifts affecting the date part
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }
  return '-'; // Return placeholder if date is invalid or null
};


const formatCurrency = (value: string | number | undefined | null): string => {
  if (value === null || value === undefined || value === "") return "";

  let valueStr = String(value);

  // 1. Obter apenas os dígitos do valor inserido
  let digits = valueStr.replace(/\D/g, "");

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
  const { numeroProcesso, numeroHabitantes, municipio } = useDados(); // Get numeroHabitantes AND municipio
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for table visibility checkboxes
  const [showLeisInflacionarias, setShowLeisInflacionarias] = useState<boolean>(true); // Default to true
  const [showLeisFixacao, setShowLeisFixacao] = useState<boolean>(false);
  const [showLeisRevisao, setShowLeisRevisao] = useState<boolean>(false);

  // State for fetched laws (Política Inflacionária)
  const [leisInflacionarias, setLeisInflacionarias] = useState<LeiGenerica[]>([]);
  const [loadingLeis, setLoadingLeis] = useState<boolean>(false);
  const [leisError, setLeisError] = useState<string | null>(null);

  // State for the law details dialog
  const [isLawDetailOpen, setIsLawDetailOpen] = useState<boolean>(false);
  const [selectedLawDetail, setSelectedLawDetail] = useState<LeiGenerica | null>(null);

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
  atoNormativoNumero: string; // Changed from atoNormativo
  atoNormativoAno: string; // Added for year
  legislatura: string;
  dataFixacao: string;
  anotacaoPlanilha: boolean;
  numeroLei: string;
  numeroAcordao: string;
  ressalvaLivre: boolean;
  viciosChecks: { [key: string]: boolean }; // State for vicio checkboxes
  viciosDetails: { // State for vicio inputs and switches
    [key: string]: {
      inputValue?: string;
      ressalvaAV?: boolean;
    }
  };
  [key: string]: any; // Add index signature to allow dynamic keys like valor-0, vicio-1 etc.
}

const [formData, setFormData] = useState<FormData>({
    atoNormativoNumero: '', // Changed from atoNormativo
    atoNormativoAno: '', // Added for year
    legislatura: '',
    dataFixacao: '',
    anotacaoPlanilha: false, // Keep default as false unless specified otherwise
    numeroLei: '',
    numeroAcordao: '',
    ressalvaLivre: false,
    viciosChecks: {}, // Initialize vicios state
    viciosDetails: {}, // Initialize vicios state
    // Explicitly define subsidy value keys if needed, or handle dynamically
    'valor-0': '', // Prefeito - Assuming handled by subsidiosConfig logic
    'valor-1': '', // Vice-Prefeito
    'valor-2': '', // Secretários
    'valor-3': '', // Vereadores
    'valor-4': '', // Presidente da Câmara
  });

  // const [selectedVicio, setSelectedVicio] = useState<number | null>(0); // Removed if not used

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
     setFormData({
       atoNormativoNumero: '', // Changed from atoNormativo
       atoNormativoAno: '', // Added for year
       legislatura: '',
       dataFixacao: '',
       anotacaoPlanilha: false, // Reset to default
       numeroLei: '',
       numeroAcordao: '',
       ressalvaLivre: false,
       viciosChecks: {},
       viciosDetails: {},
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


  // --- Validation Logic ---
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

    // --- Vereadores/Presidente Validation (Rule 1) ---
    // Check if deputy subsidy and percentages are available. Mayor's value check removed from here.
    if (subsidioDeputadoEstadual && percentuaisSalarioDep.length > 0) {
      // Find the correct percentage based on numeroHabitantes, handling potentially swapped min/max
      const applicablePercentual = percentuaisSalarioDep
        // Sort by the *smaller* of the two boundary values to handle potential swaps
        .sort((a, b) => Math.min(a.minimo, a.maximo ?? Infinity) - Math.min(b.minimo, b.maximo ?? Infinity))
        .find(p => {
            // Determine the actual lower and upper bounds, ignoring which field they are in
            const lowerBound = Math.min(p.minimo, p.maximo ?? Infinity);
            // Use Infinity for null/0 maximo to represent an open upper bound
            const upperBound = p.maximo === null || p.maximo === 0 ? Infinity : Math.max(p.minimo, p.maximo);
            // Check if numeroHabitantes falls within the actual bounds
            return numeroHabitantes >= lowerBound && numeroHabitantes <= upperBound;
        });

      if (applicablePercentual) {
        const percentualDecimal = applicablePercentual.porcentagemValor / 100;
        const tetoVereador = subsidioDeputadoEstadual.Valor * percentualDecimal;

        // Vereador Check
          // Vereador Check - Perform checks if vereadoresValor has a value (even if 0, compare against teto)
          // The check against prefeitoValor is now independent of whether prefeitoValor is > 0
          if (formData['valor-3'] !== '') { // Check if input is not empty, allowing 0
            if (Number(vereadoresValor) >= tetoVereador) {
               results.vereadores = { isValid: false, message: `Subsídio (R$ ${vereadoresValor.toFixed(2)}) excede o teto de ${applicablePercentual.porcentagemValor}% do Dep. Estadual (Teto: R$ ${tetoVereador.toFixed(2)}).` };
            } else if (tetoVereador >= Number(prefeitoValor)) { // This check now runs even if prefeitoValor is 0
               results.vereadores = { isValid: false, message: `Teto calculado (R$ ${tetoVereador.toFixed(2)}) é maior ou igual ao subsídio do Prefeito (R$ ${prefeitoValor.toFixed(2)}).` };
            }
          }

          // Presidente Câmara Check - Perform checks if presidenteCamaraValor has a value
          // The check against prefeitoValor is now independent of whether prefeitoValor is > 0
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


    // --- Prefeito Validation (Rule 2) ---
    if (Number(prefeitoValor) > 0 && subsidioMinistroSTF) {
      if (Number(prefeitoValor) >= subsidioMinistroSTF.Valor) {
        results.prefeito = { isValid: false, message: `Subsídio do Prefeito (R$ ${prefeitoValor.toFixed(2)}) deve ser menor que o do Ministro STF (R$ ${subsidioMinistroSTF.Valor.toFixed(2)}).` };
      }
    } else if (Number(prefeitoValor) > 0 && !subsidioMinistroSTF) {
       results.prefeito = { isValid: false, message: `Dados do subsídio STF para a legislatura ${formData.legislatura} não encontrados.` };
    }

    // --- Vice-Prefeito Validation (Rule 3) ---
    // Check if vicePrefeitoValor has a value. Compare against prefeitoValor even if prefeitoValor is 0.
    if (formData['valor-1'] !== '') { // Check if input is not empty, allowing 0
      if (Number(vicePrefeitoValor) >= Number(prefeitoValor)) {
        results.vicePrefeito = { isValid: false, message: `Subsídio do Vice-Prefeito (R$ ${vicePrefeitoValor.toFixed(2)}) deve ser menor que o do Prefeito (R$ ${prefeitoValor.toFixed(2)}).` };
      }
    }

    // --- Secretários Validation (Rule 4) ---
    // Check if secretariosValor has a value. Compare against prefeitoValor even if prefeitoValor is 0.
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


  // Removed static subsidios array

  const vicios = [
    "1 - Ausência de Documentação Essencial",
    "2 - A fixação dos subsídios do Prefeito, do Vice-Prefeito, dos Secretários e dos Vereadores, NÃO deu-se mediante lei de iniciativa da Câmara.",
    "3 - NÃO houve declaração do Prefeito no ato de sanção",
    "4 - A fixação do subsídio dos vereadores ocorreu por meio de outra norma.",
    "5 - A Lei que fixou os subsídios dos vereadores ocorreu por meio de outra norma.",
    "6 - Subsídio fixado excede ao teto regulamentar.",
    "7 - Houve Desobediência ao Princípio da Anterioridade.",
    "8 - Houve alteração de norma para retirar a exigência da anterioridade",
    "9 - Existe divergência entres als fixatório e Lei Municipal.",
    "10 - O total da despesa com a remuneração dos vereadores ultrapassa o montante de 5% da receita do município.",
    "11 - Houve Desobedencia ao Princípio da Generalidade",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name.startsWith('valor-')) {
      const formattedValue = formatCurrency(value);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
    } else if (name === 'atoNormativoNumero' || name === 'atoNormativoAno') {
      // Allow only digits and limit length to 4
      const digits = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: digits.slice(0, 4) }));
    } else if (name === 'legislatura') {
      // Apply xxxx-xxxx mask
      const digits = value.replace(/\D/g, '');
      let maskedValue = digits;
      if (digits.length > 4) {
        maskedValue = `${digits.slice(0, 4)}-${digits.slice(4, 8)}`;
      }
      setFormData(prev => ({ ...prev, [name]: maskedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Fetch Laws (Política Inflacionária) when municipio changes
  const fetchLeisInflacionarias = useCallback(async () => {
    if (!municipio || !municipio.ID_Municipio) {
      setLeisInflacionarias([]); // Clear if no municipio selected
      return;
    }

    setLoadingLeis(true);
    setLeisError(null);
    console.log(`Fetching laws for municipio ID: ${municipio.ID_Municipio}`);

    try {
      const leisCollectionRef = collection(db, 'leis');
      const q = query(leisCollectionRef, where("ID_Municipio", "==", municipio.ID_Municipio));

      const querySnapshot = await getDocs(q);
      const fetchedLeis: LeiGenerica[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<LeiGenerica, 'id'>;
        // Client-side filter: Check if it looks like a "Política Inflacionária" law
        if (data.Indice_Correcao || data.Mes_Data_Base) {
          fetchedLeis.push({ id: doc.id, ...data });
        }
      });

      console.log(`Fetched ${fetchedLeis.length} 'Política Inflacionária' laws.`);
      setLeisInflacionarias(fetchedLeis);

    } catch (error) {
      console.error("Erro ao buscar leis do Firebase:", error);
      const errorMsg = error instanceof Error ? error.message : "Erro desconhecido.";
      setLeisError(`Falha ao buscar leis: ${errorMsg}`);
      setLeisInflacionarias([]);
      // Consider adding a toast notification here
    } finally {
      setLoadingLeis(false);
    }
  }, [municipio]); // Dependency: re-run when municipio changes

  useEffect(() => {
    fetchLeisInflacionarias();
  }, [fetchLeisInflacionarias]); // Fetch on mount and when municipio changes

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // --- Vicios Handlers ---
  const handleVicioCheckboxChange = (index: number, checked: boolean) => {
    const vicioKey = `vicio-${index}`;
    setFormData(prev => {
      const newChecks = { ...prev.viciosChecks, [vicioKey]: checked };
      const newDetails = { ...prev.viciosDetails };
      if (checked) {
        // Initialize details if checking, preserve existing if re-checking
        if (!newDetails[vicioKey]) {
          newDetails[vicioKey] = { ressalvaAV: false, inputValue: '' };
        }
      } else {
        // Optionally clear details when unchecking, or keep them
        // delete newDetails[vicioKey]; // Uncomment to clear details on uncheck
      }
      return {
        ...prev,
        viciosChecks: newChecks,
        viciosDetails: newDetails,
      };
    });
  };

  const handleVicioInputChange = (index: number, value: string) => {
    const vicioKey = `vicio-${index}`;
    setFormData(prev => ({
      ...prev,
      viciosDetails: {
        ...prev.viciosDetails,
        [vicioKey]: {
          ...(prev.viciosDetails[vicioKey] || { ressalvaAV: false }), // Ensure object exists
          inputValue: value,
        },
      },
    }));
  };

  const handleVicioSwitchChange = (index: number, checked: boolean) => {
    const vicioKey = `vicio-${index}`;
    setFormData(prev => ({
      ...prev,
      viciosDetails: {
        ...prev.viciosDetails,
        [vicioKey]: {
          ...(prev.viciosDetails[vicioKey] || { inputValue: '' }), // Ensure object exists
          ressalvaAV: checked,
        },
      },
    }));
  };


  // --- Icon Click Handlers ---
  const handleErase = () => {
    handleClearScreen(); // Reuse the existing clear logic
  };

  const handleBack = () => {
    navigate('/TratamentoProcesso');
  };

  const handleNext = () => {
    navigate('/Fixacao');
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

          <main className="min-h-screen bg-pattern bg-gray-100 py-8 px-4">
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
                    {/* Ato Normativo Row */}
                    <div className="flex flex-col md:flex-row gap-4 md:items-center">
                      <Label htmlFor="atoNormativoNumero" className="text-base font-medium whitespace-nowrap">Número do Ato Normativo que concedeu a Fixação dos Subsídios:</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="atoNormativoNumero"
                          name="atoNormativoNumero"
                          value={formData.atoNormativoNumero}
                          onChange={handleInputChange}
                          className="w-20"
                          placeholder="xxxx"
                          maxLength={4}
                        />
                        <Label htmlFor="atoNormativoAno" className="text-base font-medium whitespace-nowrap mr-2 ml-10">Ano:</Label>
                        <Input
                          id="atoNormativoAno"
                          name="atoNormativoAno"
                          value={formData.atoNormativoAno}
                          onChange={handleInputChange}
                          className="w-20"
                          placeholder="xxxx"
                          maxLength={4}
                        />
                      </div>
                    </div>

                    {/* Legislatura Row */}
                    <div className="flex flex-col md:flex-row gap-4 md:items-center">
                      <Label htmlFor="legislatura" className="text-base font-medium whitespace-nowrap">A fixação dos subsídios refere-se a qual legislatura:</Label>
                      <Input
                        id="legislatura"
                        name="legislatura"
                        value={formData.legislatura}
                        onChange={handleInputChange}
                        className="w-28" // Adjusted width for mask
                        placeholder="xxxx-xxxx"
                        maxLength={9} // 4 digits + hyphen + 4 digits
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
                  <span className="text-base font-medium">Data da Fixação:</span>
                  <div className="relative max-w-xs">
                    <Input
                      type="date" // Change type to date
                      name="dataFixacao"
                      value={formData.dataFixacao}
                      onChange={handleInputChange}
                      className="pl-10" // Keep padding for icon if desired, or remove if native date picker icon is sufficient
                      placeholder="DD/MM/AAAA" // Placeholder might not show for date type
                    />
                    <Calendar className="absolute left-3 top-2.5 text-gray-500 h-5 w-5 pointer-events-none" /> {/* Make icon non-interactive */}
                  </div>
                </div>

                {/* --- Law Tables Section --- */}
                <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="visualizarInflacionaria"
                      checked={showLeisInflacionarias}
                      onCheckedChange={(checked) => setShowLeisInflacionarias(checked as boolean)}
                    />
                    <Label htmlFor="visualizarInflacionaria" className="text-sm font-medium text-gray-700">Visualizar Leis de Política Inflacionária</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="visualizarFixacao"
                      checked={showLeisFixacao}
                      onCheckedChange={(checked) => setShowLeisFixacao(checked as boolean)}
                    />
                    <Label htmlFor="visualizarFixacao" className="text-sm font-medium text-gray-700">Visualizar Leis de Fixação</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="visualizarRevisao"
                      checked={showLeisRevisao}
                      onCheckedChange={(checked) => setShowLeisRevisao(checked as boolean)}
                    />
                    <Label htmlFor="visualizarRevisao" className="text-sm font-medium text-gray-700">Visualizar Leis de Revisão Geral Anual</Label>
                  </div>
                </div>

                {/* Table 1: Política Inflacionária */}
                {showLeisInflacionarias && (
                  <div className="mb-8">
                    <h3 className="text-md font-semibold mb-2 text-gray-800">
                      Lista resumida das Leis acerca da política inflacionária do município {municipio?.Municipio || '...'}
                    </h3>
                    {loadingLeis && <p className="text-sm text-gray-500">Carregando leis...</p>}
                    {leisError && <p className="text-sm text-red-500">{leisError}</p>}
                    {!loadingLeis && !leisError && (
                      <Table className="border">
                        <TableHeader>
                          <TableRow className="bg-gray-100">
                            <TableHead className="border px-2 py-1 text-center">Número da Lei</TableHead>
                            <TableHead className="border px-2 py-1 text-center">Índice de Correção</TableHead>
                            <TableHead className="border px-2 py-1 text-center">Mês Data Base</TableHead>
                            <TableHead className="border px-2 py-1 text-center">Data Inicial</TableHead>
                            <TableHead className="border px-2 py-1 text-center">Data Final</TableHead>
                            <TableHead className="border px-2 py-1 text-center">Detalhes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {leisInflacionarias.length > 0 ? (
                            leisInflacionarias.map((lei) => (
                              <TableRow key={lei.id}>
                                <TableCell className="border px-2 py-1 text-center">{lei.Num_Lei || '-'}/{lei.Ano_Lei || '-'}</TableCell>
                                <TableCell className="border px-2 py-1 text-center">{lei.Indice_Correcao || '-'}</TableCell>
                                <TableCell className="border px-2 py-1 text-center">{lei.Mes_Data_Base || '-'}</TableCell>
                                <TableCell className="border px-2 py-1 text-center">{formatDate(lei.Data_Inicial)}</TableCell>
                                <TableCell className="border px-2 py-1 text-center">{formatDate(lei.Data_Final)}</TableCell>
                                <TableCell className="border px-2 py-1 text-center">
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedLawDetail(lei);
                                        setIsLawDetailOpen(true); // Open dialog
                                      }}
                                      className="text-blue-600 hover:text-blue-800"
                                    >
                                      <PlusCircle className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="border px-2 py-1 text-center text-gray-500">
                                Nenhuma lei de política inflacionária encontrada para este município.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}

                {/* Table 2: Fixação */}
                {showLeisFixacao && (
                  <div className="mb-8">
                    <h3 className="text-md font-semibold mb-2 text-gray-800">
                      Lista resumida das Leis de Fixação de Subsídios do município {municipio?.Municipio || '...'}
                    </h3>
                    <Table className="border">
                      <TableHeader>
                        <TableRow className="bg-gray-100">
                          <TableHead className="border px-2 py-1 text-center">Legislatura</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Número da Lei</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Cargo</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Subsídio</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Nº do Processo</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Situação</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Conclusão</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Detalhes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Data will be added later */}
                        <TableRow>
                          <TableCell colSpan={8} className="border px-2 py-1 text-center text-gray-500">
                            Nenhuma lei de fixação encontrada (funcionalidade futura).
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Table 3: Revisão Geral Anual */}
                {showLeisRevisao && (
                  <div className="mb-8">
                    <h3 className="text-md font-semibold mb-2 text-gray-800">
                      Lista resumida das Leis de Revisão Geral Anual de Subsídios do município {municipio?.Municipio || '...'}
                    </h3>
                    <Table className="border">
                      <TableHeader>
                        <TableRow className="bg-gray-100">
                          <TableHead className="border px-2 py-1 text-center">Legislatura</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Número da Lei</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Cargo</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Subsídio</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Nº do Processo</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Situação</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Conclusão</TableHead>
                          <TableHead className="border px-2 py-1 text-center">Detalhes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Data will be added later */}
                        <TableRow>
                          <TableCell colSpan={8} className="border px-2 py-1 text-center text-gray-500">
                            Nenhuma lei de revisão geral anual encontrada (funcionalidade futura).
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
                {/* --- End Law Tables Section --- */}


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
                )} {/* Correctly close the conditional block here */}


                <div className="mb-8">
                  <h2 className="text-lg font-bold mb-4">Vícios ou Ressalvas da Fixação de Subsídios:</h2>

                  <div className="space-y-4"> {/* Increased spacing */}
                    {vicios.map((vicio, index) => {
                      const vicioKey = `vicio-${index}`;
                      const isChecked = formData.viciosChecks[vicioKey] || false;
                      const details = formData.viciosDetails[vicioKey] || { inputValue: '', ressalvaAV: false };

                      // Determine if an input is needed for this index
                      const needsInput = [0, 3, 5, 6, 7, 9].includes(index);
                      // Define placeholder based on index
                      let inputPlaceholder = '';
                      switch (index) {
                        case 0: inputPlaceholder = "Descreva a documentação ausente"; break;
                        case 3: inputPlaceholder = "Número da Lei"; break;
                        case 5: inputPlaceholder = "Qual(is) cargo(s) excedeu(eram) ao teto"; break;
                        case 6: inputPlaceholder = "Data da eleição"; break;
                        case 7: inputPlaceholder = "Art. e Lei alterados"; break;
                        case 9: inputPlaceholder = "Descreva a divergência"; break;
                        default: inputPlaceholder = "Detalhes"; // Default placeholder
                      }


                      return (
                        <div key={index} className="p-3 border rounded-md bg-gray-50"> {/* Added padding and border */}
                          <div className="flex items-center space-x-2 mb-2"> {/* Margin bottom for spacing */}
                            <Checkbox
                              id={vicioKey}
                              checked={isChecked}
                              onCheckedChange={(checked) => handleVicioCheckboxChange(index, !!checked)}
                            />
                            <Label htmlFor={vicioKey} className="text-base font-normal">{vicio}</Label>
                          </div>

                          {/* Conditional rendering for input and switch */}
                          {isChecked && (
                            <div className="pl-6 mt-2 space-y-2"> {/* Indent and space out conditional elements */}
                              {needsInput && (
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`${vicioKey}-input`} className="text-sm whitespace-nowrap">{inputPlaceholder}:</Label>
                                  <Input
                                    id={`${vicioKey}-input`}
                                    value={details.inputValue || ''}
                                    onChange={(e) => handleVicioInputChange(index, e.target.value)}
                                    placeholder={inputPlaceholder}
                                    className="flex-grow"
                                    type={index === 6 ? "date" : "text"} // Set type to "date" specifically for index 6
                                  />
                                </div>
                              )}
                              <div className="flex items-center gap-2">
                                {/* Label for the "Ressalva" state (when switch is off) */}
                                <Label htmlFor={`${vicioKey}-switch`} className={`text-sm ${!(details.ressalvaAV || false) ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                                  Ressalva
                                </Label>
                                <Switch
                                  id={`${vicioKey}-switch`}
                                  checked={details.ressalvaAV || false} // true = A/V, false = Ressalva
                                  onCheckedChange={(checked) => handleVicioSwitchChange(index, checked)}
                                />
                                {/* Label for the "A/V" state (when switch is on) */}
                                <Label htmlFor={`${vicioKey}-switch`} className={`text-sm ${(details.ressalvaAV || false) ? 'font-semibold text-green-600' : 'text-gray-500'}`}>
                                  A/V
                                </Label>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {formData.ressalvaLivre && (
                  <div className="mb-8">
                    <h3 className="font-medium mb-2">Ressalva</h3>
                    <Textarea className="w-full h-32" />
                  </div>
                )}

                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4">Conferência do Texto de Fixação de Subsídios</h2>
                  <div className="border rounded-md w-full h-64"></div> {/* Placeholder */}
                </div>

                {/* Law Detail Dialog */}
                <Dialog open={isLawDetailOpen} onOpenChange={setIsLawDetailOpen}>
                  <DialogContent className="sm:max-w-[600px] bg-white">
                    <DialogHeader>
                      <DialogTitle className="text-center text-lg font-semibold text-gray-800">
                        Detalhes da Lei {selectedLawDetail?.Num_Lei || '-'}/{selectedLawDetail?.Ano_Lei || '-'}
                      </DialogTitle>
                      <DialogDescription className="text-center text-sm text-gray-500">
                        Município: {selectedLawDetail?.Municipio || municipio?.Municipio || 'N/A'}
                      </DialogDescription>
                    </DialogHeader>
                    {selectedLawDetail ? (
                      <ScrollArea className="max-h-[60vh] p-4 border rounded-md">
                        <div className="space-y-2 text-sm">
                          {Object.entries(selectedLawDetail).map(([key, value]) => {
                            // Skip internal ID fields or empty values for cleaner display
                            if (key === 'id' || key === 'ID_Migracao' || value === null || value === undefined || value === '') return null;

                            let displayValue = value;
                            // Format specific fields
                            if (key === 'Modificado' && value instanceof Timestamp) {
                              displayValue = formatDate(value);
                            } else if ((key === 'Data_Inicial' || key === 'Data_Final') && (typeof value === 'string' || value instanceof Timestamp)) {
                              displayValue = formatDate(value);
                            } else if (typeof value === 'number' && (key === 'Num_Lei' || key === 'Ano_Lei' || key === 'Num_Processo' || key === 'Ano_Processo')) {
                               displayValue = String(value); // Display numbers directly
                            } else if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
                               // Skip complex objects/arrays if not handled specifically
                               return null;
                            }

                            // Simple key formatting (replace underscores, capitalize)
                            const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                            return (
                              <div key={key} className="grid grid-cols-3 gap-2 border-b pb-1">
                                <span className="font-medium text-gray-600 col-span-1">{displayKey}:</span>
                                <span className="text-gray-800 col-span-2 break-words">{String(displayValue)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-center text-gray-500">Nenhum detalhe de lei selecionado.</p>
                    )}
                    <div className="flex justify-end mt-4">
                       <Button variant="outline" onClick={() => setIsLawDetailOpen(false)}>Fechar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {/* End Law Detail Dialog */}

              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Fixacao; // Renamed export
