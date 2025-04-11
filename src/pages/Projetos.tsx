import React, { useEffect, useState } from "react";
import { useIsAuthenticated, useMsal } from "@azure/msal-react";

const GraphAuth: React.FC = () => {
  const { instance } = useMsal(); // Get the initialized instance from the context
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      instance
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
  }, [isAuthenticated, instance]); // Include 'instance' in the dependency array

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Olá, {user?.name}</p>
        </div>
      ) : (
        <button onClick={() => instance.loginPopup({ scopes: ["Sites.Read.All"] })}>
          Login com Microsoft
        </button>
      )}
    </div>
  );
};

export default GraphAuth;