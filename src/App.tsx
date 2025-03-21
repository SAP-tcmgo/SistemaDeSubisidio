import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";
import TelaInicial from "./pages/TelaInicial";
import Configuracoes from "./pages/Configuracoes";
import { UserProvider } from "./UserContext";
import Painel from "./pages/Painel";
import "./indexLoginRegister.css";
import "./AppLoginRegister.css";
import "./indexConfiguracoesDashboard.css";
import "./AppConfiguracoesDashboard.css";

const queryClient = new QueryClient();

const App = () => (
  <UserProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastrar" element={<RegisterPage />} />
            <Route path="/telaInicial" element={<TelaInicial />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/painel" element={<Painel />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </UserProvider>
);

export default App;
