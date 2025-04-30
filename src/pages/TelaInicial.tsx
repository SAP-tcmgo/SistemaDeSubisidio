import { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import WelcomeSection from '../components/WelcomeSection';
import '../styles/AppConfiguracoesDashboard.css';
import '../styles/indexConfiguracoesDashboard.css';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa'; // Remove FaEdit, FaStickyNote (não usados)
import { useDados } from '../Contexts/DadosContext';
import { useToast } from "@/components/ui/use-toast"; // Importar useToast

const TelaInicial = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [processoInput, setProcessoInput] = useState(''); // Estado para o número do processo inserido
  // Estado para controlar a visualização (processo analisado vs. não analisado)
  const [isProcessoAnalisado, setIsProcessoAnalisado] = useState(false);
  // Hook do contexto para definir o número do processo e carregar dados da análise
  const { setNumeroProcesso, loadAnaliseData } = useDados();
  const navigate = useNavigate(); // Hook para navegação programática
  const { toast } = useToast(); // Hook para exibir notificações

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProcessoInput(event.target.value);
    setProcessoInput(event.target.value); // Atualiza o estado com o valor do input
  };

  // Valida e navega para a tela de análise inicial (Município e Responsáveis)
  const handleNavigationMunicipio = async () => {
    if (processoInput.trim()) { // Verifica se o input não está vazio (removendo espaços extras)
      setNumeroProcesso(processoInput.trim()); // Define o número do processo no contexto
      await loadAnaliseData(processoInput.trim()); // Carrega dados da análise do Firebase (se houver)
      navigate(`/MunicipioEResponsaveis?NrProcesso=${processoInput.trim()}`); // Navega para a tela
    } else {
      // Exibe uma notificação se o campo estiver vazio
      toast({
        title: "Campo Vazio",
        description: "Por favor, insira o número do processo.",
        variant: "destructive",
      });
      console.warn("Número do processo não inserido.");
    }
  };

  // Valida e navega para a tela de edição/visualização pós-acórdão
  const handleNavigationEditar = async () => {
    if (processoInput.trim()) {
      setNumeroProcesso(processoInput.trim());
      // Considerar se loadAnaliseData é necessário aqui também
      // await loadAnaliseData(processoInput.trim()); // Descomente se necessário carregar dados antes
      navigate(`/PosAcordao?NrProcesso=${processoInput.trim()}`);
    } else {
      toast({
        title: "Campo Vazio",
        description: "Por favor, insira o número do processo para editar/visualizar.",
        variant: "destructive",
      });
      console.warn("Número do processo não inserido para edição.");
    }
  };

  // Navega para a tela de Consulta de Anotações (não depende do número do processo)
  const handleNavigationConsultaAnotacao = () => {
    navigate(`/ConsultaAnotacao`);
  };

  // Navega para a tela de Cadastro de Administrador
  const handleNavigationCadADM = () => {
    navigate(`/CadastroADM`);
  };

  // Alterna a visualização entre os botões para processo analisado e não analisado
  const handleToggleAnalisado = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Previne o comportamento padrão do link (não recarregar a página)
    setIsProcessoAnalisado(!isProcessoAnalisado); // Inverte o estado
  };

  // Função para abrir/fechar a sidebar

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="dashboard-theme">
      <div className="min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <Header toggleSidebar={toggleSidebar} />

          <main className="p-4 md:p-6">
            
            <WelcomeSection />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center justify-center mx-auto !important"
            >
              {/* Card principal para interação com processos */}
              <div className="tribunal-card w-full max-w-[800px] mx-auto"> {/* Centraliza e limita largura */}
                <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Processos</h2>
                <div className="flex flex-col md:flex-row"> {/* Layout flexível */}
                  {/* Seção de Input do Processo */}
                  <div className="w-full md:w-1/2 md:pr-4 mb-4 md:mb-0">
                    <div className="mb-4 relative">
                      <label htmlFor="processoInput" className="sr-only">Número do Processo</label> {/* Label para acessibilidade */}
                      <input
                        id="processoInput"
                        type="text"
                        placeholder="Número do Processo (Ex: nnnnn/nn)"
                        value={processoInput}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 pr-10" // Adiciona padding à direita para o ícone
                      />
                      {/* Ícone de busca dentro do input */}
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <FaSearch className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                    {/* Link para alternar a visualização */}
                    <a
                      href="#"
                      onClick={handleToggleAnalisado}
                      className="mt-1 block text-sm text-blue-600 hover:underline text-center md:text-left"
                    >
                      {isProcessoAnalisado
                        ? 'Ver opções para processo NÃO analisado'
                        : 'Ver opções para processo JÁ analisado'}
                    </a>
                  </div>
                  {/* Seção de Botões de Ação */}
                  <div className="w-full md:w-1/2 md:pl-4">
                    {/* Botões exibidos condicionalmente */}
                    <div className="space-y-3">
                      {isProcessoAnalisado ? (
                        // Botões para "Processo JÁ analisado"
                        <>
                          <button
                            className="tribunal-button w-full justify-center"
                            onClick={handleNavigationEditar} // Navega para edição/visualização pós-acórdão
                            disabled={!processoInput.trim()} // Desabilita se input vazio
                          >
                            Editar
                          </button>
                          <button
                            className="tribunal-button-secondary w-full justify-center"
                            onClick={handleNavigationConsultaAnotacao} // Navega para consulta geral
                          >
                            Anotação na Planilha
                            </button>
                        </>
                      ) : (
                        // Botões para "Processo NÃO analisado"
                        <>
                          <button
                            className="tribunal-button w-full justify-center"
                            onClick={handleNavigationMunicipio} // Navega para iniciar análise
                            disabled={!processoInput.trim()} // Desabilita se input vazio
                          >
                            Iniciar
                          </button>
                          <button
                            className="tribunal-button w-full justify-center"
                            onClick={handleNavigationMunicipio}
                          >
                            Consultar
                          </button>
                          <button
                            className="bg-white border border-gray-200 text-gray-700 font-medium py-2 px-6 rounded-md w-full transition-all duration-300 hover:bg-gray-50"
                            onClick={handleNavigationCadADM}
                          >
                            Administrador
                          </button>
                          <button
                            className="tribunal-button-secondary w-full justify-center"
                            onClick={handleNavigationConsultaAnotacao} 
                          >
                            Anotação de Subsídios
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Rodapé */}
            <footer className="mt-12 text-center text-gray-500 text-sm py-4 border-t">
              <p>Secretaria de Atos de Pessoal &copy; {new Date().getFullYear()}</p> {/* Ano dinâmico */}
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TelaInicial;
