import React, { Suspense, lazy, useEffect, useState } from "react"; // Import Suspense and lazy
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./Contexts/UserContext";
import { DadosProvider } from './Contexts/DadosContext'; // Importe o contexto


// Lazy load page components
const LoginPage = lazy(() => import("./pages/Login/LoginPage"));
const RegisterPage = lazy(() => import("./pages/Login/RegisterPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TelaInicial = lazy(() => import("./pages/TelaInicial"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const Painel = lazy(() => import("./pages/Painel"));
const DadosMunicipioEResponsaveis = lazy(() => import("./pages/Analise/MunicipioEResponsaveis"));
const TratamentoLeis = lazy(() => import("./pages/Analise/TratamentoLeis"));
const Fixacao = lazy(() => import("./pages/Analise/Fixacao"));
const CadastroADM = lazy(() => import("./pages/CadastroADM"))
const GraphAuth = lazy(() => import("./pages/Projetos"))

const queryClient = new QueryClient();

const LoadingFallback = () => <div></div>;

const App = () => {

    return (
        <UserProvider>
            <QueryClientProvider client={queryClient}>
                <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <DadosProvider>
                            <BrowserRouter>
                                <Suspense fallback={<LoadingFallback />}>
                                    <Routes>
                                        <Route path="/" element={<Navigate to="/login" replace />} />
                                    <Route path="/login" element={<LoginPage />} />
                                    <Route path="/cadastrar" element={<RegisterPage />} />
                                    <Route path="/telaInicial" element={<TelaInicial />} />
                                    <Route path="/configuracoes" element={<Configuracoes />} />
                                    <Route path="/painel" element={<Painel />} />
                                    <Route path="/MunicipioEResponsaveis" element={<DadosMunicipioEResponsaveis />} />
                                    <Route path="/TratamentoLeis" element={<TratamentoLeis />} />
                                    <Route path="/Fixacao" element={<Fixacao />} />
                                    <Route path="/CadastroADM" element={<CadastroADM />} />
                                    <Route path="/Projetos" element={<GraphAuth />} />
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </Suspense>
                        </BrowserRouter>
                    </DadosProvider>
                </TooltipProvider>
            </QueryClientProvider>
        </UserProvider>
    );
}

export default App;
