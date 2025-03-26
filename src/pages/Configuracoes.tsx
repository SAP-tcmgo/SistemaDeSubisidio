import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { db, auth, sendPasswordResetEmail } from '../firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import '../styles/AppConfiguracoesDashboard.css';
import '../styles/indexConfiguracoesDashboard.css';
import { User, Mail, Shield, LogOut, ArrowLeft, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Form, FormControl,  FormField, FormItem, FormLabel } from '../components/ui/form';
import { useForm } from "react-hook-form";
import { useUser } from '../UserContext';
import { useToast } from "@/components/ui/use-toast"

export default function Configuracoes() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("perfil");
  const [tokenVisible, setTokenVisible] = useState(false);
  const [showCargoManagement, setShowCargoManagement] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const { userRoles, userName, userEmail, usercpf, updateUser } = useUser();

  useEffect(() => {
    const fetchRoles = async () => {
      const rolesCollection = collection(db, 'cargos');
      const rolesSnapshot = await getDocs(rolesCollection);
      const fetchedRoles = rolesSnapshot.docs.map((doc) => doc.data().nome);
      setRoles(fetchedRoles);
    };

    fetchRoles();
  }, []);

  const handleAddRole = async () => {
    if (newRole.trim() !== '') {
      try {
        const rolesCollection = collection(db, 'cargos');
        await addDoc(rolesCollection, { nome: newRole });
        setRoles([...roles, newRole]);
        setNewRole('');
        toast({
          title: 'Cargo adicionado com sucesso!',
          className: 'bg-green-500 text-white',
        });
      } catch (error) {
        console.error('Erro ao adicionar cargo:', error);
        toast({
          title: 'Erro ao adicionar cargo. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  const { toast } = useToast()

  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const handleGenerateToken = async () => {
    try {
      // Check for unused tokens
      const tokensRef = collection(db, 'tokens');
      const q = query(tokensRef, where('usado', '==', false));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Unused token found
        const tokenDoc = querySnapshot.docs[0];
        const token = tokenDoc.data().token;
        setGeneratedToken(token);
        setTokenVisible(true);
        // Update token to mark as used
        return;
      }

      // Não existe token não usado no db, gera um novo
      const newToken = nanoid();
      await addDoc(tokensRef, {
        data_geracao: Timestamp.now(),
        token: newToken,
        usado: false,
      });

      setGeneratedToken(newToken);
    } catch (error) {
      console.error("Error generating token:", error);
      toast({
        title: "Erro ao gerar token",
        description: "Tente novamente.",
        variant: "destructive",
      });
    }
  };

    const handleForgotPassword = () => {
    if (userEmail) {
      sendPasswordResetEmail(auth, userEmail)
        .then(() => {
          console.log("Link de redefinição de senha enviado com sucesso para: " + userEmail);
          toast({
            title: "Link de redefinição enviado",
            description: "Verifique seu e-mail para redefinir sua senha.",
          });
        })
        .catch((error: any) => {
          let errorMessage = "Ocorreu um erro ao enviar o email de redefinição. Verifique se o email está correto.";
          if (error.code === 'auth/user-not-found') {
            errorMessage = "E-mail não encontrado no banco de dados.";
          }
          toast({
            title: "Erro ao enviar email de redefinição",
            description: errorMessage,
            variant: "destructive",
          });
          console.error("Erro ao enviar o link de redefinição de senha:", error);
        });
    }
  };
  
  const form = useForm({
    defaultValues: {
      nome: userName,
      email: userEmail,
      cargos: userRoles,
      cpf: usercpf,
    }
  });

  useEffect(() => {
    form.reset({
      nome: userName,
      email: userEmail,
      cpf: usercpf,
    });
  }, [userName, userEmail, usercpf, form]);

  const handleSubmit = async (data: any) => {
    console.log("Form submitted:", data);
    try {
      await updateUser({
        userName: data.nome,
        userEmail: data.email,
        usercpf: data.cpf,
      });
      toast({
        title: "Perfil atualizado com sucesso!",
        className: "bg-green-500 text-white",
      });
    } catch (error) {
      console.error("Erro ao atualizar o perfil:", error);
      toast({
        title: "Erro ao atualizar o perfil. Tente novamente.",
        variant: "destructive",
      });
    }
};

  return (
    <div className="dashboard-theme container mx-auto py-6 px-4 md:px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center mb-6 cursor-pointer" onClick={() => navigate('/telaInicial')}>
          <ArrowLeft className="mr-2 text-tribunal-blue" size={24} />
          <h1 className="text-3xl font-bold text-tribunal-blue">Configurações</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar de navegação */}
          <Card className="md:col-span-3 shadow-md">
            <CardContent className="p-0">
              <nav className="flex flex-col">
                {[
                  { id: "perfil", label: "Perfil", icon: <User size={18} /> },
                  { id: "conta", label: "Conta", icon: <Mail size={18} /> },
                  { id: "admin", label: "Área de administrador", icon: <Shield size={18} /> },
                ].map((item) => (
                  <button
                    key={item.id}
                    className={`flex items-center gap-3 p-4 text-left transition-colors hover:bg-gray-100 ${
                      activeTab === item.id ? "bg-tribunal-gold/10 text-tribunal-gold border-l-4 border-tribunal-gold" : "text-gray-700"
                    }`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
                
                <button className="flex items-center gap-3 p-4 text-left text-red-500 hover:bg-red-50 mt-auto border-t" onClick={() => {
                  if (window.confirm('Deseja realmente sair?')) {
                    auth.signOut().then(() => {
                      navigate('/login');
                    });
                  }
                }}>
                  <LogOut size={18} />
                  <span>Sair</span>
                </button>
              </nav>
            </CardContent>
          </Card>
          
          {/* Conteúdo principal */}
          <Card className="md:col-span-9 shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl text-tribunal-blue">
                {activeTab === "perfil" && "Informações de Perfil"}
                {activeTab === "conta" && "Configurações de Conta"}
                {activeTab === "seguranca" && "Segurança"}
                {activeTab === "admin" && (
                  <>
                    {showCargoManagement && (
                      <div className="flex items-center cursor-pointer" onClick={() => setShowCargoManagement(false)}>
                        <ArrowLeft className="mr-2 text-tribunal-blue" size={24} />
                        <span>Área de administrador</span>
                      </div>
                    )}
                    {!showCargoManagement && (
                      <span>Área de administrador</span>
                    )}
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((data) => {
                  if (activeTab === 'perfil') {
                    handleSubmit(data);
                  }
                })} className="space-y-6">
                  {activeTab === "perfil" && (
                    <>
                      <div className="flex flex-col sm:flex-row gap-6 items-start rounded-lg border p-4">
                        <div className="flex-1 space-y-4 ">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="nome"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome completo</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="cpf"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CPF</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="email" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="cargos"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cargos</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={userRoles.join(', ')} disabled />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-4 pt-4 border-t">
                        <Button type="submit" className="bg-tribunal-gold hover:bg-tribunal-gold/90">Salvar alterações</Button>
                      </div>
                    </>
                  )}

                  {activeTab === "conta" && (
                    <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="font-medium">Alterar senha</div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Receba um e-mail para alterar sua senha.
                      </p>
                      <Button variant="outline" onClick={handleForgotPassword}>Alterar senha</Button>
                    </div>
                  </div>
                  )}

                  {activeTab === "admin" && (
                    <div className="space-y-4">
                      {!showCargoManagement && (
                        <>
                          <div className="rounded-lg border p-4">
                            <div className="font-medium">Cargos</div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Área para edição e inclusão de cargos.
                            </p>
                            <Button variant="outline" onClick={() => setShowCargoManagement(!showCargoManagement)}>Cargos</Button>
                          </div>
                          <div className="rounded-lg border p-4">

                            <div className="font-medium">Gerar Token</div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Gere um Token para um novo cadastro.
                            </p>
                            <Button variant="outline" onClick={handleGenerateToken}>Gerar Token</Button>
                            {tokenVisible && generatedToken && (
                              <div className="flex items-center space-x-2 mt-2">
                                <Input
                                  type="text"
                                  value={generatedToken}
                                  readOnly
                                  className="w-full md:w-auto"
                                />
                                <CopyToClipboard text={generatedToken} onCopy={() => toast({
                                    title: "Token copiado",
                                    description: "Token copiado para a área de transferência.",
                                })}>
                                  <Button variant="outline">
                                    Copiar Token
                                  </Button>
                                </CopyToClipboard>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {showCargoManagement && (
                        <div className="flex justify-between rounded-lg border p-4">
                          <div className="w-1/3">
                        <div className="relative w-full">
                          <Input
                            type="text"
                            placeholder="Novo cargo"
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="w-full pl-8"
                          />
                          <PlusCircle className="absolute left-2 top-1/2 transform -translate-y-1/2 text-tribunal-blue" size={20} />
                        </div>
                            <Button onClick={handleAddRole} className="mt-2">Adicionar Cargo</Button>
                          </div>
                          <div className="w-1/2 flex flex-col items-center justify-center">
                            <h2 className="text-xl font-semibold mb-4 text-tribunal-blue">Cargos existentes</h2>
                            <ul className="list-disc list-inside bg-gray-100 p-4 rounded-lg shadow-md">
                              {roles.map((role) => (
                                <li key={role} className="py-1 text-gray-700">{role}</li>
                              ))}
                            </ul>

                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
