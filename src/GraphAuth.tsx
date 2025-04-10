import React, { useEffect, useState } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "../authConfig";
import { useIsAuthenticated } from "@azure/msal-react";

const pca = new PublicClientApplication(msalConfig);

const GraphAuth: React.FC = () => {
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      pca
        .acquireTokenSilent({
          scopes: ["Sites.Read.All"], // Permissões necessárias
        })
        .then((response) => {
          setUser(response.account);
        })
        .catch((error) => {
          console.error("Erro ao obter token:", error);
        });
    }
  }, [isAuthenticated]);

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Olá, {user?.name}</p>
        </div>
      ) : (
        <button onClick={() => pca.loginPopup({ scopes: ["Sites.Read.All"] })}>
          Login com Microsoft
        </button>
      )}
    </div>
  );
};

export default GraphAuth;
