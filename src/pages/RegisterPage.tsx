import '../styles/AppLoginRegister.css';
import '../styles/indexLoginRegister.css';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeClosed, Mail, Lock, Key, User, Contact } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { auth, createUserWithEmailAndPassword } from '../firebase';
import { db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [NomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword || !token || !NomeCompleto || !cpf) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Verificar Token
      const tokensCollection = collection(db, "tokens");
      const q = query(tokensCollection, where("token", "==", token), where("usado", "==", false));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({
          title: "Erro",
          description: "Token inválido ou já utilizado.",
          variant: "destructive",
        });
        return;
      }

      const tokenDoc = querySnapshot.docs[0];
      const tokenId = tokenDoc.id;

      // 2. Criar Usuário na Autenticação Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Criar Usuário na coleção 'usuarios'
      const userId = user.uid;
      const CriadoEm = new Date(); // Obter data e hora atuais
      await setDoc(doc(db, "usuarios", userId), {
        id: userId,
        email: email,
        NomeCompleto: NomeCompleto, // Incluir o nome completo
        cpf: cpf, // Incluir o CPF
        CriadoEm: CriadoEm // Incluir a data de criação
      });

      // Criar registro na tabela usuario_cargo
      // 1. Get the 'Servidor' role ID from the 'cargos' collection
      const cargosCollection = collection(db, "cargos");
      const qCargos = query(cargosCollection, where("nome", "==", "Servidor"));
      const querySnapshotCargos = await getDocs(qCargos);

      if (querySnapshotCargos.empty) {
        toast({
          title: "Erro",
          description: "Cargo 'Servidor' não encontrado.",
          variant: "destructive",
        });
        return;
      }

      const cargoDoc = querySnapshotCargos.docs[0];
      const cargoId = cargoDoc.id;

      // 2. Create the 'usuario_cargo' record with the correct cargo_id
      await setDoc(doc(db, "usuario_cargo", userId), {
        usuario_id: userId,
        cargo_id: cargoId, // Servidor
      });

      // 4. Marcar Token como Usado
      await updateDoc(doc(db, "tokens", tokenId), {
        usado: false // Marcar o token como usado
      });

      toast({
        title: "Cadastro realizado",
        description: "Cadastro realizado com sucesso!",
        className: "bg-green-500 text-white",
      });
      navigate('/login');
    } catch (error: any) {
      console.error("Error ao cadastrar:", error);
      toast({
        title: "Erro ao cadastrar",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="login-register-theme">
      <div className="login-background min-h-screen flex items-center justify-center p-4">
        <div className="auth-card w-full max-w-md">
          <div className="p-6 sm:p-8">
            <img src="/LogoTCMGO.svg?v=1" alt="Logo" className="flex item-center h-17 mb-2" />

            <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
              Sistema de Análise de Subsídios
            </h1>
            <h2 className="text-xl font-semibold text-center text-gray-700 mb-3">
              Cadastrar-se
            </h2>

            <form onSubmit={handleSubmit}>
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

              <div className="input-group">
                <label htmlFor="NomeCompleto" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="NomeCompleto"
                    type="text"
                    placeholder="Digite seu nome completo"
                    className="input-field pl-10"
                    value={NomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                  CPF
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Contact className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="cpf"
                    type="text"
                    placeholder="Digite seu CPF"
                    className="input-field pl-10"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
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
                      <EyeClosed className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    className="input-field pl-10 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <div
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeClosed className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              <button type="submit" className="auth-button mt-6">
                Cadastrar-se
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
    </div>
  );
};

export default RegisterPage;
