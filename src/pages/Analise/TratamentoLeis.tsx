import React, { useState, ChangeEvent, useEffect } from 'react';
import { useIsAuthenticated, useMsal } from "@azure/msal-react"; // MSAL Hooks
import { InteractionRequiredAuthError } from "@azure/msal-browser"; // MSAL Error
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { Checkbox } from '../../components/ui/checkbox';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea'; // Import Textarea
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select
import { Button } from "@/components/ui/button"; // Import Button
import { Plus, Trash2, Edit, Eye, MinusCircle as RemoveIcon } from 'lucide-react'; // Keep Plus, Trash2, add Edit, Eye, CheckCircle, XCircle
import { useNavigate } from 'react-router-dom';
// Import Dialog components including Footer, Close, and Description
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
// Import Accordion components
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea
import BreadcrumbNav from '../../components/BreadcrumbNav'; // Import the new component
import Icons from '../../components/Icons'; // Import the new Icons component
import '../../styles/AppAnalise.css';
import '../../styles/indexAnalise.css';
import { useDados } from '../../Contexts/DadosContext';
// Removed toast import as it wasn't used for Graph errors
import axios from 'axios'; // Re-added axios for IBGE API call

interface LeiPoliticaInflacionaria {
  ID: string;
  ID_Espelho: string;
  ID_Municipio: string;
  Municipio: string;
  Num_Lei: number;
  Ano_Lei: number;
  Mes_Data_Base: string;
  Indice_Correcao: string;
  Num_Processo: number;
  Ano_Processo: number;
  Data_Inicial: string;
  Data_Final: string;
  Anotacao: string;
  Situacao: string;
  Conclusao: string;
  Historico_Atualizacao: string;
  Criado_por: string;
  Modificado: string;
  Modificado_por: string;
  // Add the SharePoint item ID for potential future use if needed
  SharePointID?: string;
}

