import React, { useState, useEffect } from 'react';
import { Menu, X, User, LayoutDashboard, LineChart, FolderKanban, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { nanoid } from 'nanoid';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useUser } from "../UserContext";

const Configuracoes = () => {
  const [cargoNome, setCargoNome] = useState('');
  const [token, setToken] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('configuracoes');
  const navigate = useNavigate();

  const db = getFirestore();

  const { userName } = useUser();

  const handleCriarCargo = async () => {
    try {
      const docRef = await addDoc(collection(db, "cargos"), {
        nome: cargoNome
      });
      console.log("Cargo criado com ID: ", docRef.id);
      toast.success('Cargo criado com sucesso!');
      setCargoNome('');
    } catch (e) {
      console.error("Erro ao adicionar cargo: ", e);
      toast.error('Erro ao criar cargo.');
    }
  };

  const handleGerarToken = async () => {
    const novoToken = nanoid();
    setToken(novoToken);
    try {
      const docRef = await addDoc(collection(db, "tokens"), {
        token: novoToken,
        usado: false,
        data_geracao: new Date()
      });
      console.log("Token gerado com ID: ", docRef.id);
      toast.success('Token gerado com sucesso!');
    } catch (e) {
      console.error("Erro ao adicionar token: ", e);
      toast.error('Erro ao gerar token.');
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen((prevSidebarOpen) => !prevSidebarOpen);
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, active: false, path: '/dashboard' },
    { id: 'analise', name: 'Análises', icon: LineChart, active: false, path: '/analise' },
    { id: 'projetos', name: 'Projetos', icon: FolderKanban, active: false, path: '/projetos' },
    { id: 'configuracoes', name: 'Configurações', icon: Settings, active: true },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-center h-16 border-b border-sidebar-border">
            <span className="text-xl font-semibold text-sidebar-foreground">
              Dashboard
            </span>
          </div>

          {/* Sidebar Menu */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path ? item.path : '#'}
                  onClick={() => setActiveItem(item.id)}
                  className={`sidebar-menu-item ${activeItem === item.id ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none transition-colors"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center justify-center w-full">
              <img src="/LogoSAP.png" alt="Logo" className="h-14" />
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 mr-3">
                <User className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">{userName}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Configurações</h1>

            {/* Criar Cargo */}
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Criar Cargo</h2>
              <input
                type="text"
                placeholder="Nome do Cargo"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={cargoNome}
                onChange={(e) => setCargoNome(e.target.value)}
              />
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mt-2"
                onClick={handleCriarCargo}
              >
                Criar Cargo
              </button>
            </div>

            {/* Gerar Token */}
            <div>
              <h2 className="text-xl font-semibold mb-2">Gerar Token</h2>
              <button
                className="bg-[#C9991F] hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={handleGerarToken}
              >
                Gerar Token
              </button>
              {token && (
                <div className="mt-2">
                  <strong>Token Gerado:</strong> {token}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Configuracoes;
