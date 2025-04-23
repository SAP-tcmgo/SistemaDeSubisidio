import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
  auth: {
    clientId: "8c543743-01bb-406b-931d-06cab4eda051",
    authority: "https://login.microsoftonline.com/0f68b930-f2f7-4a2e-85b2-afc955274427",
    redirectUri: "http://localhost:8080/Projetos", // This URI still needs to be registered in Azure AD, even for popup flow
    postLogoutRedirectUri: "http://localhost:8080/login", // Or "/" if you prefer landing home after logout
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};
