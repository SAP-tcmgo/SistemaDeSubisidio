import React, { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '../../components/Sidebar';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Eye, Plus } from 'lucide-react';
import { MdSearch as Search, MdHome as Home, MdOutlineArrowCircleRight as CircleArrowRight, MdOutlineArrowCircleLeft as CircleArrowLeft, MdSave as Save} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import '../../styles/AppAnalise.css';
import '../../styles/indexAnalise.css';

const TratamentoLeis: React.FC = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Update state to handle multiple selections (array of strings)
  const [tiposTratamento, setTiposTratamento] = useState<string[]>([]);

  // Handler for checkbox changes
  const handleCheckboxChange = (value: string) => {
    setTiposTratamento((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value) // Remove if already selected
        : [...prev, value] // Add if not selected
    );
  };


  // Estado para o número de habitantes
  const [numeroHabitantes, setNumeroHabitantes] = useState<string>("1.200.058");

  // Estado para o município selecionado (obtido da página anterior)
  const [municipio, setMunicipio] = useState<string>("NomeMunicipio");

  // Dados simulados para as leis
  const leisInflacionarias = [
    {
      id: 1,
      numero: "1500/00",
      artigo: "1º",
      dataBase: "maio",
      indice: "INPC"
    },
    {
      id: 2,
      numero: "1800/02",
      artigo: "1º",
      dataBase: "fevereiro",
      indice: "IPCA"
    }
  ];

  const leisEspecificas = [
    {
      id: 1,
      numero: "1500/00",
      descricao: "concede a revisão geral anual de todos os servidores e agentes políticos, majorados em 0,05%"
    },
    {
      id: 2,
      numero: "1500/00",
      descricao: "concede a aumento real aos vereadores e prefeito a partir de 01/01/2026"
    }
  ];

  return (
    <div className="municipios-theme flex min-h-screen flex-col bg-gray-50">
      <div className="min-h-screen bg-gray-50">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
              <div className="flex justify-between items-center">
              <Header toggleSidebar={toggleSidebar} />

              <div className="flex space-x-4 mr-32"> {/* Container for icons */}
                    <Home onClick={() => navigate('/telaInicial')} className='cursor-pointer text-tribunal-blue' size={24}/>
                    <Save className='cursor-pointer text-tribunal-blue' size={24}/>
                    <CircleArrowLeft onClick={() => navigate('/DadosMunicipioEResponsaveis')} className='cursor-pointer text-tribunal-blue' size={26}/>
                    <CircleArrowRight onClick={() => navigate('/TratamentoLeis')} className='cursor-pointer text-tribunal-blue' size={26}/>
              </div>
            </div>

            <main className="min-h-screen bg-pattern bg-gray-100 py-8 px-4">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
<               h1 className="mb-8 text-primary text-center text-2xl font-bold">Trata-se de:</h1>

                {/* Replace RadioGroup with Checkboxes */}
                <div className="flex flex-wrap gap-6 mb-8">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fixacao"
                      checked={tiposTratamento.includes("fixacao")}
                      onCheckedChange={() => handleCheckboxChange("fixacao")}
                    />
                    <Label htmlFor="fixacao" className="text-lg">Fixação</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="revisaoGeral"
                      checked={tiposTratamento.includes("revisaoGeral")}
                      onCheckedChange={() => handleCheckboxChange("revisaoGeral")}
                    />
                    <Label htmlFor="revisaoGeral" className="text-lg">Revisão Geral Anual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="decimoTerceiro"
                      checked={tiposTratamento.includes("decimoTerceiro")}
                      onCheckedChange={() => handleCheckboxChange("decimoTerceiro")}
                    />
                    <Label htmlFor="decimoTerceiro" className="text-lg">Décimo Terceiro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ferias"
                      checked={tiposTratamento.includes("ferias")}
                      onCheckedChange={() => handleCheckboxChange("ferias")}
                    />
                    <Label htmlFor="ferias" className="text-lg">Férias</Label>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="mb-2 text-lg font-medium"  >Número de Habitantes no município de {municipio}</h2>
                  <Input
                    value={numeroHabitantes}
                    onChange={(e) => setNumeroHabitantes(e.target.value)}
                    className="border-2 border-gray-300 h-12 text-lg"
                  />
                </div>

                <div className="mb-8">
                  <h2 className="mb-2 text-lg font-medium">Lista resumida das Leis acerca da política inflacionária do município {municipio}:</h2>
                  <div className="border border-gray-300 rounded-md">
                    {leisInflacionarias.map((lei, index) => (
                      <div key={lei.id} className={`p-4 flex justify-between items-center ${index !== 0 ? 'border-t border-gray-300' : ''}`}>
<span className="text-lg"  >Lei Municipal n.: {lei.numero}, art. {lei.artigo}, data base {lei.dataBase}, índice: {lei.indice}</span>
                        <button className="text-primary hover:text-primary/80">
                          <Plus className="h-8 w-8" />
                        </button>
                      </div>
                    ))}
                    <div className="p-4 border-t border-gray-300 flex items-center">
                      <button className="flex items-center space-x-2 text-primary hover:text-primary/80">
                        <Eye className="h-8 w-8" />
<span className="text-lg font-medium"  >visualizar lista completa</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h2 className="mb-2 text-lg font-medium">Lista resumida das Leis específicas (cadastradas no COLARE) do município {municipio}:</h2>
                  <div className="border border-gray-300 rounded-md">
                    {leisEspecificas.map((lei, index) => (
                      <div key={lei.id} className={`p-4 flex justify-between items-center ${index !== 0 ? 'border-t border-gray-300' : ''}`}>
<span className="text-lg"  >Lei Municipal n.: {lei.numero}, {lei.descricao}</span>
                        <button className="text-primary hover:text-primary/80">
                          <Plus className="h-8 w-8" />
                        </button>
                      </div>
                    ))}
                    <div className="p-4 border-t border-gray-300 flex items-center">
                      <button className="flex items-center space-x-2 text-primary hover:text-primary/80">
                        <Eye className="h-8 w-8" />
                        <span className="text-lg font-medium">visualizar lista completa</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default TratamentoLeis;
