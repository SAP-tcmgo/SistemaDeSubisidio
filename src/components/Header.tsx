import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  return (
    <header className="bg-white border-b py-3 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
      <button onClick={toggleSidebar} className="p-2 rounded-md text-gray-500 hover:bg-gray-100">
          <Menu size={20} />
        </button>
        <img src="/LogoSAP.png" alt="Logo" className="h-14 md:flex" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-tribunal-gold flex items-center justify-center text-white">
          U
        </div>
      </div>
    </header>
  );
};

export default Header;
