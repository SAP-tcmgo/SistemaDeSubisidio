import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  Menu, X, User, LayoutDashboard, LineChart, FolderKanban, Settings
} from 'lucide-react';

// Dados aleatórios para os gráficos
const deviceData = [
  { name: 'Linux', value: 12000, color: '#818cf8' },
  { name: 'Mac', value: 22000, color: '#6ee7b7' },
  { name: 'iOS', value: 18000, color: '#000000' },
  { name: 'Windows', value: 27000, color: '#93c5fd' },
  { name: 'Android', value: 10000, color: '#a5b4fc' },
  { name: 'Other', value: 15000, color: '#6ee7b7' },
];

const locationData = [
  { name: 'United States', value: 52.1, color: '#1e1e1e' },
  { name: 'Canada', value: 22.8, color: '#93c5fd' },
  { name: 'Mexico', value: 13.9, color: '#6ee7b7' },
  { name: 'Other', value: 11.2, color: '#cbd5e1' },
];

const marketingData = [
  { name: 'Jan', value: 15000, color: '#818cf8' },
  { name: 'Feb', value: 25000, color: '#6ee7b7' },
  { name: 'Mar', value: 18000, color: '#000000' },
  { name: 'Apr', value: 27000, color: '#93c5fd' },
  { name: 'May', value: 12000, color: '#a5b4fc' },
  { name: 'Jun', value: 22000, color: '#6ee7b7' },
  { name: 'Jul', value: 17000, color: '#818cf8' },
  { name: 'Aug', value: 24000, color: '#6ee7b7' },
  { name: 'Sep', value: 21000, color: '#000000' },
  { name: 'Oct', value: 28000, color: '#93c5fd' },
  { name: 'Nov', value: 14000, color: '#a5b4fc' },
  { name: 'Dec', value: 23000, color: '#6ee7b7' },
];

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [userName] = useState('SAP');
  const [activeItem, setActiveItem] = useState('dashboard');

  // Simular carregamento de dados
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, active: true },
    { id: 'analise', name: 'Análises', icon: LineChart, active: false },
    { id: 'projetos', name: 'Projetos', icon: FolderKanban, active: false },
    { id: 'settings', name: 'Configurações', icon: Settings, active: false },
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
                <button
                  key={item.id}
                  onClick={() => setActiveItem(item.id)}
                  className={`sidebar-menu-item ${activeItem === item.id ? 'active' : ''}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </button>
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
              <img src="/LogoTCMGO.svg" alt="Logo" className="h-14" />
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
          {isLoading ? (
            // Loading Skeleton
            <div className="space-y-6">
              <div className="h-10 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : (
            // Content
            <div className="space-y-6 animate-enter">
              {/* Device Traffic Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="chart-container stagger-1">
                  <h2 className="text-lg font-semibold mb-4">Tráfego por Dispositivo</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={deviceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          border: 'none'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Usuários">
                        {deviceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Location Traffic Chart */}
                <div className="chart-container stagger-2">
                  <h2 className="text-lg font-semibold mb-4">Tráfego por Localização</h2>
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="w-full md:w-7/12 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={locationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {locationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value) => `${value}%`}
                            contentStyle={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.9)',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              border: 'none'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="w-full md:w-5/12 mt-6 md:mt-0">
                      <div className="space-y-3">
                        {locationData.map((item) => (
                          <div key={item.name} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: item.color }}
                              ></div>
                              <span className="text-sm">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketing Chart */}
              <div className="chart-container stagger-3">
                <h2 className="text-lg font-semibold mb-4">Marketing & SEO</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={marketingData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        border: 'none'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Usuários">
                      {marketingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
