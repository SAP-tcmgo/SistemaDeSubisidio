import React, { useState, useEffect, useCallback, useRef } from 'react'; // Added useRef
import { MdSearch as Search, MdAdd as Plus, MdDelete as Delete, MdRemoveCircleOutline as RemoveIcon } from 'react-icons/md'; // Removed Home, CircleArrowRight, Save
import Header from '../../components/Header';
import Switch from '../../components/Switch';
import Sidebar from '../../components/Sidebar';
import Icons from '../../components/Icons';
import { municipiosGoias } from '../../dados/municipios';
import '../../styles/AppAnalise.css';
import '../../styles/indexAnalise.css';
import { useNavigate, useLocation } from 'react-router-dom'; // Removed Link
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { useDados } from '../../Contexts/DadosContext';
import { Eye } from 'lucide-react';
import { ScrollArea } from '../../components/ui/scroll-area';
import { toast } from '../../components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import BreadcrumbNav from '../../components/BreadcrumbNav'; // Import the new component

// --- Utility Functions ---
const formatCPF = (cpf: string | undefined | null): string => {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, ''); // Remove non-digits
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

const unformatCPF = (cpf: string | undefined | null): string => {
  return cpf ? cpf.replace(/\D/g, '') : '';
};


// Define the structure for local state management of responsible inputs
interface ResponsavelInput {
  nome: string;
  cpf: string;
  incluido: boolean; // Tracks if the switch/checkbox is checked by the user
}

// Interface for API response items
interface RepresentacaoApi {
  statusAprovacao: string;
  representante: string; // NOME
  numeroCPF: string; // CPF
  dataFinalRepresentacao: string | null; // Can be null
  unidadeGestoraRepresentada: string;
  representacao: string; // CARGO
  dataInicioRepresentacao: string;
  dataCadastro: string;
  idRepresentacao: number;
}

// Interface for processed ex-responsible data
interface ExResponsavel {
  id: number; // Use idRepresentacao for a unique key
  nome: string;
  cpf: string;
  cargo: string;
  dataInicio: string;
  dataFim: string | null;
}

