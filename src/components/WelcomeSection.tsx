import React from 'react';
import { motion } from 'framer-motion';

const WelcomeSection = () => {
  return (
    <div className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="tribunal-card bg-gradient-to-r from-tribunal-blue to-tribunal-blue/90 text-white"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Bem-vindo ao SIAAP Subsídios</h2>
            <p className="text-blue-100">
              Tribunal de Contas dos Municípios do Estado de Goiás
            </p>
          </div>
          <button className="tribunal-button mt-4 md:mt-0">
            Acessar painel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeSection;
