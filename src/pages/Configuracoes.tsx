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
import { useUser } from '../Contexts/UserContext';
import { useToast } from "@/components/ui/use-toast";
// Importa hooks do MSAL (necessários para a lógica de migração)
import { useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";

export default function Configuracoes() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("perfil");
  const [tokenVisible, setTokenVisible] = useState(false);
  const [showCargoManagement, setShowCargoManagement] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [roles, setRoles] = useState<string[]>([]); // Lista de cargos existentes
  const { userRoles, userName, userEmail, usercpf, updateUser } = useUser(); // Dados do usuário do contexto
  const { instance, accounts } = useMsal(); // Instância MSAL para autenticação e obtenção de token para Graph API
  const { toast } = useToast(); // Hook para exibir notificações (toasts)

  // Estados para controlar o status da migração de dados do SharePoint
  const [isMigratingLeis, setIsMigratingLeis] = useState(false); // Indica se a migração de leis está em andamento
  const [isMigratingMunicipios, setIsMigratingMunicipios] = useState(false); // Indica se a migração de municípios está em andamento
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [migrationSuccess, setMigrationSuccess] = useState<string | null>(null); // Mensagem de sucesso da migração


  // Busca os cargos existentes no Firestore ao montar o componente
  useEffect(() => {
    const fetchRoles = async () => {
    const rolesCollection = collection(db, 'cargos'); // Referência para a coleção 'cargos'
    const rolesSnapshot = await getDocs(rolesCollection); // Busca os documentos
    const fetchedRoles = rolesSnapshot.docs.map((doc) => doc.data().nome); // Extrai o nome de cada cargo
    setRoles(fetchedRoles); // Atualiza o estado com os cargos buscados
    };

    fetchRoles();
  }, [toast]); // Adiciona toast como dependência se ele for usado dentro do catch

  // Adiciona um novo cargo ao Firestore
  const handleAddRole = async () => {
    if (newRole.trim() !== '') { // Verifica se o nome do cargo não está vazio
      try {
        const rolesCollection = collection(db, 'cargos'); // Referência para a coleção 'cargos'
        // Verifica se o cargo já existe (case-insensitive)
        const q = query(rolesCollection, where('nome', '==', newRole.trim()));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          toast({
            title: 'Cargo já existe',
            description: `O cargo "${newRole.trim()}" já está cadastrado.`,
            variant: 'destructive',
          });
          return; // Interrompe a função se o cargo já existe
        }

        // Adiciona o novo cargo
        await addDoc(rolesCollection, { nome: newRole.trim() });
        setRoles([...roles, newRole.trim()]); // Atualiza o estado local
        setNewRole(''); // Limpa o input
        toast({
          title: 'Cargo adicionado com sucesso!',
          className: 'bg-green-500 text-white',
        });
      } catch (error) {
        console.error('Erro ao adicionar cargo:', error);
        toast({
          title: 'Erro ao adicionar cargo',
          description: 'Ocorreu um erro inesperado. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  const [generatedToken, setGeneratedToken] = useState<string | null>(null); // Estado para armazenar o token gerado

  // Gera um token de cadastro único ou reutiliza um existente não usado
  const handleGenerateToken = async () => {
    setTokenVisible(false); // Esconde o token anterior ao gerar um novo
    setGeneratedToken(null);
    try {
      // 1. Verifica se existe algum token não utilizado no Firestore
      const tokensRef = collection(db, 'tokens');
      const q = query(tokensRef, where('usado', '==', false)); // Query para buscar tokens com 'usado' == false
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 2. Se existe um token não usado, reutiliza-o
        const tokenDoc = querySnapshot.docs[0]; // Pega o primeiro token não usado encontrado
        const token = tokenDoc.data().token;
        setGeneratedToken(token); // Define o token no estado para exibição
        setTokenVisible(true); // Torna o token visível na UI
        toast({
          title: "Token reutilizado",
          description: "Um token de cadastro não utilizado foi encontrado e está pronto para uso.",
        });
        // Nota: O token só será marcado como 'usado' quando um usuário se registrar com ele.
        // A lógica de marcar como usado deve estar na página de registro.
        return; // Interrompe a função aqui
      }

      // 3. Se não existe token não usado, gera um novo
      console.log("Nenhum token não usado encontrado. Gerando um novo...");
      const newToken = nanoid(); // Gera um ID único usando nanoid
      await addDoc(tokensRef, { // Adiciona o novo token ao Firestore
        data_geracao: Timestamp.now(), // Data/hora da geração
        token: newToken, // O token gerado
        usado: false, // Marca como não usado inicialmente
      });

      setGeneratedToken(newToken); // Define o novo token no estado
      setTokenVisible(true); // Torna visível
      toast({
        title: "Novo token gerado",
        description: "Compartilhe este token para permitir um novo cadastro.",
      });
    } catch (error) {
      console.error("Erro ao gerar/verificar token:", error);
      toast({
        title: "Erro ao gerar token",
        description: "Não foi possível gerar ou verificar o token. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Envia um e-mail de redefinição de senha usando Firebase Auth
  const handleForgotPassword = () => {
    if (userEmail) { // Verifica se o e-mail do usuário está disponível
      sendPasswordResetEmail(auth, userEmail) // Chama a função do Firebase Auth
        .then(() => {
          // Sucesso no envio
          console.log("Link de redefinição de senha enviado com sucesso para: " + userEmail);
          toast({
            title: "Link de redefinição enviado",
            description: "Verifique seu e-mail para redefinir sua senha.",
          });
        })
        .catch((error: any) => {
          // Erro no envio
          let errorMessage = "Ocorreu um erro ao enviar o email de redefinição. Verifique se o email está correto.";
          // Personaliza a mensagem de erro se o usuário não for encontrado
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
    } else {
      // Caso o e-mail não esteja disponível no contexto
      toast({
        title: "Erro",
        description: "Não foi possível obter o e-mail do usuário para redefinição de senha.",
        variant: "destructive",
      });
    }
  };

  // Configuração do formulário de perfil usando react-hook-form
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
      cpf: usercpf, // CPF do usuário
    });
  }, [userName, userEmail, usercpf, form]); // Dependências para redefinir o formulário quando os dados do usuário mudam

  // Função chamada ao submeter o formulário de perfil
  const handleSubmit = async (data: any) => {
    console.log("Dados do formulário submetidos:", data);
    try {
      // Chama a função updateUser do contexto para atualizar os dados do usuário
      await updateUser({
        userName: data.nome,
        userEmail: data.email,
        usercpf: data.cpf,
        // userRoles não é atualizado aqui, pois a gestão de cargos é separada
      });
      toast({
        title: "Perfil atualizado com sucesso!",
        className: "bg-green-500 text-white", // Estilo de sucesso
      });
    } catch (error) {
      console.error("Erro ao atualizar o perfil:", error);
      toast({
        title: "Erro ao atualizar o perfil",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // --- Funções de Migração de Dados (SharePoint -> Firebase) ---

  // Adquire um token de acesso do Microsoft Graph API usando MSAL
  const acquireGraphToken = async (): Promise<string> => {
    if (!accounts || accounts.length === 0) {
      throw new Error("Nenhuma conta MSAL encontrada. Faça login primeiro com a conta Microsoft.");
    }
    // Define o escopo necessário para ler/escrever nas listas do SharePoint
    const request = {
      scopes: ["Sites.ReadWrite.All"], // Permissão ampla, pode ser ajustada para Sites.Read.All se apenas leitura for necessária
      account: accounts[0], // Usa a primeira conta logada
    };

    try {
      // Tenta adquirir o token silenciosamente (sem interação do usuário)
      console.log("Tentando adquirir token silenciosamente...");
      const response = await instance.acquireTokenSilent(request);
      console.log("Token adquirido silenciosamente.");
      return response.accessToken;
    } catch (error) {
      // Se a aquisição silenciosa falhar (ex: token expirado, consentimento necessário)
      if (error instanceof InteractionRequiredAuthError) {
        console.warn("Aquisição silenciosa falhou.");
        try {
          // Tenta adquirir o token via popup (requer interação do usuário)
          const response = await instance.acquireTokenPopup(request);
          console.log("Token adquirido via popup.");
          return response.accessToken;
        } catch (popupError) {
          console.error("Falha na aquisição de token via popup:", popupError);
          throw new Error("Falha ao obter token de acesso via popup. Verifique as permissões e tente novamente.");
        }
      } else {
        // Outro erro durante a aquisição do token
        console.error("Falha na aquisição de token:", error);
        throw new Error("Falha ao obter token de acesso para o Microsoft Graph.");
      }
    }
  };

  // Migra dados da lista 'LeisGenericas' do SharePoint para a coleção 'leis' no Firestore
  const handleMigrarLeis = async () => {
    setIsMigratingLeis(true); // Ativa o estado de carregamento
    setMigrationError(null); // Limpa erros anteriores
    setMigrationSuccess(null); // Limpa mensagens de sucesso anteriores
    let addedCount = 0; // Contador de itens adicionados
    let skippedCount = 0; // Contador de itens pulados (já existentes ou sem ID)
    console.log("Iniciando migração de Leis do SharePoint para Firebase...");
    toast({ title: "Iniciando migração de Leis..." });

    try {
      // 1. Obter Token de Acesso
      const accessToken = await acquireGraphToken();

      // IDs do Site e da Lista no SharePoint (substitua se necessário)
      const siteId = "fbf1f1d0-319e-4e60-b400-bb5d01994fc8"; // ID do Site SharePoint
      const listId = "0b47e57e-7525-434c-b6ac-8392118cba0b"; // ID da Lista 'LeisGenericas'

      // Endpoint da API Graph para buscar itens da lista, expandindo os campos
      const graphEndpoint = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`;

      // 2. Chamar a API Graph
      console.log("Buscando dados da lista de Leis no SharePoint...");
      const graphResponse = await fetch(graphEndpoint, {
        headers: { Authorization: `Bearer ${accessToken}` }, // Adiciona o token de acesso ao cabeçalho
      });

      // Verifica se a resposta da API foi bem-sucedida
      if (!graphResponse.ok) {
        const errorData = await graphResponse.text(); // Lê a resposta de erro
        console.error(`Erro na API Graph (${graphResponse.status}): ${errorData}`);
        throw new Error(`Erro ao buscar dados no SharePoint (${graphResponse.status}). Verifique permissões e IDs.`);
      }

      // 3. Processar Dados Recebidos
      const data = await graphResponse.json();
      const spLeis = data.value || []; // Array de itens da lista do SharePoint
      console.log(`Encontradas ${spLeis.length} leis no SharePoint.`);

      // Referência para a coleção 'leis' no Firestore
      const leisCollectionRef = collection(db, 'leis');

      // 4. Iterar e Migrar cada Item
      for (const spItem of spLeis) {
        // Usa o ID do item do SharePoint como identificador único para a migração
        const idMigracao = spItem.id;
        if (!idMigracao) {
            console.warn("Item do SharePoint sem ID, pulando:", spItem.fields);
            skippedCount++;
            continue; // Pula para o próximo item se não houver ID
        }

        // 5. Verificar se o Item já Existe no Firebase
        // Cria uma query para buscar na coleção 'leis' onde 'ID_Migracao' é igual ao ID do item do SharePoint
        const q = query(leisCollectionRef, where('ID_Migracao', '==', idMigracao));
        const querySnapshot = await getDocs(q);

        // 6. Adicionar ao Firebase se Não Existir
        if (querySnapshot.empty) { // Se a query não retornar documentos, o item não existe
          console.log(`Migrando Lei com ID_Migracao: ${idMigracao}`);
          // Mapeia os campos do SharePoint para a estrutura do Firestore
          // Atenção: Os nomes dos campos em `spItem.fields` devem corresponder exatamente aos nomes das colunas no SharePoint.
          const firebaseLeiData = {
            ID_Migracao: idMigracao, // Armazena o ID original do SharePoint para referência
            ID: spItem.fields?.ID || '', // ID interno da lista SP (geralmente numérico)
            ID_Espelho: spItem.fields?.ID_Espelho || '',
            ID_Municipio: spItem.fields?.ID_Municipio || '', // ID de vínculo com a lista de Municípios no SP
            Municipio: spItem.fields?.Municipio || '', // Nome do Município (pode ser redundante se buscar pelo ID_Municipio)
            Num_Lei: Number(spItem.fields?.Num_Lei) || 0, // Converte para número
            Ano_Lei: Number(spItem.fields?.Ano_Lei) || 0, // Converte para número
            Mes_Data_Base: spItem.fields?.Mes_Data_Base || '',
            Indice_Correcao: spItem.fields?.Indice_Correcao || '',
            Num_Processo: Number(spItem.fields?.Num_Processo) || 0, // Converte para número
            Ano_Processo: Number(spItem.fields?.Ano_Processo) || 0, // Converte para número
            Data_Inicial: spItem.fields?.Data_Inicial || '', // Manter como string ou converter para Timestamp?
            Data_Final: spItem.fields?.Data_Final || '', // Manter como string ou converter para Timestamp?
            Anotacao: spItem.fields?.Anotacao || '',
            Situacao: spItem.fields?.Situacao || '',
            Conclusao: spItem.fields?.Conclusao || '',
            Historico_Atualizacao: spItem.fields?.Historico_Atualizacao || '',
            // Metadados (opcional, mas útil)
            Criado_por_SP: spItem.createdBy?.user?.displayName || 'Desconhecido',
            Modificado_SP: spItem.lastModifiedDateTime, // Timestamp da última modificação no SP
            Modificado_por_SP: spItem.lastModifiedBy?.user?.displayName || 'Desconhecido',
            // Adicionar timestamp de migração
            Migrado_em: Timestamp.now(),
          };

          // Adiciona o documento mapeado à coleção 'leis' no Firestore
          await addDoc(leisCollectionRef, firebaseLeiData);
          addedCount++; // Incrementa o contador de adicionados
        } else {
          // Se o item já existe, incrementa o contador de pulados
          // console.log(`Lei com ID_Migracao ${idMigracao} já existe no Firebase. Pulando.`);
          skippedCount++;
        }
      }

      // 7. Finalizar e Notificar
      const successMsg = `Migração de Leis concluída: ${addedCount} adicionadas, ${skippedCount} já existentes/puladas.`;
      console.log(successMsg);
      setMigrationSuccess(successMsg); // Define a mensagem de sucesso no estado
      toast({ title: "Migração de Leis Concluída!", description: successMsg, className: "bg-green-500 text-white" });

    } catch (error: any) {
      // Tratamento de Erro
      console.error("Erro durante a migração de Leis:", error);
      const errorMsg = `Erro na migração de Leis: ${error.message}`;
      setMigrationError(errorMsg); // Define a mensagem de erro no estado
      toast({ title: "Erro na Migração de Leis", description: error.message, variant: "destructive" });
    } finally {
      // Independentemente de sucesso ou erro, desativa o estado de carregamento
      setIsMigratingLeis(false);
    }
  };

  // Migra dados da lista de Municípios do SharePoint para a coleção 'municipios' no Firestore
  const handleMigrarMunicipios = async () => {
    setIsMigratingMunicipios(true); // Ativa o estado de carregamento
    setMigrationError(null); // Limpa erros
    setMigrationSuccess(null); // Limpa sucesso
    let addedCount = 0;
    let skippedCount = 0;
    console.log("Iniciando migração de Municípios do SharePoint para Firebase...");
    toast({ title: "Iniciando migração de Municípios..." });

    try {
      // 1. Obter Token de Acesso
      const accessToken = await acquireGraphToken();

      // IDs do Site e da Lista no SharePoint
      const siteId = "fbf1f1d0-319e-4e60-b400-bb5d01994fc8"; // ID do Site SharePoint
      const listId = "3eba4d1e-9f82-4fbd-b0a3-f28d212093e1"; // ID da Lista de Municípios

      // Endpoint da API Graph
      const graphEndpoint = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`;

      // 2. Chamar a API Graph
      console.log("Buscando dados da lista de Municípios no SharePoint...");
      const graphResponse = await fetch(graphEndpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!graphResponse.ok) {
        const errorData = await graphResponse.text();
        console.error(`Erro na API Graph (${graphResponse.status}): ${errorData}`);
        throw new Error(`Erro ao buscar dados no SharePoint (${graphResponse.status}). Verifique permissões e IDs.`);
      }

      // 3. Processar Dados
      const data = await graphResponse.json();
      const spMunicipios = data.value || [];
      console.log(`Encontrados ${spMunicipios.length} municípios no SharePoint.`);

      // Referência para a coleção 'municipios' no Firestore
      const municipiosCollectionRef = collection(db, 'municipios');

      // 4. Iterar e Migrar
      for (const spItem of spMunicipios) {
        // Usa o campo 'ID_Municipio' do SharePoint como identificador único para a migração
        const idMigracao = spItem.fields?.ID_Municipio;
        if (!idMigracao) {
            console.warn("Item do SharePoint sem ID_Municipio, pulando:", spItem.fields);
            skippedCount++;
            continue;
        }

        // 5. Verificar Existência no Firebase
        const q = query(municipiosCollectionRef, where('ID_Migracao', '==', idMigracao));
        const querySnapshot = await getDocs(q);

        // 6. Adicionar se Não Existir
        if (querySnapshot.empty) {
          console.log(`Migrando Município com ID_Migracao: ${idMigracao}`);
          // Mapeia os campos do SharePoint para a estrutura do Firestore
          const firebaseMunicipioData = {
            ID_Migracao: idMigracao, // Armazena o ID_Municipio original do SP
            ID_Municipio: spItem.fields?.ID_Municipio || '', // Mantém o campo original também
            Municipio_SICOM: spItem.fields?.Municipio_SICOM || '',
            Municipio: spItem.fields?.Municipio || '', // Nome do município
            CNPJ: spItem.fields?.CNPJ || '',
            ID_IBGE: Number(spItem.fields?.ID_IBGE) || 0, // Converte para número
            Municipio_IBGE: spItem.fields?.Municipio_IBGE || '', // Nome do município segundo IBGE
            // Metadados (opcional)
            Criado_por_SP: spItem.createdBy?.user?.displayName || 'Desconhecido',
            Modificado_SP: spItem.lastModifiedDateTime,
            Modificado_por_SP: spItem.lastModifiedBy?.user?.displayName || 'Desconhecido',
            // Timestamp de migração
            Migrado_em: Timestamp.now(),
          };

          await addDoc(municipiosCollectionRef, firebaseMunicipioData);
          addedCount++;
        } else {
          // console.log(`Município com ID_Migracao ${idMigracao} já existe no Firebase. Pulando.`);
          skippedCount++;
        }
      }

      // 7. Finalizar e Notificar
      const successMsg = `Migração de Municípios concluída: ${addedCount} adicionados, ${skippedCount} já existentes/pulados.`;
      console.log(successMsg);
      setMigrationSuccess(successMsg);
      toast({ title: "Migração de Municípios Concluída!", description: successMsg, className: "bg-green-500 text-white" });

    } catch (error: any) {
      // Tratamento de Erro
      console.error("Erro durante a migração de Municípios:", error);
      const errorMsg = `Erro na migração de Municípios: ${error.message}`;
      setMigrationError(errorMsg);
      toast({ title: "Erro na Migração de Municípios", description: error.message, variant: "destructive" });
    } finally {
      // Desativa o estado de carregamento
      setIsMigratingMunicipios(false);
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
                  // Itens do menu lateral de configurações
                  { id: "perfil", label: "Perfil", icon: <User size={18} /> }, // Aba de informações do usuário
                  { id: "conta", label: "Conta", icon: <Mail size={18} /> }, // Aba de configurações da conta (senha)
                  { id: "admin", label: "Área de Administrador", icon: <Shield size={18} /> }, // Aba de funções administrativas
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
                
                {/* Botão de Sair */}
                <button
                  className="flex items-center gap-3 p-4 text-left text-red-500 hover:bg-red-50 mt-auto border-t"
                  onClick={() => {
                    // Confirmação antes de sair
                    if (window.confirm('Deseja realmente sair?')) {
                      auth.signOut().then(() => { // Desloga o usuário do Firebase Auth
                        console.log("Usuário deslogado.");
                        navigate('/login'); // Redireciona para a página de login
                      }).catch((error) => {
                        console.error("Erro ao sair:", error);
                        toast({ title: "Erro ao sair", description: "Não foi possível deslogar. Tente novamente.", variant: "destructive" });
                      });
                    }
                  }}
                >
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
                {/* Título dinâmico baseado na aba ativa */}
                {activeTab === "perfil" && "Informações de Perfil"}
                {activeTab === "conta" && "Configurações de Conta"}
                {/* {activeTab === "seguranca" && "Segurança"}  Aba de segurança removida ou não implementada */}
                {activeTab === "admin" && ( // Lógica para o título da aba Admin (com botão voltar)
                  <>
                    {showCargoManagement ? ( // Se estiver na gestão de cargos, mostra botão voltar
                      <div className="flex items-center cursor-pointer" onClick={() => setShowCargoManagement(false)}>
                        <ArrowLeft className="mr-2 text-tribunal-blue" size={20} />
                        <span>Gerenciar Cargos</span>
                      </div>
                    ) : ( // Senão, mostra o título padrão
                      <span>Área de Administrador</span>
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
                      {/* Seção de Informações do Perfil */}
                      <div className="flex flex-col sm:flex-row gap-6 items-start rounded-lg border p-4 bg-white shadow-sm">
                        <div className="flex-1 space-y-4 ">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Campo Nome Completo */}
                            <FormField
                              control={form.control}
                              name="nome"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome Completo</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Seu nome completo" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            {/* Campo CPF */}
                            <FormField
                              control={form.control}
                              name="cpf"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CPF</FormLabel>
                                  <FormControl>
                                    {/* Adicionar máscara de CPF aqui se desejado */}
                                    <Input {...field} placeholder="000.000.000-00" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            {/* Campo Email */}
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>E-mail</FormLabel>
                                  <FormControl>
                                    <Input {...field} type="email" placeholder="seu.email@exemplo.com" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            {/* Campo Cargos (Apenas Leitura) */}
                            <FormField
                              control={form.control}
                              name="cargos"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cargos</FormLabel>
                                  <FormControl>
                                    {/* Exibe os cargos do usuário separados por vírgula, desabilitado para edição */}
                                    <Input {...field} value={userRoles.join(', ')} disabled className="bg-gray-100" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                      {/* Botão Salvar Alterações */}
                      <div className="flex justify-end space-x-4 pt-4 border-t mt-4">
                        <Button type="submit" className="bg-tribunal-gold hover:bg-tribunal-gold/90 text-white">Salvar Alterações</Button>
                      </div>
                    </>
                  )}

                  {/* Seção de Configurações da Conta */}
                  {activeTab === "conta" && (
                    <div className="space-y-4">
                      <div className="rounded-lg border p-4 bg-white shadow-sm">
                        <div className="font-medium text-lg text-tribunal-blue">Alterar Senha</div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Receba um e-mail para criar uma nova senha.
                        </p>
                        {/* Botão para enviar e-mail de redefinição */}
                        <Button variant="outline" onClick={handleForgotPassword}>Enviar E-mail de Redefinição</Button>
                      </div>
                      {/* Outras configurações de conta podem ser adicionadas aqui */}
                    </div>
                  )}

                  {/* Seção de Administração */}
                  {activeTab === "admin" && (
                    <div className="space-y-6">
                      {!showCargoManagement ? ( // Mostra as opções principais de admin
                        <>
                          {/* Card para Gerenciar Cargos */}
                          <div className="rounded-lg border p-4 bg-white shadow-sm">
                            <div className="font-medium text-lg text-tribunal-blue">Gerenciar Cargos</div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Adicione ou visualize os cargos disponíveis no sistema.
                            </p>
                            <Button variant="outline" onClick={() => setShowCargoManagement(true)}>Acessar Gestão de Cargos</Button>
                          </div>

                          {/* Card para Gerar Token */}
                          <div className="rounded-lg border p-4 bg-white shadow-sm">
                            <div className="font-medium text-lg text-tribunal-blue">Gerar Token de Cadastro</div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Gere um token único para permitir o cadastro de um novo usuário.
                            </p>
                            <Button variant="outline" onClick={handleGenerateToken}>
                              {generatedToken ? "Gerar Novo Token" : "Gerar Token"}
                            </Button>
                            {/* Exibição do token gerado */}
                            {tokenVisible && generatedToken && (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-3">
                                <Input
                                  type="text"
                                  value={generatedToken}
                                  readOnly
                                  className="w-full sm:w-auto flex-grow bg-gray-100"
                                  aria-label="Token gerado"
                                />
                                <CopyToClipboard text={generatedToken} onCopy={() => toast({
                                    title: "Token Copiado!",
                                    description: "O token foi copiado para a área de transferência.",
                                })}>
                                  <Button variant="outline" className="w-full sm:w-auto">
                                    Copiar Token
                                  </Button>
                                </CopyToClipboard>
                              </div>
                            )}
                          </div>

                          {/* Card para Migração de Dados */}
                          <div className="rounded-lg border p-4 bg-white shadow-sm">
                            <div className="font-medium text-lg text-tribunal-blue">Migração de Dados (SharePoint → Firebase)</div>
                            <p className="text-sm text-muted-foreground mb-4">
                              Importar dados das listas 'LeisGenericas' e 'Municipios' do SharePoint para o Firebase. Use com cautela.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                {/* Botão Migrar Leis */}
                                <Button
                                  variant="outline"
                                  onClick={handleMigrarLeis}
                                  disabled={isMigratingLeis || isMigratingMunicipios} // Desabilita se alguma migração estiver ocorrendo
                                  className="w-full sm:w-auto"
                                >
                                  {isMigratingLeis ? 'Migrando Leis...' : 'Migrar Leis'}
                                </Button>
                                {/* Botão Migrar Municípios */}
                                <Button
                                  variant="outline"
                                  onClick={handleMigrarMunicipios}
                                  disabled={isMigratingLeis || isMigratingMunicipios} // Desabilita se alguma migração estiver ocorrendo
                                  className="w-full sm:w-auto"
                                >
                                  {isMigratingMunicipios ? 'Migrando Municípios...' : 'Migrar Municípios'}
                                </Button>
                            </div>
                             {/* Mensagens de Status da Migração */}
                             {migrationSuccess && (
                                <p className="mt-4 text-sm text-green-600">{migrationSuccess}</p>
                             )}
                             {migrationError && (
                                <p className="mt-4 text-sm text-red-600">{migrationError}</p>
                             )}
                          </div>
                        </>
                      ) : ( // Mostra a interface de gestão de cargos
                        <div className="flex flex-col md:flex-row justify-between gap-6 rounded-lg border p-6 bg-white shadow-sm">
                          {/* Seção para Adicionar Novo Cargo */}
                          <div className="w-full md:w-1/3 space-y-3">
                            <h3 className="text-lg font-semibold text-tribunal-blue">Adicionar Novo Cargo</h3>
                            <div className="relative w-full">
                              <FormLabel htmlFor="new-role-input">Nome do Cargo</FormLabel>
                              <div className="relative mt-1">
                                <Input
                                  id="new-role-input"
                                  type="text"
                                  placeholder="Ex: Analista Judiciário"
                                  value={newRole}
                                  onChange={(e) => setNewRole(e.target.value)}
                                  className="w-full pl-8" // Padding para o ícone
                                />
                                <PlusCircle className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                              </div>
                            </div>
                            <Button onClick={handleAddRole} className="w-full bg-secondary hover:bg-secondary/90">Adicionar Cargo</Button>
                          </div>
                          {/* Seção para Listar Cargos Existentes */}
                          <div className="w-full md:w-1/2">
                            <h3 className="text-lg font-semibold mb-3 text-tribunal-blue">Cargos Existentes</h3>
                            {roles.length > 0 ? (
                              <ul className="list-disc list-inside bg-gray-50 p-4 rounded-lg border max-h-60 overflow-y-auto">
                                {roles.sort((a, b) => a.localeCompare(b)).map((role) => ( // Ordena alfabeticamente
                                  <li key={role} className="py-1 text-gray-700">{role}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-gray-500 italic">Nenhum cargo cadastrado.</p>
                            )}
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
