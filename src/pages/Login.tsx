import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Eye, EyeOff, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await authService.login(formData.username, formData.password);
      
      // Usar o contexto de autenticação
      login(response.token, response.user);
      
      toast.success('Login realizado com sucesso!');
      navigate("/");
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.response?.data?.error || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin(e as any);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-lg">
                <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  {/* Engrenagem externa */}
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  {/* Engrenagem interna */}
                  <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
                  {/* Barras de progresso no centro */}
                  <rect x="9.5" y="9" width="1.5" height="3" fill="white"/>
                  <rect x="11.25" y="8" width="1.5" height="5" fill="white"/>
                  <rect x="13" y="7" width="1.5" height="7" fill="white"/>
                </svg>
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold text-gray-800">EngTech</h1>
                <p className="text-sm text-gray-600">Sistema Industrial</p>
              </div>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-800">
              Bem-vindo
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Faça login para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Nome de Usuário
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Digite seu nome de usuário"
                    className="pl-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    value={formData.username}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className="pl-10 pr-10 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Entrando...
                  </div>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="text-center space-y-3">
              <p className="text-xs text-gray-500">
                Esqueceu sua senha? Entre em contato com o administrador
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Building2 className="h-3 w-3" />
                <span>Mizu Cimentos - Sistema Industrial</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            EngTech v1.0 - Sistema de Gestão Industrial
          </p>
          <p className="text-xs text-gray-400">
            © 2024 Mizu Cimentos. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;