import React, { useState, useEffect } from 'react';
import { Search, Plus, ArrowLeft } from 'lucide-react';
import Header from '../components/Header';
import Switch from '../components/Switch';
import Sidebar from '../components/Sidebar';
import { municipiosGoias } from '../dados/municipios';
import '../styles/AppMunicipios.css';
import '../styles/indexMunicipios.css';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from 'react-router-dom';

const DadosMunicipioEResponsaveis: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const [municipio, setMunicipio] = useState<string>('');
  const [anoProcesso, setAnoProcesso] = useState<string>('2023');
  const [incluirExResponsaveis, setIncluirExResponsaveis] = useState<boolean>(false);
  const [incluirOutrosResponsaveis, setIncluirOutrosResponsaveis] = useState<boolean>(false);
  const [searchInput, setSearchInput] = useState<string>('');
  const [listaExPresidentes, setListaExPresidentes] = useState<string[]>(['SANDRO CIPRIANO PEREIRA DO VALE']);
  const [listaExPrefeitos, setListaExPrefeitos] = useState<string[]>(['SANDRO CIPRIANO PEREIRA DO VALE']);
  const [listaExChefesRHCamara, setListaExChefesRHCamara] = useState<string[]>(['SANDRO CIPRIANO PEREIRA DO VALE']);
  const [listaExChefesRHPrefeitura, setListaExChefesRHPrefeitura] = useState<string[]>(['SANDRO CIPRIANO PEREIRA DO VALE']);
  
  const [nomeResponsavel, setNomeResponsavel] = useState<string>('');
  const [cpfResponsavel, setCpfResponsavel] = useState<string>('');
  const [cargoResponsavel, setCargoResponsavel] = useState<string>('');

  // Gerar anos de 2000 até o ano atual
  const anosProcesso = () => {
    const anoAtual = new Date().getFullYear();
    const anos = [];
    for (let ano = 2000; ano <= anoAtual; ano++) {
      anos.push(ano.toString());
    }
    return anos.reverse();
  };

  const handleAddExResponsavel = (lista: string[], setLista: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (nomeResponsavel.trim()) {
      setLista([...lista, nomeResponsavel]);
      setNomeResponsavel('');
    }
  };

  const filteredMunicipios = municipiosGoias.filter(m => 
    m.toLowerCase().includes(searchInput.toLowerCase())
  );

  return (
    <div className="municipios-theme flex min-h-screen flex-col bg-gray-50">
      <div className="min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="flex justify-between items-center">
            <Header toggleSidebar={toggleSidebar} />
          </div>

          <div className="min-h-screen bg-pattern bg-gray-100 py-8 px-4">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-6 text-primary">
                  <Link to="/">
                    <ArrowLeft className="mr-2 cursor-pointer" size={20} />
                  </Link>
                  <h1 className="text-xl font-bold">Dados do Município e Responsáveis</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <Label htmlFor="municipio" className="text-sm font-medium text-gray-700 mb-1 block">
                      Município
                    </Label>
                    <div className="relative">
                      <Input
                        id="municipio"
                        placeholder="Selecione um município"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="pl-10 border-gray-300"
                      />
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      {searchInput && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredMunicipios.map((m) => (
                            <div
                              key={m}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setMunicipio(m);
                                setSearchInput(m);
                              }}
                            >
                              {m}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="anoProcesso" className="text-sm font-medium text-gray-700 mb-1 block">
                      Ano do Processo:
                    </Label>
                    <Select value={anoProcesso} onValueChange={setAnoProcesso}>
                      <SelectTrigger id="anoProcesso" className="w-24 border-gray-300">
                        <SelectValue placeholder="Selecione o ano" />
                      </SelectTrigger>
                      <SelectContent>
                        {anosProcesso().map((ano) => (
                          <SelectItem key={ano} value={ano}>
                            {ano}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="presidenteCamara" className="text-sm font-medium text-gray-700 mb-1 block">
                        Presidente da Câmara Atual
                      </Label>
                      <Input id="presidenteCamara" placeholder="Nome" defaultValue="CARLOS ALBERTO ALVES RABELO" className="mb-1" />
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input placeholder="xxx xxx xxx xx" defaultValue="xxx xxx xxx xx" className="w-32" />
                      <Switch/>
                    </div>
                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="prefeitoAtual" className="text-sm font-medium text-gray-700 mb-1 block">
                        Prefeito(a) Atual
                      </Label>
                      <Input id="prefeitoAtual" placeholder="Nome" defaultValue="CARLOS ALBERTO ALVES RABELO" className="mb-1" />
                    </div>
                    <div className="flex items-center space-x-2 mt-7">
                      <Input placeholder="xxx xxx xxx xx" defaultValue="xxx xxx xxx xx" className="w-32" />
                      <Switch/>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="chefeRHCamara" className="text-sm font-medium text-gray-700 mb-1 block">
                        Chefe de Recursos Humanos da Câmara Municipal
                      </Label>
                      <Input id="chefeRHCamara" placeholder="Nome" defaultValue="CARLOS ALBERTO ALVES RABELO" className="mb-1" />
                    </div>
                    <div className="flex items-center space-x-2 mt-7">
                      <Input placeholder="xxx xxx xxx xx" defaultValue="xxx xxx xxx xx" className="w-32" />
                      <Switch/>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="chefeRHPrefeitura" className="text-sm font-medium text-gray-700 mb-1 block">
                        Chefe de Recursos Humanos da Prefeitura
                      </Label>
                      <Input id="chefeRHPrefeitura" placeholder="Nome" defaultValue="CARLOS ALBERTO ALVES RABELO" className="mb-1" />
                    </div>
                    <div className="flex items-center space-x-2 mt-7">
                      <Input placeholder="xxx xxx xxx xx" defaultValue="xxx xxx xxx xx" className="w-32" />
                      <Switch/>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="incluirExResponsaveis" 
                        checked={incluirExResponsaveis} 
                        onCheckedChange={(checked) => setIncluirExResponsaveis(checked as boolean)}
                      />
                      <Label htmlFor="incluirExResponsaveis">Incluir Ex-Responsáveis</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="incluirOutrosResponsaveis" 
                        checked={incluirOutrosResponsaveis} 
                        onCheckedChange={(checked) => setIncluirOutrosResponsaveis(checked as boolean)}
                      />
                      <Label htmlFor="incluirOutrosResponsaveis">Incluir Outros Responsáveis</Label>
                    </div>
                  </div>

                  <div className="text-xs text-blue-500 cursor-pointer">
                    Visualizar ficha completa
                  </div>

                  {incluirExResponsaveis && (
                    <div className="mt-6 border rounded-md p-4 bg-gray-50">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700">Lista de Ex-Presidentes da Câmara:</h3>
                        {listaExPresidentes.map((presidente, index) => (
                          <div key={index} className="flex justify-between items-center border-b py-2">
                            <span>{presidente}</span>
                            <button className="text-primary">
                              <Plus size={18} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700">Lista de Ex-Prefeitos:</h3>
                        {listaExPrefeitos.map((prefeito, index) => (
                          <div key={index} className="flex justify-between items-center border-b py-2">
                            <span>{prefeito}</span>
                            <button className="text-primary">
                              <Plus size={18} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700">Lista de Ex-Chefes dos RH da Câmara Municipal:</h3>
                        {listaExChefesRHCamara.map((chefe, index) => (
                          <div key={index} className="flex justify-between items-center border-b py-2">
                            <span>{chefe}</span>
                            <button className="text-primary">
                              <Plus size={18} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="mb-4">
                        <h3 className="text-sm font-medium text-gray-700">Lista de Ex-Chefes dos RH da Prefeitura:</h3>
                        {listaExChefesRHPrefeitura.map((chefe, index) => (
                          <div key={index} className="flex justify-between items-center border-b py-2">
                            <span>{chefe}</span>
                            <button className="text-primary">
                              <Plus size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {incluirOutrosResponsaveis && (
                    <div className="mt-6 border rounded-md p-4 bg-gray-50">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Incluir Outros Responsáveis:</h3>
                      
                      <div className="mb-3">
                        <Label htmlFor="nomeResponsavel" className="text-sm font-medium text-gray-700 mb-1 block">
                          Nome do Responsável
                        </Label>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <Label htmlFor="cpfResponsavel" className="text-sm font-medium text-gray-700 mb-1 block">
                            CPF Responsável
                          </Label>
                          <Input 
                            id="cpfResponsavel" 
                            placeholder="xxx xxx xxx xx" 
                            value={cpfResponsavel}
                            onChange={(e) => setCpfResponsavel(e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="cargoResponsavel" className="text-sm font-medium text-gray-700 mb-1 block">
                            Cargo
                          </Label>
                          <Input 
                            id="cargoResponsavel" 
                            placeholder="Ex: Prefeito" 
                            value={cargoResponsavel}
                            onChange={(e) => setCargoResponsavel(e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <Button className="bg-secondary hover:bg-secondary/90 text-white" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Incluir
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DadosMunicipioEResponsaveis;
