import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, User, Loader2 } from "lucide-react";
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
      
      // Tratamento específico para diferentes tipos de erro
      let errorMessage = 'Erro ao fazer login';
      
      if (error.response?.status === 401) {
        errorMessage = 'Usuário ou senha incorretos';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'Dados de login inválidos';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente em alguns instantes.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Tempo limite excedido. Verifique sua conexão e tente novamente.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-8">
        
        {/* Logo e Título */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="flex items-center gap-4 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
              {/* Logo Minimalista */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-400 rounded-xl flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-slate-200 rounded-sm"></div>
                  </div>
                </div>
                {/* Elementos decorativos */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-slate-300 rounded-full opacity-60"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-slate-400 rounded-full opacity-40"></div>
              </div>
              
              <div className="text-left">
                <h1 className="text-3xl font-bold text-white tracking-tight">EngTech</h1>
                <p className="text-sm text-slate-300 font-medium">Sistema Industrial</p>
              </div>
            </div>
          </div>
          
      
        </div>

        {/* Formulário de Login */}
        <Card className="bg-white/5 backdrop-blur-sm border-white/10 shadow-2xl">
          <CardHeader className="space-y-2 pb-6">
            <CardTitle className="text-xl font-semibold text-center text-white">
              Acesso ao Sistema
            </CardTitle>
            <CardDescription className="text-center text-slate-400">
              Digite seu usuário e senha para continuar
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Campo Usuário */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-slate-200">
                  Usuário
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite seu usuário"
                    className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-slate-400 focus:ring-slate-400 h-12"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Campo Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-slate-200">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua senha"
                    className="pl-10 pr-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-slate-400 focus:ring-slate-400 h-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Botão de Login */}
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium h-12 shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entrando...</span>
                  </div>
                ) : (
                  <span>Entrar no Sistema</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-slate-500">
            © 2024 EngTech. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;