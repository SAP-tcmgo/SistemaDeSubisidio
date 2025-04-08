import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import Header from '../../components/Header'; // Added Header
import Sidebar from '../../components/Sidebar'; // Added Sidebar
import BreadcrumbNav from '../../components/BreadcrumbNav'; // Added BreadcrumbNav
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import Icons from '../../components/Icons';
import { useDados } from '../../Contexts/DadosContext'; // Added useDados
import '../../styles/AppAnalise.css'; // Added styles
import '../../styles/indexAnalise.css'; // Added styles
import VerificationIcon from '../../components/VerificationIcon';



const Fixacao: React.FC = () => { // Renamed component
  const navigate = useNavigate(); // Added navigate hook
  const { numeroProcesso } = useDados(); // Get numeroProcesso from context
  const [sidebarOpen, setSidebarOpen] = useState(false); // Added sidebar state

interface FormData {
  atoNormativo: string;
  legislatura: string;
  dataFixacao: string;
  anotacaoPlanilha: boolean;
  numeroLei: string;
  numeroAcordao: string;
  ressalvaLivre: boolean;
  [key: string]: any; // Allow dynamic keys for subsidy values and vicios
}

const [formData, setFormData] = useState<FormData>({
    atoNormativo: '',
    legislatura: '',
    dataFixacao: '',
    anotacaoPlanilha: true,
    numeroLei: '',
    numeroAcordao: '',
    ressalvaLivre: false,
  });

  const [selectedVicio, setSelectedVicio] = useState<number | null>(0);

  const toggleSidebar = () => { // Added toggleSidebar function
    setSidebarOpen(!sidebarOpen);
  };

  // TODO: Implement handleClearScreen if needed
  const handleClearScreen = () => {
     console.log("Clear screen action triggered");
     // Reset formData, selectedVicio etc.
     setFormData({
       atoNormativo: '',
       legislatura: '',
       dataFixacao: '',
       anotacaoPlanilha: true,
       numeroLei: '',
       numeroAcordao: '',
       ressalvaLivre: false,
     });
     setSelectedVicio(0); // Reset to default or null
     // Add toast notification if desired
  };

  const subsidios = [
    { cargo: "Prefeito", valor: "R$ 33.233,00", isValid: true },
    { cargo: "Vice-Prefeito", valor: "R$ 16.566,00", isValid: true },
    { cargo: "Secretários", valor: "R$ 12.000,00", isValid: true },
    { cargo: "Vereadores", valor: "R$ 9.000,00", isValid: false },
    { cargo: "Presidente da Câmara", valor: "R$ 9.000,00", isValid: false },
  ];

  const vicios = [
    "1 - Ausência de Documentação Essencial",
    "2 -A fixação dos subsídios do Prefeito, do Vice-Prefeito, dos Secretários e dos Vereadores, NÃO deu-se mediante lei de iniciativa da Câmara.",
    "3 - NÃO houve declaração do Prefeito no ato de sanção",
    "4 - A fixação do subsídio dos vereadores ocorreu por meio de outra norma.",
    "5 -A Lei que fixou os subsídios dos vereadores NÃO deu-se mediante iniciativa da Câmara.",
    "6 -Subsídio fixado excede ao teto regulamentar.",
    "7 - Houve Desobediência ao Princípio da Anterioridade.",
    "8 -houve alteração de norma para retirar a exigência da anterioridade",
    "9 -Existe divergência entres als fixatório e Lei Municipal.",
    "10 -O total da despesa com a remuneração dos vereadores ultrapassa o montante de 5% da receita do município.",
    "11- Houve Desobedencia ao Princípio da Generalidade",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  
  // --- Icon Click Handlers ---
  const handleErase = () => {
    handleClearScreen(); // Reuse the existing clear logic
  };

  const handleBack = () => {
    navigate('/TratamentoLeis');
  };

  const handleNext = () => {
    navigate('/Fixacao');
  };

  return (
    // Added Page Wrapper Structure
    <div className="municipios-theme flex min-h-screen flex-col bg-gray-50">
      <div className="min-h-screen bg-gray-50">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

        <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          <div className="flex justify-between items-center">
            <Header toggleSidebar={toggleSidebar} />
          </div>

          {/* Use the new BreadcrumbNav component */}
          <BreadcrumbNav currentPage="Fixação" sidebarOpen={sidebarOpen} />

          <main className="min-h-screen bg-pattern bg-gray-100 py-8 px-4 ">
            <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md overflow-hidden ">
              <div className="p-6 ">
                <div className="mt-[-20px] flex justify-end">
                      <Icons
                        onEraseClick={handleErase}
                        onBackClick={handleBack}
                        onNextClick={handleNext}
                        // onSaveClick is omitted as it does nothing yet
                      />
                </div>

                <div className="relative mb-8 text-primary text-center">
                  <h1 className="text-2xl font-bold text-center mb-4 mt-[-20px]">Fixação {numeroProcesso && `(${numeroProcesso})`}</h1>
                </div>

                <div className="mb-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    <Label htmlFor="atoNormativo" className="text-base font-medium w-128">Ato Normativo que concedeu a Fixação dos Subsídios n.:</Label>
                    <Input
                      id="atoNormativo"
                      name="atoNormativo"
                      value={formData.atoNormativo}
                      onChange={handleInputChange}
                      className="w-[100px] md:max-w-xs"
                      placeholder="1.500/00"
                    />
                  </div>

                  <div className="flex flex-col md:flex-row gap-4 md:items-center">
                    <Label htmlFor="legislatura" className="text-base font-medium w-18">A fixação dos subsídios refere-se a qual legislatura:</Label>
                    <Input
                      id="legislatura"
                      name="legislatura"
                      value={formData.legislatura}
                      onChange={handleInputChange}
                      className="w-[100px] md:max-w-xs"
                      placeholder="2020-2024"
                    />
                  </div>
                </div>

              <div className="mb-8 w-[80%] md:w-full">
                <h2 className="text-xl font-bold mb-4 text-center">Sobre o valor dos subsídios:</h2>
                <table className="w-[70%] border-collapse text-center mx-auto">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="w-64 border p-2 text-center">Agente Político</th>
                      <th className="border p-2 text-center">Valor dos Subsídios</th>
                      <th className="border p-2 text-center">Válido?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subsidios.map((subsidio, index) => (
                      <tr key={index}>
                        <td className="border p-2 text-left">{subsidio.cargo}</td>
                        <td className="border-b p-2 flex text-center justify-center">
                          <Input
                            type="text"
                            name={`valor-${index}`} // Give each input a unique name
                            value={formData[`valor-${index}`] || ''} // Access value using unique name
                            onChange={(e) =>
                              setFormData({ ...formData, [`valor-${index}`]: e.target.value })
                            }
                            className="w-32"
                            placeholder="R$ 0,00"
                          />
                        </td>
                        <td className="border p-2 w-22 ">
                          <div className='flex justify-center'><VerificationIcon isValid={subsidio.isValid} /></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mb-6 flex flex-col md:flex-row gap-4 md:items-center">
                <span className="text-base font-medium">Data da Fixação:</span>
                <div className="relative max-w-xs">
                  <Input 
                    name="dataFixacao" 
                    value={formData.dataFixacao} 
                    onChange={handleInputChange} 
                    className="pl-10" 
                    placeholder="24/04/2000" 
                  />
                  <Calendar className="absolute left-3 top-2.5 text-gray-500 h-5 w-5" />
                </div>
              </div>

              <div className="mb-6 flex items-center gap-2 border p-4 rounded bg-blue-50">
                <Checkbox 
                  id="anotacao" 
                  checked={formData.anotacaoPlanilha} 
                  onCheckedChange={(checked) => handleCheckboxChange('anotacaoPlanilha', !!checked)} 
                />
                <label htmlFor="anotacao" className="text-blue-800 font-medium">Anotação na planilha de controle de gastos</label>
              </div>

              <div className="mb-8 p-4 border rounded-md bg-gray-50 text-sm">
                <p className="mb-2">Trata-se de procedimento de anotação, para fins de controle de gastos, da Lei nº 
                  <Input 
                    name="numeroLei" 
                    value={formData.numeroLei} 
                    onChange={handleInputChange} 
                    className="inline-block w-24 mx-1" 
                    placeholder="000/000" 
                  /> que que fixou os subsídios dos agentes políticos de MUNICÍPIO para a legislatura <span className="bg-white border px-2 py-0.5 rounded">2020-2024</span> do Setor de Recursos, com a informação de que os dados da planilha de subsídios 
                  <span className="bg-white border px-2 py-0.5 rounded mx-1">2020-2023</span> foram atualizados em consonância com o disposto no Acórdão nº
                  <Input 
                    name="numeroAcordao" 
                    value={formData.numeroAcordao} 
                    onChange={handleInputChange} 
                    className="inline-block w-24 mx-1" 
                    placeholder="000/000" 
                  />.
                </p>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4">Vícios ou Ressalvas da Fixação de Subsídios:</h2>

                <div className="space-y-2">
                  {vicios.map((vicio, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`vicio-${index}`}
                        checked={formData[`vicio-${index}`] || false} // Use unique name for state
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, [`vicio-${index}`]: !!checked })
                        }
                      />
                      <Label htmlFor={`vicio-${index}`} className="text-base font-normal">{vicio}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8 flex items-center gap-2">
                <Checkbox 
                  id="ressalvaLivre" 
                  checked={formData.ressalvaLivre} 
                  onCheckedChange={(checked) => handleCheckboxChange('ressalvaLivre', !!checked)} 
                />
                <label htmlFor="ressalvaLivre" className="font-medium">Inserir Ressalva Livre</label>
              </div>

              {formData.ressalvaLivre && (
                <div className="mb-8">
                  <h3 className="font-medium mb-2">Ressalva</h3>
                  <Textarea className="w-full h-32" />
                </div>
              )}

              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Conferência do Texto de Fixação de Subsídios</h2>
                <div className="border rounded-md w-full h-64"></div>
              </div>
            </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Fixacao; // Renamed export
