import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../AppConfiguracoesDashboard.css';
import '../indexConfiguracoesDashboard.css';
import { User, Mail, Shield, LogOut, ArrowLeft} from 'lucide-react';
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
  const { userRoles, userName, userEmail, usercpf, updateUser } = useUser();

  const { toast } = useToast()
  
  const form = useForm({
    defaultValues: {
      nome: userName,
      email: userEmail,
      cargos: userRoles,
      cpf: usercpf,
    }
  });

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
    <div className="container mx-auto py-6 px-4 md:px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center mb-6 cursor-pointer" onClick={() => navigate('/TelaInicial')}>
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
                
                <button className="flex items-center gap-3 p-4 text-left text-red-500 hover:bg-red-50 mt-auto border-t">
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
                {activeTab === "admin" && "Área de administrador"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  {activeTab === "perfil" && (
                    <>
                      <div className="flex flex-col sm:flex-row gap-6 items-start">
                        <div className="flex-1 space-y-4">
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
                    </>
                  )}

                  {activeTab === "conta" && (
                    <div className="space-y-4">
                    <div className="rounded-lg border p-4">
                      <div className="font-medium">Alterar senha</div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Receba um e-mail para alterar sua senha.
                      </p>
                      <Button variant="outline">Alterar senha</Button>
                    </div>
                  </div>
                  )}

                  {activeTab === "admin" && (
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4">
                        <div className="font-medium">Cargos</div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Área para edição e inclusão de cargos.
                        </p>
                        <Button variant="outline">Cargos</Button>
                      </div>
                      
                      <div className="rounded-lg border p-4">
                        <div className="font-medium">Gerar Token</div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Gere um Token para um novo cadastro.
                        </p>
                        <Button variant="outline">Gerar Token</Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Botões de ação */}
                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <Button type="submit" className="bg-tribunal-gold hover:bg-tribunal-gold/90">Salvar alterações</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
