import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, LineChart, FolderCog, Settings, X } from 'lucide-react';
import { useIsMobile } from '../hooks/use-mobile';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const sidebarLinks = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    { name: 'Análises', icon: <LineChart size={20} />, path: '/analises' },
    { name: 'Projetos', icon: <FolderCog size={20} />, path: '/projetos' },
    { name: 'Configurações', icon: <Settings size={20} />, path: '/configuracoes' },
  ];

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white shadow-lg z-30 transition-all duration-300 ease-in-out
        ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
        ${isMobile ? 'w-64' : 'w-64'} 
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="bg-tribunal-blue rounded-full w-8 h-8 flex items-center justify-center">
                <Settings size={18} className="text-white" />
              </div>
              <h1 className="font-semibold text-tribunal-blue">TCMGO</h1>
            </div>
            {isMobile && (
              <button 
                onClick={closeSidebar}
                className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {/* Links */}
          <div className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {sidebarLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`tribunal-sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={closeSidebar}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-7 h-7 rounded-full bg-tribunal-gold flex items-center justify-center text-white">
                U
              </div>
              <span>Usuário TCMGO</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