const TratamentoLeis: React.FC = () => {
  const navigate = useNavigate();
  const { instance, accounts } = useMsal(); // MSAL instance and accounts
  const isAuthenticated = useIsAuthenticated(); // Authentication status

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null); // State for authenticated user
  const [graphError, setGraphError] = useState<string | null>(null); // State for Graph API errors
  const {
    municipio,
    numeroHabitantes,
    setNumeroHabitantes,
    doQueSeTrata,
    setDoQueSeTrata,
    leis, // Use this from context to store included law IDs
    setLeis, // Setter for included law IDs
    leisColare, // Keep this as requested, but won't be used here
    setLeisColare, // Keep this as requested
    numeroProcesso
  } = useDados();

  // State for inflationary policy laws fetched from SharePoint via Graph API
  const [leisInflacionarias, setLeisInflacionarias] = useState<LeiPoliticaInflacionaria[]>([]);
  const [isLoadingLeisInflacionarias, setIsLoadingLeisInflacionarias] = useState<boolean>(false);
  // fetchErrorLeisInflacionarias is replaced by graphError for consistency
  // const [fetchErrorLeisInflacionarias, setFetchErrorLeisInflacionarias] = useState<string | null>(null);

  // State for the view all laws dialog (shows ALL registered laws)
  const [isViewAllDialogOpen, setIsViewAllDialogOpen] = useState<boolean>(false);
  // State for the new dialog showing ONLY included laws
  const [isViewIncludedDialogOpen, setIsViewIncludedDialogOpen] = useState<boolean>(false);

  // Fetch population (existing useEffect - keep as is)
  useEffect(() => {
    const ApiPopulacao = async () => {
      if (municipio && municipio.ID_IBGE) { // Use ID_IBGE
        try {
          const response = await axios.get(
            `https://apisidra.ibge.gov.br/values/t/4714/n6/${municipio.ID_IBGE}/v/93/p/2022` // Use ID_IBGE
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

  // Effect to set user based on authentication status and accounts
  useEffect(() => {
    console.log("TratamentoLeis: useEffect (auth change) - isAuthenticated:", isAuthenticated, "accounts:", accounts);
    if (isAuthenticated && accounts.length > 0) {
      setUser(accounts[0]);
      instance.setActiveAccount(accounts[0]); // Set the active account for MSAL
      console.log("TratamentoLeis: Set user from accounts array:", accounts[0]);
    } else {
      setUser(null);
      setLeisInflacionarias([]); // Clear laws if not authenticated
      setGraphError(null); // Clear errors
    }
  }, [isAuthenticated, accounts, instance]);


  // Removed the old fetchLeisInflacionarias function

  // Effect to fetch laws from SharePoint when user is authenticated
  useEffect(() => {
    console.log("TratamentoLeis: useEffect (user change) - user:", user, "isAuthenticated:", isAuthenticated);
    if (user && isAuthenticated) {
      setIsLoadingLeisInflacionarias(true); // Start loading
      setGraphError(null); // Clear previous errors
      setLeisInflacionarias([]); // Clear previous laws

      instance.acquireTokenSilent({
        // Use Sites.ReadWrite.All as requested
        scopes: ["Sites.ReadWrite.All"],
        account: user,
      }).then(async (response) => {
        const accessToken = response.accessToken;
        console.log("TratamentoLeis: Access Token acquired:", accessToken ? "Yes" : "No");
        const siteId = "fbf1f1d0-319e-4e60-b400-bb5d01994fc8";
        const listId = "0b47e57e-7525-434c-b6ac-8392118cba0b"; // Laws list ID
        // Filter by the numerical ID_Municipio field in the laws list, using the ID_Municipio (linking ID) from context
        const municipioFilter = municipio?.ID_Municipio ? `fields/ID_Municipio eq ${municipio.ID_Municipio}` : ''; // Compare numerical field directly using the correct context ID
        const graphEndpoint = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields${municipioFilter ? `&$filter=${municipioFilter}` : ''}`;
        console.log("TratamentoLeis: Graph Endpoint:", graphEndpoint);

        try {
          const graphResponse = await fetch(graphEndpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              // Add header to allow filtering on non-indexed columns (workaround)
              'Prefer': 'HonorNonIndexedQueriesWarningMayFailRandomly'
            },
          });

          console.log("TratamentoLeis: Graph API Response Status:", graphResponse.status);

          if (!graphResponse.ok) {
            let errorDetail = graphResponse.statusText;
            try {
              const errorData = await graphResponse.json();
              errorDetail = errorData?.error?.message || JSON.stringify(errorData);
              console.error("TratamentoLeis: Graph API Error Details:", errorData);
            } catch (e) {
              console.error("TratamentoLeis: Error parsing Graph API error response:", e);
            }
            throw new Error(`Graph API error: ${graphResponse.status} - ${errorDetail}`);
          }

          const data = await graphResponse.json();
          console.log("TratamentoLeis: Raw SharePoint Data:", data);

          // Map SharePoint data to LeiPoliticaInflacionaria interface
          const leisData = (data.value || []).map((item: any) => ({
            ID: item.fields?.ID || '', // Assuming ID is also in fields, adjust if it's top-level item.id
            ID_Espelho: item.fields?.ID_Espelho || '',
            ID_Municipio: item.fields?.ID_Municipio || '',
            Municipio: item.fields?.Municipio || '',
            Num_Lei: item.fields?.Num_Lei || 0,
            Ano_Lei: item.fields?.Ano_Lei || 0,
            Mes_Data_Base: item.fields?.Mes_Data_Base || '',
            Indice_Correcao: item.fields?.Indice_Correcao || '',
            Num_Processo: item.fields?.Num_Processo || 0,
            Ano_Processo: item.fields?.Ano_Processo || 0,
            Data_Inicial: item.fields?.Data_Inicial || '',
            Data_Final: item.fields?.Data_Final || '',
            Anotacao: item.fields?.Anotacao || '',
            Situacao: item.fields?.Situacao || '',
            Conclusao: item.fields?.Conclusao || '',
            Historico_Atualizacao: item.fields?.Historico_Atualizacao || '',
            Criado_por: item.fields?.createdBy?.user?.displayName || '', // Get creator name
            Modificado: item.lastModifiedDateTime || '', // Get last modified date
            Modificado_por: item.lastModifiedBy?.user?.displayName || '', // Get modifier name
            SharePointID: item.id // Store the SharePoint item ID
          })) as LeiPoliticaInflacionaria[];

          console.log("TratamentoLeis: Mapped Leis:", leisData);
          setLeisInflacionarias(leisData);

        } catch (error: any) {
          console.error("TratamentoLeis: Falha ao buscar dados do SharePoint:", error);
          setGraphError(`Falha ao buscar dados do SharePoint: ${error.message}`);
        } finally {
          setIsLoadingLeisInflacionarias(false); // Stop loading
        }
      }).catch((error) => {
        console.error("TratamentoLeis: Error acquiring token silently:", error);
        setGraphError("Falha ao obter token para a API Graph.");
        setIsLoadingLeisInflacionarias(false); // Stop loading on token error
        if (error instanceof InteractionRequiredAuthError) {
          // Fallback to popup if silent token acquisition fails
          console.log("TratamentoLeis: Interaction required, attempting popup.");
          instance.acquireTokenPopup({ scopes: ["Sites.ReadWrite.All"] }).catch(popupError => {
            console.error("TratamentoLeis: Error acquiring token via popup:", popupError);
            setGraphError("Falha ao obter token via popup.");
          });
        }
      });
    } else {
      // Clear laws if user is not authenticated or no user object exists
      setLeisInflacionarias([]);
      setIsLoadingLeisInflacionarias(false); // Ensure loading is stopped
    }
  // Depend on user, isAuthenticated, instance, and municipio.ID_Municipio to refetch when needed
  }, [user, isAuthenticated, instance, municipio?.ID_Municipio]); // Use ID_Municipio (linking ID) in dependency array

  // --- Handler to toggle inclusion of a law in the process ---
  const handleToggleIncluirLei = (leiId: string) => {
    if (!leiId) return; // Safety check

    setLeis(prevLeis => {
      if (prevLeis.includes(leiId)) {
        // Remove the ID if it's already included
        return prevLeis.filter(id => id !== leiId);
      } else {
        // Add the ID if it's not included
        return [...prevLeis, leiId];
      }
    });
  };


   // --- Handler to Edit from View All Dialog ---
   const handleEditFromViewAll = (lei: LeiPoliticaInflacionaria, e: React.MouseEvent) => {
     e.stopPropagation(); // Prevent accordion toggle
     setIsViewAllDialogOpen(false); // Close the view all dialog
   };

  // --- Rest of the component logic (keep toggleSidebar, handleTratamentoCheckboxChange, etc.) ---
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
    // setLeis([]); // No longer using context 'leis' for this list
    // setLeisColare([]); // Keep this reset as requested, though unused here

    // Reset local state for this screen
    setLeisInflacionarias([]); // Clear the fetched laws
    setGraphError(null); // Use the new error state setter
    setIsViewAllDialogOpen(false); // Close dialog if open
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

  // --- Login Handler ---
  const handleLogin = () => {
    console.log("TratamentoLeis: Login button clicked.");
    instance.loginPopup({ scopes: ["Sites.ReadWrite.All"] }).catch(error => { // Use correct scopes
      console.error("TratamentoLeis: Error during login popup:", error);
      setGraphError("Falha ao abrir o popup de login.");
    });
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
          <BreadcrumbNav currentPage="Tratamento Leis" sidebarOpen={sidebarOpen} />

          <main className="min-h-screen bg-pattern bg-gray-100 py-8 px-4 ">
            {isAuthenticated ? ( // Only show content if authenticated
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
                  <h1 className="text-2xl font-bold mt-[-20px]">Trata-se de {numeroProcesso && `(${numeroProcesso})`}</h1>
                </div>
              
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
                      onCheckedChange={() => handleTratamentoCheckboxChange("fixacao")}
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

                <div className="text-gray-700 mb-8">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-medium text-sm">Leis acerca da política inflacionária do município {municipio?.Municipio || '...'}:</h2>
                    <div className="flex space-x-2"> {/* Wrap buttons in a flex container */}
                      {/* Button to view ONLY INCLUDED laws */}
                      <Dialog open={isViewIncludedDialogOpen} onOpenChange={setIsViewIncludedDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-primary/10">
                            <Eye className="h-4 w-4 mt-[3px]" />
                            Visualizar Leis Incluídas ({leis.length}) {/* Show count */}
                          </Button>
                        </DialogTrigger>
                        {/* Dialog Content for INCLUDED Laws */}
                        <DialogContent className="sm:max-w-[700px] bg-white max-h-[80vh] flex flex-col">
                           <DialogHeader>
                             <DialogTitle className="text-lg font-semibold text-gray-800 text-center font-bold">
                               Leis Incluídas no Processo
                             </DialogTitle>
                             <DialogDescription className="text-center">
                               Leis selecionadas para este processo.
                             </DialogDescription>
                           </DialogHeader>
                           <div className="py-4 overflow-y-auto flex-grow border border-gray-300 rounded-md p-4"> {/* Added box styling */}
                             {isLoadingLeisInflacionarias ? (
                               <p className="text-center text-gray-500">Carregando...</p>
                             ) : leis.length > 0 ? (
                               <ScrollArea className="h-[400px] w-full">
                                 {leisInflacionarias
                                   .filter(lei => lei.Num_Lei && leis.includes(String(lei.Num_Lei)))
                                   .map((leiIncluida) => (
                                     <div key={leiIncluida.Num_Lei} className="border border-gray-300 p-2 rounded mb-2 flex justify-between items-center text-sm">
                                       <div>
                                         <p className="font-medium">{leiIncluida.Num_Lei}</p>
                                         <p className="text-gray-600 truncate">{leiIncluida.Anotacao.substring(0, 80)}{leiIncluida.Anotacao.length > 80 ? '...' : ''}</p>
                                       </div>
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         onClick={() => leiIncluida && handleToggleIncluirLei(String(leiIncluida.Num_Lei))}
                                         className="text-red-500 hover:text-red-700"
                                         title="Remover do Processo"
                                       >
                                         <RemoveIcon className="h-4 w-4" />
                                       </Button>
                                     </div>
                                   ))}
                               </ScrollArea>
                             ) : (
                               <p className="text-center text-gray-500">Nenhuma lei incluída neste processo ainda.</p>
                             )}
                           </div>
                           <DialogFooter className="mt-auto pt-4 border-t border-gray-200">
                             <DialogClose asChild>
                               <Button type="button" variant="outline">Fechar</Button>
                             </DialogClose>
                           </DialogFooter>
                         </DialogContent>
                      </Dialog>

                      {/* Hidden Dialog for Viewing ALL Registered Laws (triggered from Cadastrar Lei dialog) */}
                      <Dialog open={isViewAllDialogOpen} onOpenChange={setIsViewAllDialogOpen}>
                        {/* No visible trigger here, opened programmatically */}
                        <DialogContent className="sm:max-w-[900px] bg-white max-h-[80vh] flex flex-col">
                          <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-gray-800 text-center font-bold">
                              Todas Leis Cadastradas - {municipio?.Municipio || 'Município'}
                            </DialogTitle>
                            <DialogDescription className="text-center">
                              Lista de todas as leis cadastradas para este município.
                            </DialogDescription>
                          </DialogHeader>
                          {/* Added Box Styling Wrapper */}
                          <div className="py-4 overflow-y-auto flex-grow border border-gray-300 rounded-md p-4">
                            {isLoadingLeisInflacionarias ? (
                              <p className="text-center text-gray-500">Carregando leis...</p>
                            ) : graphError ? ( // Use the new error state variable
                              <p className="text-center text-red-500">{graphError}</p> // Use the new error state variable
                            ) : leisInflacionarias.length > 0 ? (
                              <ScrollArea className="h-[450px] w-full"> {/* Use ScrollArea instead of Accordion */}
                                 {leisInflacionarias.map((lei) => {
                                  const isIncluded = lei.Num_Lei ? leis.includes(String(lei.Num_Lei)) : false;
                                  return (
                                    <div key={lei.Num_Lei} className={`border border-gray-300 rounded-md p-3 mb-2 flex justify-between items-center text-sm ${isIncluded ? 'bg-green-100' : ''}`}>
                                      <div className="flex-1 mr-4 overflow-hidden">
                                        <p className="font-medium truncate">{lei.Num_Lei}</p>
                                        <p className="text-gray-600 truncate">{lei.Anotacao}</p>
                                      </div>
                                      <div className="flex space-x-2 items-center">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={`h-7 w-7 ${isIncluded ? 'text-red-500 hover:text-red-700' : 'text-primary hover:text-primary/80'}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (lei.Num_Lei) handleToggleIncluirLei(String(lei.Num_Lei));
                                          }}
                                          title={isIncluded ? "Remover do Processo" : "Incluir no Processo"}
                                        >
                                          {isIncluded ? <RemoveIcon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </ScrollArea>
                            ) : (
                              <p className="text-center text-gray-500">Nenhuma lei inflacionária cadastrada para este município.</p>
                            )}
                          </div>
                          <DialogFooter className="mt-auto pt-4 border-t border-gray-200">
                            <DialogClose asChild>
                              <Button type="button" variant="outline">Fechar</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  {/* Main List Displaying Laws - Now with Add/Remove */}
                  <div className="border border-gray-300 rounded-md text-sm min-h-[100px] p-4"> {/* Added padding */}
                    {isLoadingLeisInflacionarias ? (
                      <div className="text-gray-500 italic">Carregando leis...</div>
                    ) : graphError ? ( // Use the new error state variable
                      <div className="text-red-600 italic">{graphError}</div> // Use the new error state variable
                    ) : leisInflacionarias.length > 0 ? (
                      <ScrollArea className="h-[200px] w-full"> {/* Added ScrollArea */}
                        {leisInflacionarias.map((lei) => {
                          const isIncluded = lei.Num_Lei ? leis.includes(String(lei.Num_Lei)) : false;
                          return (
                            // Box styling for each item
                            <div key={lei.Num_Lei} className={`border border-gray-300 rounded-md p-3 mb-2 flex justify-between items-center ${isIncluded ? 'bg-green-100' : ''}`}>
                              <span className="flex-1 pr-4 overflow-hidden">
                                <p className="font-medium truncate">{lei.Num_Lei}</p>
                                <p className="text-gray-600 truncate">{lei.Anotacao.substring(0, 80)}{lei.Anotacao.length > 80 ? '...' : ''}</p>
                              </span>
                              <div className="flex space-x-2">
                                {/* Add/Remove Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-7 w-7 ${isIncluded ? 'text-red-500 hover:text-red-700' : 'text-primary hover:text-primary/80'}`}
                                  onClick={() => lei && handleToggleIncluirLei(String(lei.Num_Lei))}
                                  title={isIncluded ? "Remover do Processo" : "Incluir no Processo"}
                                >
                                  {isIncluded ? <RemoveIcon className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </ScrollArea>
                    ) : (
                      <div className="text-gray-500 italic">Nenhuma lei inflacionária cadastrada para este município.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : ( // Show login prompt if not authenticated
              <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md overflow-hidden p-6 text-center">
                <h2 className="text-xl font-semibold mb-4">Autenticação Necessária</h2>
                <p className="mb-6">Por favor, faça login com sua conta Microsoft para carregar as leis do SharePoint.</p>
                {graphError && <p className="text-red-500 mb-4">Erro: {graphError}</p>}
                <Button onClick={handleLogin}>
                  Login com Microsoft
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default TratamentoLeis;
