import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const EmailConfirmed = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/auth");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card Principal */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          {/* Ícone de Sucesso Animado */}
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center animate-pulse">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <Sparkles className="absolute top-0 right-1/4 w-6 h-6 text-yellow-400 animate-bounce" />
            <Sparkles className="absolute bottom-0 left-1/4 w-4 h-4 text-emerald-400 animate-bounce delay-100" />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-white mb-2">
            Email Confirmado!
          </h1>
          
          {/* Subtítulo */}
          <p className="text-slate-400 mb-6">
            Sua conta foi verificada com sucesso. Agora você pode acessar todas as funcionalidades do PixZen.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl text-left">
              <span className="text-xl">📊</span>
              <span className="text-sm text-slate-300">Dashboard completo com gráficos</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl text-left">
              <span className="text-xl">💬</span>
              <span className="text-sm text-slate-300">Integração WhatsApp com IA</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl text-left">
              <span className="text-xl">🎯</span>
              <span className="text-sm text-slate-300">Metas e controle financeiro</span>
            </div>
          </div>

          {/* Botão */}
          <Button
            onClick={() => navigate("/auth")}
            className="w-full py-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-semibold text-lg rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-300"
          >
            Fazer Login
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          {/* Contador */}
          <p className="text-slate-500 text-sm mt-4">
            Redirecionando em {countdown} segundos...
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-xs mt-6">
          © 2026 PixZen. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default EmailConfirmed;
