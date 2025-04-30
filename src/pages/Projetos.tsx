import React, { useEffect, useState } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";
// Adicione outros imports necessários, como Card, CardHeader, etc., se for usar
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; // Exemplo

// Interface para os itens da lista do SharePoint (ajuste conforme necessário)
interface ProjetoItem {
  id: string;
  fields?: {
    Municipio?: string;
    Num_Lei?: string;
    Ano_Lei?: string;
    // Adicione outros campos relevantes da sua lista SharePoint aqui
    [key: string]: any; // Permite outros campos
  };
}

// Componente para exibir projetos do SharePoint
const Projetos: React.FC = () => {
  const { instance, accounts } = useMsal(); // Instância e contas do MSAL
  const isAuthenticated = useIsAuthenticated(); // Verifica se o usuário está autenticado com MSAL
  const [user, setUser] = useState<any>(null); // Estado para armazenar informações do usuário autenticado
  const [listItems, setListItems] = useState<ProjetoItem[]>([]); // Estado para armazenar os itens da lista buscados
  const [graphError, setGraphError] = useState<string | null>(null); // Estado para armazenar erros da API Graph
  const [isLoading, setIsLoading] = useState<boolean>(false); // Estado para indicar carregamento

  // Efeito para definir o usuário ativo quando a autenticação MSAL muda
  useEffect(() => {
    console.log("Projetos: Efeito de autenticação - Autenticado:", isAuthenticated, "Contas:", accounts);
    if (isAuthenticated && accounts.length > 0) {
      // Define o primeiro usuário da lista como ativo
      setUser(accounts[0]);
      instance.setActiveAccount(accounts[0]); // Informa ao MSAL qual conta está ativa
      console.log("Projetos: Usuário definido a partir das contas:", accounts[0]);
    } else {
      // Se não autenticado ou sem contas, reseta o usuário e os dados
      setUser(null);
      setListItems([]);
      setGraphError(null);
    }
  }, [isAuthenticated, accounts, instance]); // Dependências: re-executa se a autenticação ou contas mudarem

  // Função separada para buscar dados do SharePoint via Graph API
  const fetchSharePointData = async (accessToken: string) => {
    setIsLoading(true); // Inicia carregamento
    setGraphError(null); // Limpa erros anteriores
    setListItems([]); // Limpa itens anteriores

    // IDs do Site e Lista no SharePoint (substitua pelos seus IDs reais)
    const siteId = "fbf1f1d0-319e-4e60-b400-bb5d01994fc8"; // ID do seu site SharePoint
    const listId = "0b47e57e-7525-434c-b6ac-8392118cba0b"; // ID da sua lista SharePoint ('LeisGenericas'?)
    // Endpoint da API Graph para buscar itens da lista, expandindo os campos para obter todos os dados
    const graphEndpoint = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`;

    console.log("Projetos: Buscando dados do SharePoint...");

    try {
      // Faz a requisição para a API Graph
      const graphResponse = await fetch(graphEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`, // Adiciona o token de acesso no cabeçalho
        },
      });

      console.log("Projetos: Resposta da API Graph - Status:", graphResponse.status);

      // Verifica se a resposta da API foi bem-sucedida
      if (!graphResponse.ok) {
        let errorDetail = graphResponse.statusText; // Mensagem de erro padrão
        try {
          // Tenta obter detalhes do erro da resposta JSON
          const errorData = await graphResponse.json();
          errorDetail = errorData?.error?.message || JSON.stringify(errorData); // Usa a mensagem de erro da API ou o JSON completo
          console.error("Projetos: Detalhes do erro da API Graph:", errorData);
        } catch (e) {
          console.error("Projetos: Erro ao parsear resposta de erro da API Graph:", e);
        }
        // Lança um erro com os detalhes obtidos
        throw new Error(`Erro na API Graph: ${graphResponse.status} - ${errorDetail}`);
      }

      // Se a resposta foi OK, processa os dados JSON
      const data = await graphResponse.json();
      setListItems(data.value || []); // Atualiza o estado com os itens da lista (ou array vazio se 'value' não existir)
      console.log("Projetos: Itens da lista carregados:", data.value);
    } catch (error: any) {
      // Captura erros durante a busca ou processamento
      console.error("Projetos: Falha ao buscar dados do SharePoint:", error);
      setGraphError(`Falha ao buscar dados do SharePoint: ${error.message}`); // Define a mensagem de erro no estado
    } finally {
      setIsLoading(false); // Finaliza o carregamento, independentemente de sucesso ou erro
    }
  };


  // Efeito para adquirir token e buscar dados quando o usuário está definido e autenticado
  useEffect(() => {
    console.log("Projetos: Efeito de mudança de usuário - Usuário:", user, "Autenticado:", isAuthenticated);
    if (user && isAuthenticated) {
      // Tenta adquirir o token silenciosamente primeiro
      instance.acquireTokenSilent({
        scopes: ["Sites.Read.All"], // Escopo necessário para ler listas do SharePoint
        account: user, // A conta do usuário autenticado
      }).then((response) => {
        // Se obteve o token silenciosamente, busca os dados
        console.log("Projetos: Token adquirido silenciosamente.");
        fetchSharePointData(response.accessToken);
      }).catch((error) => {
        // Se falhar silenciosamente, pode precisar de interação (popup)
        console.error("Projetos: Erro ao adquirir token silenciosamente:", error);
        setGraphError("Falha ao obter token silenciosamente para a API Graph.");
        // Verifica se o erro requer interação
        if (error instanceof InteractionRequiredAuthError) {
          console.log("Projetos: Tentando adquirir token via popup...");
          // Tenta adquirir o token via popup
          instance.acquireTokenPopup({ scopes: ["Sites.Read.All"] })
            .then((response) => {
              console.log("Projetos: Token adquirido via popup.");
              fetchSharePointData(response.accessToken); // Busca dados após obter token via popup
            })
            .catch(popupError => {
              console.error("Projetos: Erro ao adquirir token via popup:", popupError);
              setGraphError("Falha ao obter token via popup. Verifique as permissões ou tente novamente.");
            });
        } else {
           setGraphError(`Erro ao obter token: ${error.message || 'Erro desconhecido'}`);
        }
      });
    } else {
      // Se o usuário não está definido ou não autenticado, limpa a lista
      setListItems([]);
    }
    // Dependências: re-executa se o usuário, estado de autenticação ou instância MSAL mudarem
  }, [user, isAuthenticated, instance]);

  // Função para iniciar o fluxo de login via popup
  const handleLogin = () => {
    console.log("Projetos: Botão de login clicado.");
    instance.loginPopup({ scopes: ["Sites.Read.All"] }) // Solicita o escopo necessário durante o login
      .then(response => {
         console.log("Projetos: Login via popup bem-sucedido.", response);
         // O useEffect cuidará de definir o usuário e buscar os dados após o login
      })
      .catch(error => {
        console.error("Projetos: Erro durante o login via popup:", error);
        setGraphError("Falha ao realizar o login. Tente novamente.");
      });
  };

  // Renderização do componente
  return (
    <div className="p-4"> {/* Adiciona padding geral */}
      {isAuthenticated && user ? (
        // Conteúdo exibido quando o usuário está autenticado
        <div>
          <p className="mb-4">Olá, {user?.name || user?.username}!</p> {/* Saudação */}

          {/* Exibição de Erro */}
          {graphError && <p className="text-red-600 bg-red-100 p-2 rounded mb-4">Erro: {graphError}</p>}

          <h3 className="text-xl font-semibold mb-3">Itens da Lista do SharePoint (Projetos):</h3>

          {/* Indicador de Carregamento */}
          {isLoading && <p className="text-gray-600 italic">Carregando itens...</p>}

          {/* Lista de Itens */}
          {!isLoading && listItems.length > 0 && (
            <ul className="space-y-3"> {/* Adiciona espaço entre os itens */}
              {listItems.map((item: ProjetoItem) => (
                <li key={item.id} className="border p-3 rounded shadow-sm bg-white"> {/* Estiliza cada item */}
                  {/* Exibe os campos relevantes da lista */}
                  <strong>Município:</strong> {item.fields?.Municipio || 'N/A'} <br />
                  <strong>Número da Lei:</strong> {item.fields?.Num_Lei || 'N/A'} <br />
                  <strong>Ano da Lei:</strong> {item.fields?.Ano_Lei || 'N/A'} <br />
                  {/* Adicione outros campos conforme necessário */}
                  {/* Exemplo:
                  <strong>ID Espelho:</strong> {item.fields?.ID_Espelho || 'N/A'} <br />
                  <strong>Data Inicial:</strong> {item.fields?.Data_Inicial ? new Date(item.fields.Data_Inicial).toLocaleDateString('pt-BR') : 'N/A'} <br />
                  */}
                </li>
              ))}
            </ul>
          )}

          {/* Mensagem se não houver itens e não estiver carregando */}
          {!isLoading && listItems.length === 0 && !graphError && (
            <p className="text-gray-500">Nenhum item encontrado na lista ou a lista está vazia.</p>
          )}
        </div>
      ) : (
        // Conteúdo exibido quando o usuário não está autenticado
        <div className="text-center p-5 border rounded bg-gray-50">
          <p className="mb-4">Por favor, faça login com sua conta Microsoft para visualizar os projetos.</p>
          {/* Exibe erro de login, se houver */}
          {graphError && <p className="text-red-600 mb-4">Erro: {graphError}</p>}
          {/* Botão de Login */}
          <button
            onClick={handleLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Login com Microsoft
          </button>
        </div>
      )}
    </div>
  );
};

// Exporta o componente renomeado
export default Projetos;
