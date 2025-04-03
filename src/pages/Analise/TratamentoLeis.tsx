import React, { useState, ChangeEvent, useEffect } from 'react'; // Added useEffect
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Eye, Plus, Trash2, X } from 'lucide-react'; // Added X for close icon
import { MdHome as Home, MdOutlineArrowCircleRight as CircleArrowRight, MdOutlineArrowCircleLeft as CircleArrowLeft, MdSave as Save} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Import Dialog components
import '../../styles/AppAnalise.css';
import '../../styles/indexAnalise.css';
import { useDados, LeiIncluida } from '../../Contexts/DadosContext'; // Import LeiIncluida
import axios from 'axios';
// Removed duplicate useEffect import

// Define the structure of a law from the Colare API based on the example
interface LeiColareAPI {
  arquivoPrincipalNorma: string;
  municipio: string;
  anoNorma: number;
  dataEnvio: string;
  unidadeGestora: string;
  tipoNorma: string;
  detalhamentoNorma: string;
  unidadeGestoraId: number;
  representante: string;
  numeroNorma: number;
  ementa: string;
  idEnvioColare: number; // Use this as a unique identifier
  situacaoEnvio: string;
}

const TratamentoLeis: React.FC = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const {
    municipio,
    numeroHabitantes,
    setNumeroHabitantes,
    doQueSeTrata,
    setDoQueSeTrata,
    leis, // Keep this for the other list
    setLeis, // Keep this
    leisColare, // This is the list in the context where we add included laws
    setLeisColare, // Function to update the context list
    numeroProcesso
  } = useDados();

  // State for fetched laws from Colare API
  const [fetchedLeisColare, setFetchedLeisColare] = useState<LeiColareAPI[]>([]);
  // State to track IDs of laws added to the context
  const [includedLawIds, setIncludedLawIds] = useState<number[]>([]);
  // State for potential errors during API fetch
  const [fetchError, setFetchError] = useState<string | null>(null);
  // State for loading status
  const [isLoadingLeis, setIsLoadingLeis] = useState<boolean>(false);
  // State for controlling the included laws modal
  const [isLeisModalOpen, setIsLeisModalOpen] = useState<boolean>(false);


  // Fetch population (existing useEffect)
  useEffect(() => {
    const  ApiPopulacao = async () => {
      if (municipio && municipio.codigo) {
        try {
          const response = await axios.get(
            `https://apisidra.ibge.gov.br/values/t/4714/n6/${municipio.codigo}/v/93/p/2022`
          );
          const populationData = response.data[1]; 
          const population = populationData?.V || '0';
          setNumeroHabitantes(parseInt(population, 10));
        } catch (error) {
          console.error('Erro ao buscar população:', error);
          setNumeroHabitantes(0); // Reset or handle error appropriately
        }
      } else {
         setNumeroHabitantes(0); // Reset if no municipio is selected
      }
    };

     ApiPopulacao();
  }, [municipio?.codigo, setNumeroHabitantes, municipio]); // Added municipio dependency

  // Fetch Colare Laws
  useEffect(() => {
    const fetchColareLaws = async () => {
      if (municipio && municipio.codigo) {
        setIsLoadingLeis(true);
        setFetchError(null);
        setFetchedLeisColare([]); // Clear previous laws
        try {
          // Use the proxy path configured in vite.config.ts
          const response = await axios.get<LeiColareAPI[]>(
            `/api/colare/${municipio.codigo}/legislacoes` // Use the local proxy path
          );
          setFetchedLeisColare(response.data || []); // Ensure it's an array
        } catch (error) {
          console.error('Erro ao buscar leis do COLARE:', error);
          setFetchError('Falha ao buscar leis do COLARE. Verifique a conexão ou o código do município.');
          setFetchedLeisColare([]); // Clear on error
        } finally {
          setIsLoadingLeis(false);
        }
      } else {
        setFetchedLeisColare([]); // Clear if no municipio is selected
        setIsLoadingLeis(false);
        setFetchError(null);
      }
    };

    fetchColareLaws();
  }, [municipio?.codigo, municipio]); // Depend on municipio code

  // Function to format a single law
  const formatLeiColare = (lei: LeiColareAPI): string => {
    const anoCurto = lei.anoNorma % 100; // Get last two digits of the year
    return `Lei Municipal n.: ${lei.numeroNorma}/${anoCurto}, ${lei.ementa}`;
  };

  // Handler for adding a law to the context list
  const handleAddLeiColare = (lei: LeiColareAPI) => {
    const formattedLei = formatLeiColare(lei);
    // Check if the law (by id) is already included to avoid duplicates in the context state
    if (!includedLawIds.includes(lei.idEnvioColare)) {
      // Add the object with id and text to the context state
      const novaLeiIncluida: LeiIncluida = { id: lei.idEnvioColare, text: formattedLei };
      setLeisColare(prevLeis => [...prevLeis, novaLeiIncluida]);
      setIncludedLawIds(prevIds => [...prevIds, lei.idEnvioColare]); // Track included ID locally
    }
  };

  // Handler for removing a law from the context list
  const handleRemoveLeiColare = (idToRemove: number) => {
    // Remove from context state
    setLeisColare(prevLeis => prevLeis.filter(lei => lei.id !== idToRemove));
    // Remove from local tracking state
    setIncludedLawIds(prevIds => prevIds.filter(id => id !== idToRemove));
  };


  // --- Rest of the component logic ---
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

  // Function to handle "Visualizar lista completa" click - now opens the modal
  const handleVisualizarCompletasClick = () => {
    setIsLeisModalOpen(true); // Set state to open the modal
  };


  return (
    <div className="municipios-theme flex min-h-screen flex-col bg-gray-50">
      <div className="min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="flex justify-between items-center">
          <Header toggleSidebar={toggleSidebar} />
          </div>

          <main className="min-h-screen bg-pattern bg-gray-100 py-8 px-4 ">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md overflow-hidden ">
              <div className="p-6 ">

                <div className="relative mb-8 text-primary text-center">
                  <h1 className="text-2xl font-bold">Trata-se de {numeroProcesso && `(${numeroProcesso})`}</h1>
                  <div className="absolute top-0 right-0 h-full flex items-center space-x-4">
                    <Home onClick={() => navigate('/telaInicial')} className='cursor-pointer text-tribunal-blue' size={24}/>
                    <Save className='cursor-pointer text-tribunal-blue' size={24}/>
                    <CircleArrowLeft onClick={() => navigate('/MunicipioEResponsaveis')} className='cursor-pointer text-tribunal-blue' size={26}/>
                    {/* ArrowRight might navigate to the next step if there is one */}
                    {/* <CircleArrowRight onClick={() => navigate('/ProximaEtapa')} className='cursor-pointer text-tribunal-blue' size={26}/> */}
                  </div>
                </div>
              
                <div className="text-gray-700 flex flex-wrap gap-6 mb-8">

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fixacao"
                      checked={doQueSeTrata.includes("fixacao")}
                      onCheckedChange={() => handleTratamentoCheckboxChange("fixacao")}
                    />
                    <Label htmlFor="fixacao" className="text-sm">Fixação</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="revisaoGeral"
                      checked={doQueSeTrata.includes("revisaoGeral")}
                      onCheckedChange={() => handleTratamentoCheckboxChange("revisaoGeral")}
                    />
                    <Label htmlFor="revisaoGeral" className="text-sm">Revisão Geral Anual</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="decimoTerceiro"
                      checked={doQueSeTrata.includes("decimoTerceiro")}
                      onCheckedChange={() => handleTratamentoCheckboxChange("decimoTerceiro")}
                    />
                    <Label htmlFor="decimoTerceiro" className="text-sm">Décimo Terceiro</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ferias"
                      checked={doQueSeTrata.includes("ferias")}
                      onCheckedChange={() => handleTratamentoCheckboxChange("ferias")}
                    />
                    <Label htmlFor="ferias" className="text-sm">Férias</Label>
                  </div>

                </div>

                <div className="text-gray-700 mb-8">
                  <h2 className="mb-2 font-medium text-sm">Número de Habitantes no município de {municipio?.nome || '...'}</h2>
                  <Input
                    type="text" 
                    value={formatHabitantes(numeroHabitantes)} 
                    onChange={handleHabitantesChange} 
                    className="border-2 border-gray-300 h-12 w-32"
                    placeholder="0"
                  />
                </div>

                <div className="text-gray-700 mb-8">
                  <h2 className="mb-2 font-medium text-sm">Lista resumida das Leis acerca da política inflacionária do município {municipio?.nome || '...'}:</h2>
                  <div className="border border-gray-300 rounded-md text-sm">
                    {leis.length > 0 ? (
                      leis.map((lei, index) => (
                        <div key={index} className={` p-4 flex justify-between items-center ${index !== 0 ? 'border-t border-gray-300' : ''}`}>
                          <span>{lei}</span>
                          {/* Add button might be implemented later */}
                          {/* <button className="text-primary hover:text-primary/80">
                            <Plus className="h-5 w-5" />
                          </button> */}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-gray-500 italic">Nenhuma lei inflacionária cadastrada.</div>
                    )}
                    {/* "Visualizar lista completa" */}
                    {/* <div className="p-4 border-t border-gray-300 flex items-center text-sm">
                      <button className="flex items-center space-x-2 text-primary hover:text-primary/80">
                        <Eye className="h-5 w-5" />
                        <span className="font-medium">visualizar lista completa</span>
                      </button>
                    </div> */}
                  </div>
                </div>

                {/* Leis COLARE section - Updated */}
                <div className="text-gray-700 mb-8 text-sm">
                  <h2 className="mb-2 font-medium">Lista resumida das Leis específicas (cadastradas no COLARE) do município {municipio?.nome || '...'}:</h2>
                  {/* Scrollable div */}
                  <div className="border border-gray-300 rounded-md h-64 overflow-y-auto"> {/* Added height and scroll */}
                    {isLoadingLeis ? (
                      <div className="p-4 text-gray-500 italic">Carregando leis do COLARE...</div>
                    ) : fetchError ? (
                       <div className="p-4 text-red-600 italic">{fetchError}</div>
                    ) : fetchedLeisColare.length > 0 ? (
                      fetchedLeisColare.map((lei) => {
                        const isIncluded = includedLawIds.includes(lei.idEnvioColare);
                        return (
                          <div
                            key={lei.idEnvioColare} // Use unique ID as key
                            className={`p-4 flex justify-between items-center border-t border-gray-300 first:border-t-0 ${isIncluded ? 'bg-green-100' : ''}`} // Conditional background
                          >
                            <span className="flex-1 pr-4">{formatLeiColare(lei)}</span> {/* Formatted law text */}
                            <button
                              className={`text-primary hover:text-primary/80 p-1 rounded ${isIncluded ? 'opacity-50 cursor-not-allowed' : ''}`}
                              onClick={() => handleAddLeiColare(lei)}
                              disabled={isIncluded} // Disable button if already included
                              aria-label={`Incluir lei ${lei.numeroNorma}/${lei.anoNorma % 100}`}
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-gray-500 italic">Nenhuma lei específica (COLARE) encontrada para este município.</div>
                    )}
                  </div>
                  {/* "Visualizar lista completa" button and Dialog */}
                  {fetchedLeisColare.length > 0 && (
                     <Dialog open={isLeisModalOpen} onOpenChange={setIsLeisModalOpen}>
                       <DialogTrigger asChild>
                         <div className="pt-4 flex items-center text-sm">
                           <button
                             className="flex items-center space-x-2 text-primary hover:text-primary/80">
                             <Eye className="h-5 w-5" />
                             <span className="font-medium">Visualizar lista completa incluída</span>
                           </button>
                         </div>
                       </DialogTrigger>
                       <DialogContent className="sm:max-w-[600px] bg-white"> {/* Adjust width as needed */}
                         <DialogHeader>
                           <DialogTitle className="text-center text-lg font-semibold text-gray-800">Leis Incluídas</DialogTitle>
                           {/* Optional: Add description if needed */}
                           {/* <DialogDescription>Lista das leis do COLARE adicionadas ao contexto.</DialogDescription> */}
                         </DialogHeader>
                          <div className="py-4 max-h-[400px] overflow-y-auto"> {/* Scrollable content area */}
                            {leisColare.length > 0 ? (
                              <ul className="space-y-2">
                                {leisColare.map((lei) => ( // Use lei.id for key, lei.text for display
                                  <li key={lei.id} className="flex justify-between items-center text-sm text-gray-700 border-b border-gray-200 pb-2 last:border-b-0">
                                    <span className="flex-1 pr-2">{lei.text}</span> {/* Display the text */}
                                    <button
                                      onClick={() => handleRemoveLeiColare(lei.id)}
                                      className="text-red-500 hover:text-red-700 p-1 rounded"
                                      aria-label={`Remover lei ${lei.text.substring(0, 20)}...`} // Add accessible label
                                    >
                                      <Trash2 className="h-4 w-4" /> {/* Use Trash2 icon */}
                                    </button>
                                  </li>
                                ))}
                             </ul>
                           ) : (
                              <p className="text-sm text-gray-500 italic text-center">Nenhuma lei foi incluída ainda.</p>
                            )}
                          </div>
                          {/* Removed the explicit DialogClose button below, as DialogContent provides one by default */}
                          {/* Optional Footer with a close button
                          <DialogFooter>
                            <DialogClose asChild>
                             <Button type="button" variant="secondary">Fechar</Button>
                           </DialogClose>
                         </DialogFooter>
                         */}
                       </DialogContent>
                     </Dialog>
                  )}
                 </div>
               </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TratamentoLeis;
