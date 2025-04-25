import { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import WelcomeSection from '../components/WelcomeSection';
import '../styles/AppConfiguracoesDashboard.css';
import '../styles/indexConfiguracoesDashboard.css';
import { motion } from 'framer-motion';
import { FaSearch, FaEdit, FaStickyNote } from 'react-icons/fa'; // Added FaEdit, FaStickyNote
import { useDados } from '../Contexts/DadosContext';

const TelaInicial = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [processoInput, setProcessoInput] = useState('');
  const [isProcessoAnalisado, setIsProcessoAnalisado] = useState(false); // State for analyzed process view
  const { setNumeroProcesso, loadAnaliseData } = useDados();
  const navigate = useNavigate();

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setProcessoInput(event.target.value);
  };

  const handleNavigationMunicipio = async () => {
    if (processoInput) {
      setNumeroProcesso(processoInput); // Set the process number in context
      await loadAnaliseData(processoInput); // Load data from Firebase
      navigate(`/MunicipioEResponsaveis?NrProcesso=${processoInput}`); // Navigate
    } else {
      // Optionally handle the case where the input is empty
      console.warn("Número do processo não inserido.");
      // You might want to show a message to the user here
    }
  };

  // Navigate to PosAcordao for editing analyzed process
  const handleNavigationEditar = () => {
    if (processoInput) {
      setNumeroProcesso(processoInput);
      // Assuming PosAcordao also needs the process number, maybe load data too?
      // await loadAnaliseData(processoInput); // Uncomment if needed
      navigate(`/PosAcordao?NrProcesso=${processoInput}`);
    } else {
      console.warn("Número do processo não inserido para edição.");
      // Show message to user
    }
  };

  // Placeholder for "Anotação na Planilha" - assuming similar logic to "Anotação de Subsídios" for now
  const handleNavigationAnotacaoPlanilha = () => {
     if (processoInput) {
      setNumeroProcesso(processoInput);
      // Navigate or perform action for annotation
      console.log(`Anotação na planilha para processo: ${processoInput}`);
      // Example navigation if needed: navigate(`/AnotacaoPlanilha?NrProcesso=${processoInput}`);
    } else {
      console.warn("Número do processo não inserido para anotação.");
      // Show message to user
    }
  };


  const handleNavigationCadADM = async () => {
    navigate(`/CadastroADM`);
  };

  // Toggle the view between analyzed and not analyzed process
  const handleToggleAnalisado = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault(); // Prevent default link behavior
    setIsProcessoAnalisado(!isProcessoAnalisado);
  };

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
              <div className="tribunal-card">
                <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">Processos</h2>
                <div className="flex">
                  <div className={`pr-4 ${isProcessoAnalisado ? 'input-container-analisado' : 'w-1/2'}`}>
                    <div className="mb-4 relative">
                      <input
                        type="text"
                        placeholder="Número do Processo (nnnnn/aa)"
                        value={processoInput}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                        style={{ paddingRight: '2.5rem' }}
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <FaSearch className="h-5 w-5 text-gray-400 opacity-70" />
                      </div>
                    </div>
                    <a
                      href="#"
                      onClick={handleToggleAnalisado}
                      className="mt-3 block text-sm text-blue-600 hover:underline"
                    >
                      {isProcessoAnalisado
                        ? 'Processo não analisado pela SECEX Pessoal'
                        : 'Processo já analisado pela SECEX Pessoal'}
                    </a>
                  </div>
                  <div className={`pl-4 'w-1/2'}`}>
                    <div className="space-y-3">
                      {isProcessoAnalisado ? (
                        // Buttons for "Processo já analisado"
                        <>
                          <button
                            className="tribunal-button w-full justify-center"
                            onClick={handleNavigationEditar}
                          >
                            Editar
                          </button>
                          <button
                            className="tribunal-button-secondary w-full justify-center"
                            onClick={handleNavigationAnotacaoPlanilha}
                          >
                            Anotação na Planilha
                          </button>
                        </>
                      ) : (
                        // Buttons for "Processo não analisado" (original buttons)
                        <>
                          <button
                            className="tribunal-button w-full justify-center"
                            onClick={handleNavigationMunicipio}
                          >
                            Iniciar
                          </button>
                          <button
                            className="tribunal-button w-full justify-center"
                            onClick={handleNavigationMunicipio} // Assuming Consultar does the same as Iniciar for now
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
                            onClick={handleNavigationMunicipio} // Assuming Anotação de Subsídios does the same as Iniciar for now
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
            <footer className="mt-8 text-center text-gray-500 text-sm py-4">
              <p>Secretaria de Atos de Pessoal &copy; 2025</p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TelaInicial;
