import React from 'react';
import { Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="bg-white border-b py-3 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 rounded-md text-gray-500 hover:bg-gray-100">
          <Menu size={20} />
        </button>
        <img src="/LogoSAP.png" alt="Logo" className="h-14 md:flex" />
      </div>
    </header>
  );
};

export default Header;
