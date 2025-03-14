
import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative">
        <svg 
          className="w-48 h-auto"
          viewBox="0 0 400 120" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Estrelas */}
          <g fill="#F6B221">
            <circle cx="243" cy="25" r="4" />
            <circle cx="230" cy="35" r="4" />
            <circle cx="217" cy="45" r="4" />
            <circle cx="204" cy="55" r="4" />
            <circle cx="191" cy="65" r="4" />
          </g>
          {/* Símbolo do Tribunal */}
          <path 
            d="M260 25C310 35 330 85 260 117" 
            fill="none" 
            stroke="#F6B221" 
            strokeWidth="8" 
          />
          {/* Colunas */}
          <rect x="230" y="65" width="12" height="50" rx="2" fill="#0077CC" />
          <rect x="250" y="65" width="12" height="50" rx="2" fill="#0077CC" />
          <rect x="270" y="65" width="12" height="50" rx="2" fill="#0077CC" />
          {/* Base do templo */}
          <rect x="215" y="115" width="82" height="10" rx="2" fill="#0077CC" />
          {/* Texto "TRIBUNAL" */}
          <text 
            x="290" 
            y="55" 
            fontSize="24" 
            fontWeight="bold" 
            fill="#F6B221"
            fontFamily="Arial, sans-serif"
          >
            TRIBUNAL
          </text>
          {/* Texto "DE CONTAS" */}
          <text 
            x="290" 
            y="85" 
            fontSize="24" 
            fontWeight="bold" 
            fill="#F6B221"
            fontFamily="Arial, sans-serif"
          >
            DE CONTAS
          </text>
          {/* Texto "DOS MUNICÍPIOS DO ESTADO DE GOIÁS" */}
          <text 
            x="290" 
            y="105" 
            fontSize="10" 
            fill="#0077CC"
            fontFamily="Arial, sans-serif"
          >
            DOS MUNICÍPIOS DO ESTADO DE GOIÁS
          </text>
        </svg>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse-subtle"></div>
      </div>
    </div>
  );
};

export default Logo;
