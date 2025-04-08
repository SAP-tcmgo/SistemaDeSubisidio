import React, { useState, ChangeEvent, useEffect } from 'react';
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
import { toast } from '../../components/ui/use-toast';
import axios from 'axios';
import { db } from '../../firebase'; // Import Firestore instance
import { collection, addDoc, serverTimestamp, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'; // Import Firestore functions

// Define the structure for the inflationary policy law
interface LeiPoliticaInflacionaria {
  id?: string; // Firestore document ID
  municipioNome: string; // Store municipio name for easier display
  municipioCodigo: string; // Store municipio code for potential filtering
  numeroLeiAno: string;
  artigosIncisosParagrafos: string;
  teorArtigo: string;
  indice: string;
  mesDataBase: string;
  entradaEmVigor: string; // Consider storing as Firestore Timestamp or ISO string if date operations are needed
  criadoEm?: any; // Firestore server timestamp
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
    leis, // Use this from context to store included law IDs
    setLeis, // Setter for included law IDs
    leisColare, // Keep this as requested, but won't be used here
    setLeisColare, // Keep this as requested
    numeroProcesso
  } = useDados();

  // State for inflationary policy laws fetched from Firestore
  const [leisInflacionarias, setLeisInflacionarias] = useState<LeiPoliticaInflacionaria[]>([]);
  const [isLoadingLeisInflacionarias, setIsLoadingLeisInflacionarias] = useState<boolean>(false);
  const [fetchErrorLeisInflacionarias, setFetchErrorLeisInflacionarias] = useState<string | null>(null);

  // State for the new/edit law dialog
  const [isLeiDialogOpen, setIsLeiDialogOpen] = useState<boolean>(false);
  const [leiAtual, setLeiAtual] = useState<Partial<LeiPoliticaInflacionaria>>({}); // For create/edit form
  const [isEditing, setIsEditing] = useState<boolean>(false); // To differentiate between add and edit mode

  // State for the view all laws dialog (shows ALL registered laws)
  const [isViewAllDialogOpen, setIsViewAllDialogOpen] = useState<boolean>(false);
  // State for the new dialog showing ONLY included laws
  const [isViewIncludedDialogOpen, setIsViewIncludedDialogOpen] = useState<boolean>(false);

  // Fetch population (existing useEffect - keep as is)
  useEffect(() => {
    const ApiPopulacao = async () => {
      if (municipio && municipio.codigo) {
        try {
          const response = await axios.get(
            `https://apisidra.ibge.gov.br/values/t/4714/n6/${municipio.codigo}/v/93/p/2022`
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
  }, [municipio?.codigo, setNumeroHabitantes, municipio]);

  // Fetch Inflationary Laws from Firestore
  const fetchLeisInflacionarias = async () => {
    if (!municipio?.codigo) {
      setLeisInflacionarias([]);
      return;
    }
    setIsLoadingLeisInflacionarias(true);
    setFetchErrorLeisInflacionarias(null);
    try {
      const leisCollectionRef = collection(db, "LeisPolicitaInflacionarias");
      // TODO: Add query(leisCollectionRef, where("municipioCodigo", "==", municipio.codigo)) if needed
      const querySnapshot = await getDocs(leisCollectionRef);
      const leisData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as LeiPoliticaInflacionaria))
        .filter(lei => lei.municipioCodigo === municipio.codigo); // Filter client-side for now
      setLeisInflacionarias(leisData);
    } catch (error) {
      console.error("Erro ao buscar leis inflacionárias:", error);
      setFetchErrorLeisInflacionarias("Falha ao buscar leis inflacionárias.");
      setLeisInflacionarias([]);
    } finally {
      setIsLoadingLeisInflacionarias(false);
    }
  };

  useEffect(() => {
    fetchLeisInflacionarias();
  }, [municipio?.codigo]); // Fetch when municipio changes

  // --- Form Handling for New/Edit Law ---
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLeiAtual(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setLeiAtual(prev => ({ ...prev, [name]: value }));
  };

  const handleAbrirDialogNovaLei = () => {
    setIsEditing(false);
    setLeiAtual({}); // Clear form for new entry
    setIsLeiDialogOpen(true);
  };

  const handleAbrirDialogEditarLei = (lei: LeiPoliticaInflacionaria) => {
    setIsEditing(true);
    setLeiAtual(lei); // Load existing data into form
    setIsLeiDialogOpen(true);
  };

  // --- Save/Update Law Function ---
  const handleSalvarLeiInflacionaria = async () => {
    if (!municipio) {
      toast({ title: "Erro", description: "Município não selecionado.", variant: "destructive" });
      return;
    }

    // Basic validation (can be expanded)
    if (!leiAtual.numeroLeiAno || !leiAtual.teorArtigo) {
       toast({ title: "Erro", description: "Preencha os campos obrigatórios (Número da Lei/Ano, Teor do Artigo).", variant: "destructive" });
       return;
    }

    const dadosLei: Omit<LeiPoliticaInflacionaria, 'id' | 'criadoEm'> = {
      municipioNome: municipio.nome,
      municipioCodigo: municipio.codigo,
      numeroLeiAno: leiAtual.numeroLeiAno || '',
      artigosIncisosParagrafos: leiAtual.artigosIncisosParagrafos || '',
      teorArtigo: leiAtual.teorArtigo || '',
      indice: leiAtual.indice || '',
      mesDataBase: leiAtual.mesDataBase || '',
      entradaEmVigor: leiAtual.entradaEmVigor || '',
    };

    try {
      const leisCollectionRef = collection(db, "LeisPoliticaInflacionarias");
      if (isEditing && leiAtual.id) {
        // Update existing document
        const leiDocRef = doc(db, "LeisPoliticaInflacionarias", leiAtual.id);
        await updateDoc(leiDocRef, dadosLei);
        toast({ title: "Sucesso", description: "Lei atualizada com sucesso!" });
      } else {
        // Add new document
        await addDoc(leisCollectionRef, {
          ...dadosLei,
          criadoEm: serverTimestamp() // Add creation timestamp
        });
        toast({ title: "Sucesso", description: "Nova lei cadastrada com sucesso!" });
      }
      setIsLeiDialogOpen(false); // Close dialog
      fetchLeisInflacionarias(); // Refresh the list
    } catch (error) {
      console.error("Erro ao salvar lei:", error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: "Erro", description: `Falha ao salvar lei: ${errorMessage}`, variant: "destructive" });
    }
  };

   // --- Delete Law Function ---
   const handleDeletarLei = async (id: string) => {
     if (!window.confirm("Tem certeza que deseja excluir esta lei?")) {
       return;
     }
     try {
       const leiDocRef = doc(db, "LeisPoliticaInflacionarias", id);
       await deleteDoc(leiDocRef);
       toast({ title: "Sucesso", description: "Lei excluída com sucesso!" });
       fetchLeisInflacionarias();
     } catch (error) {
       console.error("Erro ao excluir lei:", error);
       const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
       toast({ title: "Erro", description: `Falha ao excluir lei: ${errorMessage}`, variant: "destructive" });
    }
  };

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
     handleAbrirDialogEditarLei(lei); // Open the edit dialog
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
    setFetchErrorLeisInflacionarias(null);
    setIsLeiDialogOpen(false); // Close dialog if open
    setLeiAtual({});
    setIsEditing(false);

    toast({
      title: "Tela Limpa",
      description: "Campos da tela redefinidos.",
    });
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
                      onCheckedChange={() => handleTratamentoCheckboxChange("decimoTerceiro")}
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
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="font-medium text-sm">Leis acerca da política inflacionária do município {municipio?.nome || '...'}:</h2>
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
                                   .filter(lei => lei.id && leis.includes(lei.id))
                                   .map((leiIncluida) => (
                                     <div key={leiIncluida.id} className="border border-gray-300 p-2 rounded mb-2 flex justify-between items-center text-sm">
                                       <div>
                                         <p className="font-medium">{leiIncluida.numeroLeiAno}</p>
                                         <p className="text-gray-600 truncate">{leiIncluida.teorArtigo.substring(0, 80)}{leiIncluida.teorArtigo.length > 80 ? '...' : ''}</p>
                                       </div>
                                       <Button
                                         variant="ghost"
                                         size="sm"
                                         onClick={() => leiIncluida.id && handleToggleIncluirLei(leiIncluida.id)}
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

                      {/* Dialog Trigger/Button for Cadastrar Lei (remains the same) */}
                      <Button onClick={handleAbrirDialogNovaLei} size="sm" className="bg-secondary hover:bg-secondary/90 text-white">
                        <Plus className="h-4 w-4 mt-[3px]" />
                        Cadastrar Lei
                      </Button>

                      {/* Hidden Dialog for Viewing ALL Registered Laws (triggered from Cadastrar Lei dialog) */}
                      <Dialog open={isViewAllDialogOpen} onOpenChange={setIsViewAllDialogOpen}>
                        {/* No visible trigger here, opened programmatically */}
                        <DialogContent className="sm:max-w-[900px] bg-white max-h-[80vh] flex flex-col">
                          <DialogHeader>
                            <DialogTitle className="text-lg font-semibold text-gray-800 text-center font-bold">
                              Todas Leis Cadastradas - {municipio?.nome || 'Município'}
                            </DialogTitle>
                            <DialogDescription className="text-center">
                              Lista de todas as leis cadastradas para este município.
                            </DialogDescription>
                          </DialogHeader>
                          {/* Added Box Styling Wrapper */}
                          <div className="py-4 overflow-y-auto flex-grow border border-gray-300 rounded-md p-4">
                            {isLoadingLeisInflacionarias ? (
                              <p className="text-center text-gray-500">Carregando leis...</p>
                            ) : fetchErrorLeisInflacionarias ? (
                              <p className="text-center text-red-500">{fetchErrorLeisInflacionarias}</p>
                            ) : leisInflacionarias.length > 0 ? (
                              <ScrollArea className="h-[450px] w-full"> {/* Use ScrollArea instead of Accordion */}
                                 {leisInflacionarias.map((lei) => {
                                  const isIncluded = lei.id ? leis.includes(lei.id) : false;
                                  return (
                                    <div key={lei.id || lei.numeroLeiAno} className={`border border-gray-300 rounded-md p-3 mb-2 flex justify-between items-center text-sm ${isIncluded ? 'bg-green-100' : ''}`}>
                                      <div className="flex-1 mr-4 overflow-hidden">
                                        <p className="font-medium truncate">{lei.numeroLeiAno}</p>
                                        <p className="text-gray-600 truncate">{lei.teorArtigo}</p>
                                      </div>
                                      <div className="flex space-x-2 items-center">
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-7 w-7"
                                          onClick={(e) => handleEditFromViewAll(lei, e)}
                                          title="Editar Lei"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 text-red-500 hover:text-red-700"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (lei.id) handleDeletarLei(lei.id);
                                          }}
                                          title="Excluir Lei"
                                          disabled={!lei.id}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={`h-7 w-7 ${isIncluded ? 'text-red-500 hover:text-red-700' : 'text-primary hover:text-primary/80'}`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (lei.id) handleToggleIncluirLei(lei.id);
                                          }}
                                          title={isIncluded ? "Remover do Processo" : "Incluir no Processo"}
                                          disabled={!lei.id}
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
                    ) : fetchErrorLeisInflacionarias ? (
                      <div className="text-red-600 italic">{fetchErrorLeisInflacionarias}</div>
                    ) : leisInflacionarias.length > 0 ? (
                      <ScrollArea className="h-[200px] w-full"> {/* Added ScrollArea */}
                        {leisInflacionarias.map((lei) => {
                          const isIncluded = lei.id ? leis.includes(lei.id) : false;
                          return (
                            // Box styling for each item
                            <div key={lei.id || lei.numeroLeiAno} className={`border border-gray-300 rounded-md p-3 mb-2 flex justify-between items-center ${isIncluded ? 'bg-green-100' : ''}`}>
                              <span className="flex-1 pr-4 overflow-hidden">
                                <p className="font-medium truncate">{lei.numeroLeiAno}</p>
                                <p className="text-gray-600 truncate">{lei.teorArtigo.substring(0, 80)}{lei.teorArtigo.length > 80 ? '...' : ''}</p>
                              </span>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleAbrirDialogEditarLei(lei)} title="Editar Lei">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => lei.id && handleDeletarLei(lei.id)} title="Excluir Lei">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                {/* Add/Remove Button */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-7 w-7 ${isIncluded ? 'text-red-500 hover:text-red-700' : 'text-primary hover:text-primary/80'}`}
                                  onClick={() => lei.id && handleToggleIncluirLei(lei.id)}
                                  title={isIncluded ? "Remover do Processo" : "Incluir no Processo"}
                                  disabled={!lei.id}
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

                <Dialog open={isLeiDialogOpen} onOpenChange={setIsLeiDialogOpen}>
                  <DialogContent className="sm:max-w-[800px] bg-white dialog-content-min-height">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-semibold text-gray-800 text-center font-bold mb-[-15px]">
                        {isEditing ? 'Editar Lei da Política Inflacionária' : 'Cadastrar Nova Lei'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="municipioNome">Município</Label>
                        <Input id="municipioNome" value={municipio?.nome || 'N/A'} disabled className="mt-1 bg-gray-100" />
                      </div>
                      <div>
                        <Label htmlFor="numeroLeiAno">Número da Lei/Ano <span className="text-red-500">*</span></Label>
                        <Input id="numeroLeiAno" name="numeroLeiAno" value={leiAtual.numeroLeiAno || ''} onChange={handleInputChange} className="mt-1" placeholder="Ex: 1234/24" />
                      </div>
                      <div className="md:col-span-3">
                        <Label htmlFor="artigosIncisosParagrafos">Artigos, Incisos e Parágrafos</Label>
                        <Textarea id="artigosIncisosParagrafos" name="artigosIncisosParagrafos" value={leiAtual.artigosIncisosParagrafos || ''} onChange={handleInputChange} className="mt-1" placeholder="Iniciar com o nº do artigo..." />
                      </div>
                      <div className="md:col-span-3">
                        <Label htmlFor="teorArtigo">Teor do artigo <span className="text-red-500">*</span></Label>
                        <Textarea id="teorArtigo" name="teorArtigo" value={leiAtual.teorArtigo || ''} onChange={handleInputChange} className="mt-1"/>
                      </div>
                      <div>
                        <Label htmlFor="indice">Índice</Label>
                        <Input id="indice" name="indice" value={leiAtual.indice || ''} onChange={handleInputChange} className="mt-1" placeholder="Ex: INPC" />
                      </div>
                      <div>
                        <Label htmlFor="mesDataBaseTrigger">Mês da Data Base Municipal</Label>
                        <Select name="mesDataBase" value={leiAtual.mesDataBase || ''} onValueChange={(value) => handleSelectChange('mesDataBase', value)}>
                          <SelectTrigger id="mesDataBaseTrigger" className="mt-1">
                            <SelectValue placeholder="Selecione o mês" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="janeiro">Janeiro</SelectItem>
                            <SelectItem value="fevereiro">Fevereiro</SelectItem>
                            <SelectItem value="marco">Março</SelectItem>
                            <SelectItem value="abril">Abril</SelectItem>
                            <SelectItem value="maio">Maio</SelectItem>
                            <SelectItem value="junho">Junho</SelectItem>
                            <SelectItem value="julho">Julho</SelectItem>
                            <SelectItem value="agosto">Agosto</SelectItem>
                            <SelectItem value="setembro">Setembro</SelectItem>
                            <SelectItem value="outubro">Outubro</SelectItem>
                            <SelectItem value="novembro">Novembro</SelectItem>
                            <SelectItem value="dezembro">Dezembro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="entradaEmVigor">Entrada em vigor da Lei</Label>
                        <Input id="entradaEmVigor" name="entradaEmVigor" type="date" value={leiAtual.entradaEmVigor || ''} onChange={handleInputChange} className="mt-1" placeholder="DD/MM/AAAA" />
                      </div>
                    </div>
                    <DialogFooter style={{ backgroundColor: 'white', borderTop: '1px solid #ccc', padding: '10px' }}>
                     <div className="flex justify-start w-full"> 
                        <Button type="button" variant="outline" onClick={() => setIsViewAllDialogOpen(true)} className="text-primary border-primary hover:bg-primary/10">
                            <Eye className="h-4 w-4 mr-1" />
                            Visualizar Todas Cadastradas
                        </Button>
                      </div>
                      <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                      </DialogClose>
                      <Button type="button" onClick={handleSalvarLeiInflacionaria} className="bg-primary hover:bg-primary/90 text-white ml-2" style={{ backgroundColor: '#004B8D', color: 'white' }}>
                        {isEditing ? 'Salvar Alterações' : 'Cadastrar Lei'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};


export default TratamentoLeis;
