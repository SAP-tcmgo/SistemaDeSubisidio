
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, Key } from 'lucide-react';
import Logo from '../components/Logo';
import { useToast } from '@/components/ui/use-toast';

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || !token) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    // Simulação de cadastro
    toast({
      title: "Cadastro realizado",
      description: "Sua conta foi criada com sucesso!",
    });
    console.log('Register with:', { fullName, email, password, token });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="auth-card w-full max-w-md">
        <div className="p-6 sm:p-8">
          <Logo />
          
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Sistema de Análise de Subsídios
          </h1>
          <h2 className="text-xl font-semibold text-center text-gray-700 mb-6">
            Cadastrar-se
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Digite seu nome completo"
                  className="input-field pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
                  className="input-field pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  className="input-field pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="input-group">
              <label htmlFor="token" className="block text-sm font-medium text-gray-700">
                Token
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="token"
                  type="text"
                  placeholder="Digite seu token"
                  className="input-field pl-10"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
            </div>
            
            <button type="submit" className="auth-button mt-6">
              <UserPlus className="h-5 w-5" />
              Cadastrar
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Já possui uma conta? <Link to="/login" className="link font-medium">Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
