import { useState, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import WelcomeSection from '../components/WelcomeSection';
import '../styles/AppConfiguracoesDashboard.css';
import '../styles/indexConfiguracoesDashboard.css';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';
import { useDados } from '../Contexts/DadosContext';

const TelaInicial = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [processoInput, setProcessoInput] = useState(''); // State for input
  const { setNumeroProcesso, loadAnaliseData } = useDados(); // Get loadAnaliseData
  const navigate = useNavigate(); // Hook for navigation

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

  const handleNavigationCadADM = async () => {
    navigate(`/CadastroADM`); // Navigate

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
                  <div className="w-1/2 pr-4">
                    <div className="mb-4 relative">
                      <input
                        type="text"
                        placeholder="Número do Processo (nnnnn/aa)"
                        value={processoInput} // Bind value to state
                        onChange={handleInputChange} // Handle changes
                        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                      />
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <FaSearch className="h-5 w-5 text-gray-400 opacity-70" />
                      </div>
                    </div>
                    <a
                      href="#"
                      className="mt-3 block text-sm text-blue-600 hover:underline"
                    >
                      Processo não analisado pela SECEX Pessoal
                    </a>
                  </div>
                  <div className="w-1/2 pl-4">
                    <div className="space-y-3">
                      {/* Use the shared handler for both buttons */}
                      <button
                        className="tribunal-button w-full justify-center"
                        onClick={handleNavigationMunicipio}
                      >
                        Iniciar ou Editar
                      </button>
                      <button
                        className="tribunal-button-secondary w-full justify-center"
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
