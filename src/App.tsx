// App.tsx
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login/LoginPage";
import RegisterPage from "./pages/Login/RegisterPage";
import NotFound from "./pages/NotFound";
import TelaInicial from "./pages/TelaInicial";
import Configuracoes from "./pages/Configuracoes";
import { UserProvider } from "./Contexts/UserContext";
import Painel from "./pages/Painel";
import DadosMunicipioEResponsaveis from "./pages/Analise/MunicipioEResponsaveis";
import TratamentoLeis from "./pages/Analise/TratamentoLeis";
import { DadosProvider } from './Contexts/DadosContext'; // Importe o contexto

const queryClient = new QueryClient();

const App = () => (
  <UserProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <DadosProvider> {/* Envolva a aplicação com o DadosProvider */}
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/cadastrar" element={<RegisterPage />} />
              <Route path="/telaInicial" element={<TelaInicial />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/painel" element={<Painel />} />
              <Route path="/DadosMunicipioEResponsaveis" element={<DadosMunicipioEResponsaveis />} />
              <Route path="/TratamentoLeis" element={<TratamentoLeis />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DadosProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </UserProvider>
);

export default App;
