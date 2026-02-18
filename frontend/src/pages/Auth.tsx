import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Wallet, ArrowLeft, Eye, EyeOff, Moon, Sun, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().email("Email inválido").max(255, "Email muito longo");
const passwordSchema = z.string().min(6, "Senha deve ter pelo menos 6 caracteres").max(72, "Senha muito longa");
const nameSchema = z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo");

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isLoading: authLoading, signUp, signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pixzen-auth-theme') === 'dark';
    }
    return false;
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Redirect to app if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/app");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    localStorage.setItem('pixzen-auth-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate email
      const emailResult = emailSchema.safeParse(formData.email.trim());
      if (!emailResult.success) {
        toast({
          title: "Email inválido",
          description: emailResult.error.errors[0].message,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Validate password
      const passwordResult = passwordSchema.safeParse(formData.password);
      if (!passwordResult.success) {
        toast({
          title: "Senha inválida",
          description: passwordResult.error.errors[0].message,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      if (!isLogin) {
        // Validate name for signup
        const nameResult = nameSchema.safeParse(formData.name.trim());
        if (!nameResult.success) {
          toast({
            title: "Nome inválido",
            description: nameResult.error.errors[0].message,
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          toast({
            title: "Senhas não coincidem",
            description: "Por favor, verifique suas senhas.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }

        // Sign up via API
        const { error } = await signUp(formData.email.trim(), formData.password, formData.name.trim());
        
        if (error) {
          let errorMessage = "Ocorreu um erro ao criar sua conta.";
          const errMsg = error.message?.toLowerCase() || "";
          
          if (errMsg.includes("already registered") || errMsg.includes("already exists")) {
            errorMessage = "Este email já está registrado. Tente fazer login.";
          } else if (errMsg.includes("invalid email") || errMsg.includes("invalid_email")) {
            errorMessage = "Email inválido.";
          } else if (errMsg.includes("weak password") || errMsg.includes("password")) {
            errorMessage = "Senha muito fraca. Use letras, números e símbolos.";
          } else if (errMsg.includes("rate limit") || errMsg.includes("too many")) {
            errorMessage = "Muitas tentativas. Aguarde um momento.";
          } else if (errMsg.includes("network") || errMsg.includes("fetch")) {
            errorMessage = "Erro de conexão. Verifique sua internet.";
          } else {
            // Show actual error for debugging
            console.error("Signup error:", error);
            errorMessage = error.message || "Erro desconhecido. Tente novamente.";
          }
          
          toast({
            title: "Erro ao criar conta",
            description: errorMessage,
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar sua conta."
        });
        
      } else {
        // Sign in via API
        const { error } = await signIn(formData.email.trim(), formData.password);
        
        if (error) {
          let errorMessage = "Email ou senha incorretos.";
          if (error.message.includes("Invalid login")) {
            errorMessage = "Email ou senha incorretos.";
          } else if (error.message.includes("Email not confirmed")) {
            errorMessage = "Por favor, confirme seu email antes de fazer login.";
          }
          
          toast({
            title: "Credenciais inválidas",
            description: errorMessage,
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
        
        toast({
          title: "Bem-vindo de volta!",
          description: "Login realizado com sucesso."
        });
        
        navigate("/app");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Theme classes
  const theme = {
    bg: isDark ? 'bg-slate-950' : 'bg-white',
    bgCard: isDark ? 'bg-slate-900/95' : 'bg-white/95',
    textPrimary: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-300' : 'text-slate-600',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    border: isDark ? 'border-slate-800' : 'border-slate-200',
    inputBg: isDark ? 'bg-slate-800' : 'bg-white',
    inputBorder: isDark ? 'border-slate-700' : 'border-slate-200',
    inputText: isDark ? 'text-white' : 'text-slate-900',
    inputPlaceholder: isDark ? 'placeholder:text-slate-500' : 'placeholder:text-slate-400',
    floatGradient1: isDark ? 'from-emerald-900/40 to-teal-900/40' : 'from-emerald-100 to-teal-100',
    floatGradient2: isDark ? 'from-teal-900/30 to-cyan-900/30' : 'from-teal-50 to-cyan-100',
    cardShadow: isDark ? 'shadow-2xl shadow-emerald-900/20' : 'shadow-2xl shadow-emerald-500/10',
  };

  if (authLoading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} flex items-center justify-center p-4 transition-colors duration-300`}>
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute w-[500px] h-[500px] rounded-full bg-gradient-to-r ${theme.floatGradient1} blur-3xl -top-32 -left-32`} />
        <div className={`absolute w-[400px] h-[400px] rounded-full bg-gradient-to-r ${theme.floatGradient2} blur-3xl -bottom-32 -right-32`} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header with Back and Theme Toggle */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className={`${theme.textSecondary} hover:${theme.textPrimary}`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <button
            onClick={() => setIsDark(!isDark)}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${
              isDark ? 'bg-slate-800' : 'bg-slate-200'
            }`}
            aria-label={isDark ? 'Modo claro' : 'Modo escuro'}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
              isDark ? 'translate-x-5 bg-emerald-500' : 'translate-x-0 bg-amber-400'
            }`}>
              {isDark ? <Moon className="w-3 h-3 text-white" /> : <Sun className="w-3 h-3 text-white" />}
            </div>
          </button>
        </div>

        <Card className={`p-6 sm:p-8 ${theme.bgCard} backdrop-blur-lg ${theme.border} ${theme.cardShadow} transition-colors duration-300`}>
          {/* Logo */}
          <div className="flex items-center justify-center mb-6 sm:mb-8">
            <img 
              src={isDark ? "/logo-dark.png" : "/logo-light.png"} 
              alt="PixZen" 
              className="h-10 sm:h-12 w-auto"
            />
          </div>

          <h1 className={`text-xl sm:text-2xl font-bold ${theme.textPrimary} text-center mb-2`}>
            {isLogin ? "Bem-vindo de volta" : "Comece seus 7 dias grátis"}
          </h1>
          <p className={`${theme.textMuted} text-center text-sm mb-6 sm:mb-8`}>
            {isLogin 
              ? "Entre com suas credenciais para continuar." 
              : "Crie sua conta e experimente o PixZen gratuitamente."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className={`${theme.textSecondary} font-medium text-sm`}>Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`${theme.inputBg} ${theme.inputBorder} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-500 focus:ring-blue-500`}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className={`${theme.textSecondary} font-medium text-sm`}>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className={`${theme.inputBg} ${theme.inputBorder} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-500 focus:ring-blue-500`}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className={`${theme.textSecondary} font-medium text-sm`}>Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className={`${theme.inputBg} ${theme.inputBorder} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-500 focus:ring-blue-500 pr-10`}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${theme.textMuted} hover:${theme.textSecondary}`}
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className={`${theme.textSecondary} font-medium text-sm`}>Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className={`${theme.inputBg} ${theme.inputBorder} ${theme.inputText} ${theme.inputPlaceholder} focus:border-blue-500 focus:ring-blue-500`}
                  disabled={isSubmitting}
                />
              </div>
            )}

            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-emerald-500/30 py-5 sm:py-6 h-auto font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                isLogin ? "Entrar" : "Criar conta e começar"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className={`${theme.textMuted} text-sm`}>
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ name: "", email: "", password: "", confirmPassword: "" });
                }}
                className="text-emerald-500 hover:text-blue-700 font-semibold ml-1"
                disabled={isSubmitting}
              >
                {isLogin ? "Criar conta" : "Entrar"}
              </button>
            </p>
          </div>

          {!isLogin && (
            <p className={`${theme.textMuted} text-xs text-center mt-6`}>
              Ao criar sua conta, você concorda com nossos Termos de Uso e Política de Privacidade.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Auth;
