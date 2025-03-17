import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Logo from '../components/Logo';
import { useToast } from '../components/ui/use-toast';
import { auth, signInWithEmailAndPassword } from '../firebase';
import { db } from '../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
toast({
title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Retrieve user roles from Firestore
      const userId = user.uid;
      const cargosCollection = collection(db, "usuario_cargo");
      const q = query(cargosCollection, where("usuarioId", "==", userId));
      const querySnapshot = await getDocs(q);

      const userRoles = querySnapshot.docs.map(doc => doc.data().cargoId);
      console.log("User roles:", userRoles);

      // Store user roles in local storage or context for use in the application
      localStorage.setItem('userRoles', JSON.stringify(userRoles));

toast({
title: "Login realizado",
        description: "Login realizado com sucesso!",
        className: "bg-green-500 text-white",
      });
      navigate('/index'); // Redirect to the index page
    } catch (error: any) {
      toast({
        title: "Erro ao logar",
        description: error.message,
        variant: "destructive",
      });
      console.error("Error logging in:", error);
    }
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
            Entrar
          </h2>

          <form onSubmit={handleSubmit}>
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

            <button type="submit" className="auth-button mt-6">
              Entrar
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
<p className="text-gray-600">
              Não possui uma conta? <Link to="/cadastrar" className="link font-medium">Cadastrar-se</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
