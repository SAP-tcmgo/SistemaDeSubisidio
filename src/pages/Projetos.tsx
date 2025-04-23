import React, { useEffect, useState } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { InteractionRequiredAuthError } from "@azure/msal-browser";

// ... (rest of your imports and interface)

const GraphAuth: React.FC = () => {
  const { instance, accounts } = useMsal(); // Get accounts array
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState<any>(null);
  const [listItems, setListItems] = useState<any[]>([]);
  const [graphError, setGraphError] = useState<string | null>(null);

  useEffect(() => {
    console.log("GraphAuth: useEffect (auth change) - isAuthenticated:", isAuthenticated, "accounts:", accounts);
    if (isAuthenticated && accounts.length > 0) {
      setUser(accounts[0]);
      instance.setActiveAccount(accounts[0]);
      console.log("GraphAuth: Set user from accounts array:", accounts[0]);
    } else {
      setUser(null);
      setListItems([]);
      setGraphError(null);
    }
  }, [isAuthenticated, accounts, instance]);

  useEffect(() => {
    console.log("GraphAuth: useEffect (user change) - user:", user, "isAuthenticated:", isAuthenticated);
    if (user && isAuthenticated) {
      instance.acquireTokenSilent({
        scopes: ["Sites.Read.All"],
        account: user,
      }).then(async (response) => {
        const accessToken = response.accessToken;
        console.log("GraphAuth: Access Token:", accessToken);
        const siteId = "fbf1f1d0-319e-4e60-b400-bb5d01994fc8";
        const listId = "0b47e57e-7525-434c-b6ac-8392118cba0b";
        const graphEndpoint = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`;

        setGraphError(null);
        setListItems([]);

        try {
          const graphResponse = await fetch(graphEndpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          console.log("GraphAuth: Graph API Response Status:", graphResponse.status);

          if (!graphResponse.ok) {
            let errorDetail = graphResponse.statusText;
            try {
              const errorData = await graphResponse.json();
              errorDetail = errorData?.error?.message || JSON.stringify(errorData);
              console.error("GraphAuth: Graph API Error Details:", errorData);
            } catch (e) {
              console.error("GraphAuth: Error parsing Graph API error response:", e);
            }
            throw new Error(`Graph API error: ${graphResponse.status} - ${errorDetail}`);
          }

          const data = await graphResponse.json();
          setListItems(data.value || []);
          console.log("GraphAuth: List Items:", data.value);
        } catch (error: any) {
          console.error("GraphAuth: Falha ao buscar dados do SharePoint:", error);
          setGraphError(`Falha ao buscar dados do SharePoint: ${error.message}`);
        }
      }).catch((error) => {
        console.error("GraphAuth: Error acquiring token:", error);
        setGraphError("Falha ao obter token para a API Graph.");
        if (error instanceof InteractionRequiredAuthError) {
          instance.acquireTokenPopup({ scopes: ["Sites.Read.All"] }).catch(popupError => {
            console.error("GraphAuth: Error acquiring token via popup (second useEffect):", popupError);
            setGraphError("Falha ao obter token via popup.");
          });
        }
      });
    } else {
      setListItems([]);
    }
  }, [user, isAuthenticated, instance]);

  const handleLogin = () => {
    console.log("GraphAuth: Login button clicked.");
    instance.loginPopup({ scopes: ["Sites.Read.All"] }).catch(error => {
      console.error("GraphAuth: Error during login popup (button):", error);
      setGraphError("Falha ao abrir o popup de login.");
    });
  };

  return (
    <div>
      {isAuthenticated && user ? (
        <div>
          <p>Olá, {user?.name || user?.username}</p>
          {graphError && <p style={{ color: 'red' }}>Erro: {graphError}</p>}
          <h3>Itens da Lista do SharePoint (Projetos):</h3>
          {listItems.length > 0 ? (
          <ul>
          {listItems.map((item: any) => (
            <li key={item.id}>
              {/* Try displaying the Municipio as the main title */}
              <strong>Município:</strong> {item.fields?.Municipio || 'N/A'} <br />
              <strong>Número da Lei:</strong> {item.fields?.Num_Lei || 'N/A'} <br />
              <strong>Ano da Lei:</strong> {item.fields?.Ano_Lei || 'N/A'} <br />
              {/* You can add more fields here as needed, e.g.: */}
              {/* <strong>ID Espelho:</strong> {item.fields?.ID_Espelho || 'N/A'} <br /> */}
              {/* <strong>Data Inicial:</strong> {item.fields?.Data_Inicial ? new Date(item.fields.Data_Inicial).toLocaleDateString() : 'N/A'} <br /> */}
              {/* ... other fields */}
            </li>
          ))}
        </ul>
          ) : (
            <p>{graphError ? 'Não foi possível carregar os itens.' : 'Carregando itens...'}</p>
          )}
        </div>
      ) : (
        <div>
          <p>Por favor, faça login para ver os projetos.</p>
          {graphError && <p style={{ color: 'red' }}>Erro: {graphError}</p>}
          <button onClick={handleLogin}>
            Login com Microsoft
          </button>
        </div>
      )}
    </div>
  );
};

export default GraphAuth;