const MunicipioEResponsaveis: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingResponsaveis, setLoadingResponsaveis] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const lastFetchedMunicipioCodigoRef = useRef<string | null>(null); // Ref to track last fetched municipio

  // Get state and setters from context
  const {
    municipio,
    setMunicipio,
    anoProcesso,
    setAnoProcesso,
    responsaveis, // This comes from context, holds manually added ones
    setResponsaveis,
    numeroProcesso
  } = useDados();

  // --- State for API fetched Ex-Responsáveis ---
  const [apiExPresidentes, setApiExPresidentes] = useState<ExResponsavel[]>([]);
  const [apiExPrefeitos, setApiExPrefeitos] = useState<ExResponsavel[]>([]);
  const [apiExChefesRHCamara, setApiExChefesRHCamara] = useState<ExResponsavel[]>([]);
  const [apiExChefesRHPrefeitura, setApiExChefesRHPrefeitura] = useState<ExResponsavel[]>([]);

  const [addedExResponsavelIds, setAddedExResponsavelIds] = useState<Set<number>>(new Set());

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Local state for municipio search input
  const [searchInput, setSearchInput] = useState<string>('');

  // State for section visibility toggles
  const [incluirExResponsaveis, setIncluirExResponsaveis] = useState<boolean>(false);
  const [incluirOutrosResponsaveis, setIncluirOutrosResponsaveis] = useState<boolean>(false);

  // Local state for the "Outros Responsáveis" section inputs
  const [outroNome, setOutroNome] = useState<string>('');
  const [outroCpf, setOutroCpf] = useState<string>('');
  const [outroCargo, setOutroCargo] = useState<string>('');

  // Local state to manage inputs for predefined roles
  const [presidenteInput, setPresidenteInput] = useState<ResponsavelInput>({ nome: '', cpf: '', incluido: false });
  const [prefeitoInput, setPrefeitoInput] = useState<ResponsavelInput>({ nome: '', cpf: '', incluido: false });
  const [chefeRHCamaraInput, setChefeRHCamaraInput] = useState<ResponsavelInput>({ nome: '', cpf: '', incluido: false });
  const [chefeRHPrefeituraInput, setChefeRHPrefeituraInput] = useState<ResponsavelInput>({ nome: '', cpf: '', incluido: false });

  // --- API Fetching Logic ---
  // Modified to accept municipio name explicitly
  const fetchResponsaveis = useCallback(async (codigoMunicipio: string, nomeMunicipio: string) => {
    setLoadingResponsaveis(true);
    setApiError(null);
    // Clear previous API results
    setPresidenteInput({ nome: '', cpf: '', incluido: false });
    setPrefeitoInput({ nome: '', cpf: '', incluido: false });
    setChefeRHCamaraInput({ nome: '', cpf: '', incluido: false });
    setChefeRHPrefeituraInput({ nome: '', cpf: '', incluido: false });
    setApiExPresidentes([]);
    setApiExPrefeitos([]);
    setApiExChefesRHCamara([]);
    setApiExChefesRHPrefeitura([]);
    // Note: We don't clear responsaveis from context here, only the local inputs/API lists

    // Helper function to parse DD/MM/YYYY string to Date object
    const parseDateString = (dateString: string | null): Date | null => {
      if (!dateString) return null;
      const parts = dateString.split('/');
      if (parts.length === 3) {
        // Note: Month is 0-indexed in JavaScript Date constructor (0 = January)
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        // Basic validation for parsed numbers
        if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
           // Further validation could be added (e.g., days in month)
           return new Date(Date.UTC(year, month, day)); // Use UTC to avoid timezone issues in comparisons
        }
      }
      console.warn(`Invalid date format encountered: ${dateString}`); // Log invalid formats
      return null; // Return null for invalid formats
    };


    try {
      // Use the proxy path configured in vite.config.ts
      const response = await fetch(`/api/passaporte/${codigoMunicipio}/representacoes`);
      if (!response.ok) {
        // Include status code for better debugging if possible
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
      const data: RepresentacaoApi[] = await response.json();

      const currentDate = new Date();
      currentDate.setUTCHours(0, 0, 0, 0); // Use UTC and set time to start of day for date-only comparison

      const currentResponsaveis: RepresentacaoApi[] = [];
      const exResponsaveisPotenciais: RepresentacaoApi[] = [];

      data.forEach(rep => {
        const startDate = parseDateString(rep.dataInicioRepresentacao);
        const endDate = parseDateString(rep.dataFinalRepresentacao);

        if (startDate && startDate <= currentDate) { // Must have started on or before today
          if (!endDate || endDate >= currentDate) { // Is current if no end date OR end date is today or in the future
            currentResponsaveis.push(rep);
          } else { // Has an end date and it's in the past
            exResponsaveisPotenciais.push(rep);
          }
        } else if (startDate && startDate > currentDate) {
          // Started in the future - not current, potentially ex if they also have an end date in the past (unlikely scenario, but handle)
          if (endDate && endDate < currentDate) {
             exResponsaveisPotenciais.push(rep);
          }
          // Otherwise, ignore future-starting roles for now.
        } else {
          // Invalid start date - cannot determine status
          console.warn(`Skipping representation due to invalid start date: ID ${rep.idRepresentacao}, StartDate: ${rep.dataInicioRepresentacao}`);
        }
      });


       // Filter ex-responsibles: remove those who are also current responsibles for the same role/CPF combination.
       // This prevents someone listed as current from also appearing as ex for the same role.
       const currentRespMap = new Map<string, RepresentacaoApi>();
       currentResponsaveis.forEach(cr => currentRespMap.set(`${cr.numeroCPF}-${cr.representacao}`, cr));

       const finalExResponsaveis = exResponsaveisPotenciais.filter(ex => !currentRespMap.has(`${ex.numeroCPF}-${ex.representacao}`));


      // --- Populate Current Responsible Inputs (Auxiliary State) ---
      const findCurrent = (cargo: string): RepresentacaoApi | undefined =>
        currentResponsaveis.find(r => r.representacao.toUpperCase() === cargo.toUpperCase());

      const presidenteAtual = findCurrent("PRESIDENTE DA CÂMARA");
      if (presidenteAtual) {
        setPresidenteInput(prev => ({ ...prev, nome: presidenteAtual.representante, cpf: presidenteAtual.numeroCPF, incluido: false })); // Don't auto-include
      }

      const prefeitoAtual = findCurrent("PREFEITO"); // API might use PREFEITO
       if (prefeitoAtual) {
         setPrefeitoInput(prev => ({ ...prev, nome: prefeitoAtual.representante, cpf: prefeitoAtual.numeroCPF, incluido: false }));
       } else {
         const prefeitaAtual = findCurrent("PREFEITA"); // Or PREFEITA
         if (prefeitaAtual) {
           setPrefeitoInput(prev => ({ ...prev, nome: prefeitaAtual.representante, cpf: prefeitaAtual.numeroCPF, incluido: false }));
         }
       }

      // --- Find Current RH Chiefs with specific logic ---
      // Use the passed nomeMunicipio argument
      const municipioNomeUpper = nomeMunicipio.toUpperCase();
      const expectedCamaraUG = `CÂMARA DE ${municipioNomeUpper}`;
      const expectedPrefeituraUG = `PREFEITURA DE ${municipioNomeUpper}`;
      const rhCargoUpper = "CHEFE DE RECURSOS HUMANOS / FOLHA DE PAGAMENTO";

      const chefeRHCamaraAtual = currentResponsaveis.find(r =>
          r.representacao.toUpperCase() === rhCargoUpper &&
          r.unidadeGestoraRepresentada.toUpperCase() === expectedCamaraUG
      );
      if (chefeRHCamaraAtual) {
        setChefeRHCamaraInput(prev => ({ ...prev, nome: chefeRHCamaraAtual.representante, cpf: chefeRHCamaraAtual.numeroCPF, incluido: false }));
      }

      const chefeRHPrefeituraAtual = currentResponsaveis.find(r =>
          r.representacao.toUpperCase() === rhCargoUpper &&
          r.unidadeGestoraRepresentada.toUpperCase() === expectedPrefeituraUG
      );
      if (chefeRHPrefeituraAtual) {
        setChefeRHPrefeituraInput(prev => ({ ...prev, nome: chefeRHPrefeituraAtual.representante, cpf: chefeRHPrefeituraAtual.numeroCPF, incluido: false }));
      }


      // --- Populate Ex-Responsible Lists (Auxiliary State) ---
      const mapToExResponsavel = (r: RepresentacaoApi): ExResponsavel => ({
          id: r.idRepresentacao,
          nome: r.representante,
          cpf: r.numeroCPF,
          cargo: r.representacao,
          dataInicio: r.dataInicioRepresentacao,
          dataFim: r.dataFinalRepresentacao
      });

      setApiExPresidentes(finalExResponsaveis.filter(r => r.representacao.toUpperCase() === "PRESIDENTE DA CÂMARA").map(mapToExResponsavel));
      setApiExPrefeitos(finalExResponsaveis.filter(r => r.representacao.toUpperCase() === "PREFEITO" || r.representacao.toUpperCase() === "PREFEITA").map(mapToExResponsavel));
      // Use dynamic municipio name for filtering Ex RH Chiefs
      setApiExChefesRHCamara(finalExResponsaveis.filter(r =>
          r.representacao.toUpperCase() === rhCargoUpper &&
          r.unidadeGestoraRepresentada.toUpperCase() === expectedCamaraUG
      ).map(mapToExResponsavel));
      setApiExChefesRHPrefeitura(finalExResponsaveis.filter(r =>
          r.representacao.toUpperCase() === rhCargoUpper &&
          r.unidadeGestoraRepresentada.toUpperCase() === expectedPrefeituraUG
      ).map(mapToExResponsavel));

      // On successful fetch, update the ref
      lastFetchedMunicipioCodigoRef.current = codigoMunicipio;

    } catch (error) {
      console.error("Erro ao buscar responsáveis:", error);
      setApiError(error instanceof Error ? error.message : "Erro desconhecido ao buscar dados.");
       toast({
         title: "Erro de API",
         description: `Não foi possível buscar os responsáveis: ${error instanceof Error ? error.message : "Erro desconhecido."}`,
         variant: "destructive",
       });
    } finally {
      setLoadingResponsaveis(false);
    }
  }, [setResponsaveis, toast]); // Added toast dependency

  // Effect to fetch data when municipio changes
  useEffect(() => {
    // Ensure both codigo and nome are present before fetching
    if (municipio && municipio.codigo && municipio.nome) {
      // Fetch only if the codigo is different from the last fetched one
      if (municipio.codigo !== lastFetchedMunicipioCodigoRef.current) {
        fetchResponsaveis(municipio.codigo, municipio.nome);
      }
    } else {
      // Clear fields and reset ref if no municipio is selected
       setPresidenteInput({ nome: '', cpf: '', incluido: false });
       setPrefeitoInput({ nome: '', cpf: '', incluido: false });
       setChefeRHCamaraInput({ nome: '', cpf: '', incluido: false });
       setChefeRHPrefeituraInput({ nome: '', cpf: '', incluido: false });
       setApiExPresidentes([]);
       setApiExPrefeitos([]);
       setApiExChefesRHCamara([]);
       setApiExChefesRHPrefeitura([]);
       setAddedExResponsavelIds(new Set()); // Clear added ex-responsaveis tracking
       lastFetchedMunicipioCodigoRef.current = null; // Reset ref
    }
    // Dependency array: only re-run if municipio object changes or fetchResponsaveis changes (due to useCallback dependencies)
  }, [municipio, fetchResponsaveis]);

   // Effect to synchronize addedExResponsavelIds with the context state
   useEffect(() => {
     const currentAddedIds = new Set<number>();
     responsaveis.forEach(r => {
       // Safely access 'id'. Assumes 'Responsavel' type in context might have optional 'id'.
       const respWithId = r as { id?: number; cargo?: string }; // Type assertion for checking
       if (respWithId.id && respWithId.cargo?.startsWith('Ex-')) {
         currentAddedIds.add(respWithId.id);
       }
     });
     setAddedExResponsavelIds(currentAddedIds);
   }, [responsaveis]);


  // Effect to set search input when municipio changes (from context or selection)
  useEffect(() => {
    if (municipio && municipio.nome) {
      setSearchInput(municipio.nome);
    } else {
      setSearchInput('');
    }
  }, [municipio]);

  const anosProcesso = () => {
    const anoAtual = new Date().getFullYear();
    const anos = [];
    for (let ano = 2000; ano <= anoAtual; ano++) {
      anos.push(ano.toString());
    }
    return anos.reverse();
  };

  const normalizeString = (str: string) => 
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredMunicipios = municipiosGoias.filter(m =>
    normalizeString(m.nome).includes(normalizeString(searchInput))
  );

  // Handles toggling the SWITCH for CURRENT responsibles
  const handleToggleResponsavel = (
    inputState: ResponsavelInput,
    setInputState: React.Dispatch<React.SetStateAction<ResponsavelInput>>,
    cargo: string, // The exact cargo string used in the context
    checked: boolean
  ) => {
    const { nome, cpf } = inputState;

    // Update the local input state first to reflect the switch change immediately
    setInputState({ ...inputState, incluido: checked });

    // Now, modify the context based on the check state
    if (checked) {
      // Add to context only if name and CPF are filled
      if (nome.trim() && cpf.trim()) {
        // Check if already exists in context before adding
        const exists = responsaveis.some(r => r.cargo === cargo && r.cpf === cpf.trim());
        if (!exists) {
          const newResponsavel = { nome: nome.trim(), cpf: cpf.trim(), cargo };
          setResponsaveis(prev => [...prev, newResponsavel]);
        }
      } else {
        // If trying to include without data, show warning and revert the switch visually
        console.warn(`Preencha Nome e CPF para incluir ${cargo}.`); // Keep console warning
        setInputState({ ...inputState, incluido: false }); // Revert visual state
      }
    } else {
      // Remove from context if unchecked
      const removedName = inputState.nome; // Get name before filtering
      setResponsaveis(prev => prev.filter(r => !(r.cargo === cargo && r.cpf === cpf.trim())));
    }
  };

  // Handles clicking the PLUS icon for EX-responsibles
  const handleAddExResponsavel = (exResp: ExResponsavel) => {
    const cargoContext = `Ex-${exResp.cargo}`; // Prefix cargo for context
    // Apply type assertion here when checking context
    const exists = responsaveis.some(r => {
        const respWithId = r as { id?: number; cargo?: string };
        return respWithId.id === exResp.id && respWithId.cargo === cargoContext;
    });


    if (!exists) {
      // Add with id
      setResponsaveis(prev => [...prev, { id: exResp.id, nome: exResp.nome, cpf: exResp.cpf, cargo: cargoContext }]);
      setAddedExResponsavelIds(prev => new Set(prev).add(exResp.id)); // Track addition
    } else {
       console.warn(`${exResp.nome} (${cargoContext}) já está na lista.`); // Keep console warning
    }
  };

   // Handles clicking the REMOVE icon for EX-responsibles already added
   const handleRemoveExResponsavel = (exRespId: number, cargoContext: string) => {
     // Apply type assertion here when filtering/finding context items
     setResponsaveis(prev => prev.filter(r => {
         const respWithId = r as { id?: number; cargo?: string };
         return !(respWithId.id === exRespId && respWithId.cargo === cargoContext);
     }));
     setAddedExResponsavelIds(prev => {
       const newSet = new Set(prev);
       newSet.delete(exRespId);
       return newSet;
     }); // Untrack
     const removedResp = responsaveis.find(r => {
         const respWithId = r as { id?: number; cargo?: string };
         return respWithId.id === exRespId && respWithId.cargo === cargoContext;
      });
    };


  const handleAddOutroResponsavel = () => {
    if (outroNome.trim() && outroCpf.trim() && outroCargo.trim()) {
      const newResponsavel = {
        nome: outroNome.trim(),
        cpf: outroCpf.trim(),
        cargo: outroCargo.trim()
      };
      if (!responsaveis.some(r => r.nome === newResponsavel.nome && r.cpf === newResponsavel.cpf && r.cargo === newResponsavel.cargo)) {
        setResponsaveis([...responsaveis, newResponsavel]);
        setOutroNome('');
        setOutroCpf('');
        setOutroCargo('');
      } else {
        console.warn("Responsável já incluído.");
      }
    } else {
       console.warn("Preencha Nome, CPF e Cargo para incluir outro responsável.");
    }
  };

  const handleRemoveOutroResponsavel = (responsavelToRemove: { nome: string; cpf: string; cargo: string }) => {
    setResponsaveis(responsaveis.filter(r =>
      !(r.nome === responsavelToRemove.nome && r.cpf === responsavelToRemove.cpf && r.cargo === responsavelToRemove.cargo)
    ));
  };

  // Filter for the "Outros Responsáveis" section - EXCLUDE Ex- and predefined roles
  const outrosResponsaveisList = responsaveis.filter(r =>
    !["Presidente da Câmara", "Prefeito(a)", "Chefe RH Câmara", "Chefe RH Prefeitura"].includes(r.cargo || '') &&
    !r.cargo?.startsWith('Ex-')
  );

  // Handler to remove ANY responsible from the modal list
  const handleRemoveResponsavelFromModal = (respToRemove: { id?: number; nome: string; cpf: string; cargo: string }) => {
    // Filter out from main context state
    setResponsaveis(prev => prev.filter(r =>
      !(r.cpf === respToRemove.cpf && r.cargo === respToRemove.cargo) // Match by CPF and Cargo primarily
    ));

    // If it was an Ex-Responsavel, update the tracking Set
    if (respToRemove.cargo?.startsWith('Ex-') && respToRemove.id) {
      setAddedExResponsavelIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(respToRemove.id as number);
        return newSet;
      });
    }

    // If it was a predefined current responsible, update its input state's 'incluido' flag
    switch (respToRemove.cargo) {
      case "Presidente da Câmara":
        setPresidenteInput(prev => ({ ...prev, incluido: false }));
        break;
      case "Prefeito(a)":
        setPrefeitoInput(prev => ({ ...prev, incluido: false }));
        break;
      case "Chefe RH Câmara":
        setChefeRHCamaraInput(prev => ({ ...prev, incluido: false }));
        break;
      case "Chefe RH Prefeitura":
        setChefeRHPrefeituraInput(prev => ({ ...prev, incluido: false }));
        break;
    }
     // Optionally add a toast notification here if desired later
  };

  // --- Clear Screen Function ---
  const handleClearScreen = () => {
    // Reset context state
    setMunicipio({ nome: '', codigo: '' }); // Reset to initial state object
    setAnoProcesso(''); // Or your initial state for anoProcesso
    setResponsaveis([]); // Clear the list of responsaveis in context

    // Reset local state
    setSearchInput('');
    setIncluirExResponsaveis(false);
    setIncluirOutrosResponsaveis(false);
    setOutroNome('');
    setOutroCpf('');
    setOutroCargo('');
    setPresidenteInput({ nome: '', cpf: '', incluido: false });
    setPrefeitoInput({ nome: '', cpf: '', incluido: false });
    setChefeRHCamaraInput({ nome: '', cpf: '', incluido: false });
    setChefeRHPrefeituraInput({ nome: '', cpf: '', incluido: false });
    setApiExPresidentes([]);
    setApiExPrefeitos([]);
    setApiExChefesRHCamara([]);
    setApiExChefesRHPrefeitura([]);
    setAddedExResponsavelIds(new Set());
    setApiError(null);
    setIsViewModalOpen(false); // Close modal if open

    // Optional: Show a confirmation toast
    toast({
      title: "Tela Limpa",
      description: "Todos os campos foram redefinidos.",
    });
  };

  // --- Icon Click Handlers ---
  const handleErase = () => {
    handleClearScreen(); // Reuse the existing clear logic
  };

  const handleBack = () => {
    navigate('/telaInicial');
  };

  const handleNext = () => {
    navigate('/TratamentoLeis');
  };


  return (
    <div className="municipios-theme flex min-h-screen flex-col bg-gray-50">
      <div className="min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="flex justify-between items-center">
            <Header toggleSidebar={toggleSidebar} />
          </div>

          {/* Use the new BreadcrumbNav component */}
          <BreadcrumbNav currentPage="Município e Responsáveis" sidebarOpen={sidebarOpen} />

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
                  <h1 className="text-2xl font-bold text-center mb-4 mt-[-20px]">Município e Responsáveis {numeroProcesso && `(${numeroProcesso})`}</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-6"> {/* Added mt-6 */}
                  <div>
                    <Label htmlFor="municipio" className="text-sm font-medium text-gray-700 mb-1 block">
                      Município
                    </Label>
                    <div className="relative">
                      <Input
                        id="municipio"
                        placeholder="Selecione um município"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-10 border-gray-300"
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" style={{ transform: 'translateY(4px)' }} />
                      {/* Dropdown for municipio selection */}
                      {searchInput && searchInput !== municipio?.nome && filteredMunicipios.length > 0 && !loadingResponsaveis && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredMunicipios.map((m) => (
                            <div
                              key={m.codigo}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setMunicipio({ nome: m.nome, codigo: m.codigo }); // This triggers the useEffect for API call
                                setSearchInput(m.nome); // Update input visually
                              }}
                            >
                              {m.nome}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Loading indicator */}
                      {loadingResponsaveis && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                              <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                          </div>
                      )}
                    </div>
                    {/* API Error Display */}
                    {apiError && <p className="text-red-500 text-xs mt-1">{apiError}</p>}
                  </div>

                  <div>
                    <Label htmlFor="periodoProcesso" className="text-sm font-medium text-gray-700 mb-1 block">
                      Período:
                    </Label>
                    <Input
                      type="text"
                      id="periodoProcesso"
                      placeholder="Período"
                      value={anoProcesso}
                      onChange={(e) => setAnoProcesso(e.target.value)}
                      className="w-24 tcmgo-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="prefeitoNome" className="text-sm font-medium text-gray-700 mb-1 block">
                        Presidente da Câmara Atual
                      </Label>
                      <Input
                        id="presidenteCamaraNome"
                        placeholder="Nome"
                        value={presidenteInput.nome}
                        onChange={(e) => setPresidenteInput({ ...presidenteInput, nome: e.target.value })}
                        className="mb-1 tcmgo-input"
                        // Input is editable even if populated by API, disabled only by switch
                        disabled={!presidenteInput.incluido && !presidenteInput.nome} // Disable if switch off AND no name (i.e. not API populated)
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-5">
                      <Input
                        id="presidenteCamaraCpf"
                        placeholder="CPF"
                        value={formatCPF(presidenteInput.cpf)} // Display formatted
                        onChange={(e) => {
                          const rawCpf = unformatCPF(e.target.value);
                          if (rawCpf.length <= 11) { // Limit to 11 digits
                            setPresidenteInput({ ...presidenteInput, cpf: rawCpf }); // Store raw digits
                          }
                        }}
                        className="w-32 tcmgo-input"
                        disabled={!presidenteInput.incluido && !presidenteInput.cpf} // Disable if switch off AND no cpf
                      />
                      <Switch
                        checked={presidenteInput.incluido}
                        onCheckedChange={(checked) => handleToggleResponsavel(presidenteInput, setPresidenteInput, "Presidente da Câmara", checked)}
                      />
                    </div>
                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                    <div>
                      <Label htmlFor="prefeitoNome" className="text-sm font-medium text-gray-700 mb-1 block">
                        Prefeito(a) Atual
                      </Label>
                      <Input
                        id="prefeitoNome"
                        placeholder="Nome"
                        value={prefeitoInput.nome}
                        onChange={(e) => setPrefeitoInput({ ...prefeitoInput, nome: e.target.value })}
                        className="mb-1 tcmgo-input"
                        disabled={!prefeitoInput.incluido && !prefeitoInput.nome}
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-5">
                      <Input
                        id="prefeitoCpf"
                        placeholder="CPF"
                        value={formatCPF(prefeitoInput.cpf)} // Display formatted
                        onChange={(e) => {
                          const rawCpf = unformatCPF(e.target.value);
                           if (rawCpf.length <= 11) {
                             setPrefeitoInput({ ...prefeitoInput, cpf: rawCpf }); // Store raw digits
                           }
                        }}
                        className="w-32 tcmgo-input"
                        disabled={!prefeitoInput.incluido && !prefeitoInput.cpf}
                      />
                      <Switch
                        checked={prefeitoInput.incluido}
                        onCheckedChange={(checked) => handleToggleResponsavel(prefeitoInput, setPrefeitoInput, "Prefeito(a)", checked)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                    <div>
                      <Label htmlFor="chefeRHCamaraNome" className="text-sm font-medium text-gray-700 mb-1 block">
                        Chefe do RH da Câmara Municipal
                      </Label>
                      <Input
                        id="chefeRHCamaraNome"
                        placeholder="Nome"
                        value={chefeRHCamaraInput.nome}
                        onChange={(e) => setChefeRHCamaraInput({ ...chefeRHCamaraInput, nome: e.target.value })}
                        className="mb-1 tcmgo-input"
                          disabled={!chefeRHCamaraInput.incluido && !chefeRHCamaraInput.nome}
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-5">
                      <Input
                        id="chefeRHCamaraCpf"
                        placeholder="CPF"
                        value={formatCPF(chefeRHCamaraInput.cpf)} // Display formatted
                        onChange={(e) => {
                          const rawCpf = unformatCPF(e.target.value);
                           if (rawCpf.length <= 11) {
                            setChefeRHCamaraInput({ ...chefeRHCamaraInput, cpf: rawCpf }); // Store raw digits
                           }
                        }}
                        className="w-32 tcmgo-input"
                          disabled={!chefeRHCamaraInput.incluido && !chefeRHCamaraInput.cpf}
                      />
                      <Switch
                        checked={chefeRHCamaraInput.incluido}
                        onCheckedChange={(checked) => handleToggleResponsavel(chefeRHCamaraInput, setChefeRHCamaraInput, "Chefe RH Câmara", checked)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
                    <div>
                      <Label htmlFor="chefeRHPrefeituraNome" className="text-sm font-medium text-gray-700 mb-1 block">
                        Chefe do RH da Prefeitura
                      </Label>
                      <Input
                        id="chefeRHPrefeituraNome"
                        placeholder="Nome"
                        value={chefeRHPrefeituraInput.nome}
                        onChange={(e) => setChefeRHPrefeituraInput({ ...chefeRHPrefeituraInput, nome: e.target.value })}
                        className="mb-1 tcmgo-input"
                        disabled={!chefeRHPrefeituraInput.incluido && !chefeRHPrefeituraInput.nome}
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-5">
                      <Input
                        id="chefeRHPrefeituraCpf"
                        placeholder="CPF"
                        value={formatCPF(chefeRHPrefeituraInput.cpf)} // Display formatted
                        onChange={(e) => {
                          const rawCpf = unformatCPF(e.target.value);
                           if (rawCpf.length <= 11) {
                            setChefeRHPrefeituraInput({ ...chefeRHPrefeituraInput, cpf: rawCpf }); // Store raw digits
                           }
                        }}
                        className="w-32 tcmgo-input"
                        disabled={!chefeRHPrefeituraInput.incluido && !chefeRHPrefeituraInput.cpf}
                      />
                      <Switch
                        checked={chefeRHPrefeituraInput.incluido}
                        onCheckedChange={(checked) => handleToggleResponsavel(chefeRHPrefeituraInput, setChefeRHPrefeituraInput, "Chefe RH Prefeitura", checked)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap mt-4">
                    <div className="flex items-center mr-4 space-x-2">
                      <Checkbox
                        id="incluirExResponsaveis"
                        checked={incluirExResponsaveis}
                        onCheckedChange={(checked) => setIncluirExResponsaveis(checked as boolean)}
                      />
                      <Label htmlFor="incluirExResponsaveis">Incluir Ex-Responsáveis</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="incluirOutrosResponsaveis"
                        checked={incluirOutrosResponsaveis}
                        onCheckedChange={(checked) => setIncluirOutrosResponsaveis(checked as boolean)}
                      />
                      <Label htmlFor="incluirOutrosResponsaveis">Incluir Outros Responsáveis</Label>
                    </div>

                    {/* "Visualizar Responsáveis Incluídos" Trigger Button */}
                    <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                    <DialogTrigger asChild className="ml-auto">
                         <div className="pt-4 flex items-center text-sm">
                          <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10">
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar Responsáveis Incluídos
                          </Button>
                         </div>
                       </DialogTrigger>
                       <DialogContent className="sm:max-w-[600px] bg-white"> 
                         <DialogHeader>
                           <DialogTitle className="text-center text-lg font-semibold text-gray-800">Responsáveis incluídos</DialogTitle>
                         </DialogHeader>

                        <div className="border border-gray-300 rounded-md p-4">
                          <ScrollArea className="h-[400px] w-full">
                            {responsaveis.length > 0 ? (
                              responsaveis.map((resp, index) => (
                                <div key={`${resp.cpf}-${resp.cargo}-${index}`} className="border border-gray-300 p-2 rounded mb-2 flex justify-between items-center text-sm">
                                  <div>
                                    <p className="font-medium">{resp.nome}</p>
                                    {/* Display formatted CPF in modal */}
                                    <p className="text-gray-600">{resp.cargo} - CPF: {formatCPF(resp.cpf)}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveResponsavelFromModal(resp)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Delete className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-gray-500">Nenhum responsável incluído ainda.</div>
                            )}
                          </ScrollArea>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {incluirExResponsaveis && (
                  <div className="mt-6 border rounded-md p-4 bg-gray-50">
                    {loadingResponsaveis && <p>Carregando ex-responsáveis...</p>}
                    {apiError && <p className="text-red-500">Erro ao carregar: {apiError}</p>}
                    {!loadingResponsaveis && !apiError && (
                      <div className="mb-4 flex flex-wrap">
                        {/* Ex-Presidentes */}
                        <div className="w-[calc(50%-1rem)] mb-4 mr-4">
                          <h4 className="font-medium text-gray-600 text-sm mb-1">Ex-Presidentes da Câmara:</h4>
                          <ScrollArea className="h-40 w-full rounded-md border p-2 bg-white">
                            {/* Removed grid classes from the inner div */}
                            <div>
                              {apiExPresidentes.length > 0 ? apiExPresidentes.map((resp) => {
                                const isAdded = addedExResponsavelIds.has(resp.id);
                                const cargoContext = `Ex-${resp.cargo}`;
                                return (
                                  // Added border, padding, margin, rounded corners
                                  <div key={resp.id} className={`border border-gray-300 rounded-md p-2 mb-2 flex justify-between items-center text-sm ${isAdded ? 'bg-green-100' : ''}`}>
                                    <span>{resp.nome} ({resp.dataInicio} - {resp.dataFim || 'Atual'})</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => isAdded ? handleRemoveExResponsavel(resp.id, cargoContext) : handleAddExResponsavel(resp)}
                                      className={isAdded ? "text-red-500 hover:text-red-700" : "text-primary hover:text-primary/80"}
                                    >
                                      {isAdded ? <RemoveIcon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                );
                              }) : <p className="text-xs text-gray-500">Nenhum encontrado.</p>}
                            </div>
                          </ScrollArea>
                        </div>

                        {/* Ex-Prefeitos */}
                        <div className="w-[calc(50%-1rem)] mb-4 mr-4">
                          <h4 className="font-medium text-gray-600 text-sm mb-1">Ex-Prefeitos(as):</h4>
                          <ScrollArea className="h-40 w-full rounded-md border p-2 bg-white">
                            {/* Removed grid classes from the inner div */}
                            <div>
                              {apiExPrefeitos.length > 0 ? apiExPrefeitos.map((resp) => {
                                const isAdded = addedExResponsavelIds.has(resp.id);
                                const cargoContext = `Ex-${resp.cargo}`;
                                return (
                                  // Added border, padding, margin, rounded corners
                                  <div key={resp.id} className={`border border-gray-300 rounded-md p-2 mb-2 flex justify-between items-center text-sm ${isAdded ? 'bg-green-100' : ''}`}>
                                    <span>{resp.nome} ({resp.dataInicio} - {resp.dataFim || 'Atual'})</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => isAdded ? handleRemoveExResponsavel(resp.id, cargoContext) : handleAddExResponsavel(resp)}
                                      className={isAdded ? "text-red-500 hover:text-red-700" : "text-primary hover:text-primary/80"}
                                    >
                                      {isAdded ? <RemoveIcon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                );
                              }) : <p className="text-xs text-gray-500">Nenhum encontrado.</p>}
                            </div>
                          </ScrollArea>
                        </div>

                        {/* Ex-Chefes RH Câmara */}
                        <div className="w-[calc(50%-1rem)] mb-4 mr-4">
                          <h4 className="font-medium text-gray-600 text-sm mb-1">Ex-Chefes RH Câmara:</h4>
                          <ScrollArea className="h-40 w-full rounded-md border p-2 bg-white">
                            {/* Removed grid classes from the inner div */}
                            <div>
                              {apiExChefesRHCamara.length > 0 ? apiExChefesRHCamara.map((resp) => {
                                const isAdded = addedExResponsavelIds.has(resp.id);
                                const cargoContext = `Ex-${resp.cargo}`;
                                return (
                                  // Added border, padding, margin, rounded corners
                                  <div key={resp.id} className={`border border-gray-300 rounded-md p-2 mb-2 flex justify-between items-center text-sm ${isAdded ? 'bg-green-100' : ''}`}>
                                    <span>{resp.nome} ({resp.dataInicio} - {resp.dataFim || 'Atual'})</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => isAdded ? handleRemoveExResponsavel(resp.id, cargoContext) : handleAddExResponsavel(resp)}
                                      className={isAdded ? "text-red-500 hover:text-red-700" : "text-primary hover:text-primary/80"}
                                    >
                                      {isAdded ? <RemoveIcon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                );
                              }) : <p className="text-xs text-gray-500">Nenhum encontrado.</p>}
                            </div>
                          </ScrollArea>
                        </div>

                        {/* Ex-Chefes RH Prefeitura */}
                        <div className="w-[calc(50%-1rem)] mb-4 mr-4">
                          <h4 className="font-medium text-gray-600 text-sm mb-1">Ex-Chefes RH Prefeitura:</h4>
                          <ScrollArea className="h-40 w-full rounded-md border p-2 bg-white">
                            {/* Removed grid classes from the inner div */}
                            <div>
                              {apiExChefesRHPrefeitura.length > 0 ? apiExChefesRHPrefeitura.map((resp) => {
                                const isAdded = addedExResponsavelIds.has(resp.id);
                                const cargoContext = `Ex-${resp.cargo}`;
                                return (
                                  // Added border, padding, margin, rounded corners
                                  <div key={resp.id} className={`border border-gray-300 rounded-md p-2 mb-2 flex justify-between items-center text-sm ${isAdded ? 'bg-green-100' : ''}`}>
                                    <span>{resp.nome} ({resp.dataInicio} - {resp.dataFim || 'Atual'})</span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => isAdded ? handleRemoveExResponsavel(resp.id, cargoContext) : handleAddExResponsavel(resp)}
                                      className={isAdded ? "text-red-500 hover:text-red-700" : "text-primary hover:text-primary/80"}
                                    >
                                      {isAdded ? <RemoveIcon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                );
                              }) : <p className="text-xs text-gray-500">Nenhum encontrado.</p>}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- Outros Responsáveis Section (Manual Input) --- */}
                {incluirOutrosResponsaveis && (
                  <div className="mt-6 border rounded-md p-4 bg-gray-50">
                    <h3 className="font-medium text-gray-700 mb-3">Incluir Outros Responsáveis</h3>

                    <div className="mb-3 w-[42.5%]">
                      <Label htmlFor="outroNome" className="text-sm font-medium text-gray-700 mb-1 block">
                        Nome do Responsável
                      </Label>
                      <Input
                        id="outroNome"
                        placeholder="Nome"
                        value={outroNome}
                        onChange={(e) => setOutroNome(e.target.value)}
                      />
                    </div>

                  <div className="flex gap-4 items-center mb-3">
                    <div className='w-32'>
                      <Label htmlFor="outroCpf" className="text-sm font-medium text-gray-700 mb-1 block">
                        CPF Responsável
                      </Label>
                      <Input
                        id="outroCpf"
                        placeholder="CPF"
                        value={formatCPF(outroCpf)} // Display formatted
                        onChange={(e) => {
                          const rawCpf = unformatCPF(e.target.value);
                           if (rawCpf.length <= 11) {
                            setOutroCpf(rawCpf); // Store raw digits
                           }
                        }}
                      />
                    </div>

                    <div className='w-64'>
                      <Label htmlFor="outroCargo" className="text-sm font-medium text-gray-700 mb-1 block">
                        Cargo
                      </Label>
                      <Input
                        id="outroCargo"
                        placeholder="Cargo (Ex: Secretário)"
                        value={outroCargo}
                        onChange={(e) => setOutroCargo(e.target.value)}
                      />
                    </div>

                    <Button onClick={handleAddOutroResponsavel} className="ml-3 mt-6 bg-secondary hover:bg-secondary/90 text-white" size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Incluir Responsável
                    </Button>
                  </div>
                </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
export default MunicipioEResponsaveis;
