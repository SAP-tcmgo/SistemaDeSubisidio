import { useState } from 'react';
import { useIsMobile } from '../hooks/use-mobile';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import WelcomeSection from '../components/WelcomeSection';
import '../AppConfiguracoesDashboard.css';
import '../indexConfiguracoesDashboard.css';
import { motion } from 'framer-motion';

const TelaInicial = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
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
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="tribunal-card">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Processos</h2>
                <div className="space-y-3">
                  <button className="tribunal-button w-full justify-center">
                    Iniciar ou Editar
                  </button>
                  <button className="tribunal-button-secondary w-full justify-center">
                    Consultar
                  </button>
                  <button className="bg-white border border-gray-200 text-gray-700 font-medium py-2 px-6 rounded-md w-full transition-all duration-300 hover:bg-gray-50">
                    Administrador 
                  </button>
                </div>
              </div>
            </motion.div>
            
            <footer className="mt-8 text-center text-gray-500 text-sm py-4">
              <p>Tribunal de Contas dos Municípios do Estado de Goiás &copy; {new Date().getFullYear()}</p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TelaInicial;
