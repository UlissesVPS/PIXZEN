import { useNavigate } from "react-router-dom";
import { ArrowRight, Shield, TrendingUp, Wallet, PieChart, Bell, Smartphone, Monitor, Check, Star, Zap, Moon, Sun, Sparkles, BarChart3, CreditCard, Target, Play, Eye, MessageCircle, Mic, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useEffect, useState, useRef } from "react";
import { PLANS } from "@/config/plans";

const Landing = () => {
  const navigate = useNavigate();
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set());
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pixzen-landing-theme') === 'dark';
    }
    return true;
  });
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    localStorage.setItem('pixzen-landing-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const cardIndex = cardRefs.current.indexOf(entry.target as HTMLDivElement);
          if (cardIndex !== -1 && entry.isIntersecting) {
            setVisibleCards((prev) => new Set([...prev, cardIndex]));
          }
          
          const sectionId = entry.target.getAttribute('data-section');
          if (sectionId && entry.isIntersecting) {
            setVisibleSections((prev) => new Set([...prev, sectionId]));
          }
        });
      },
      { threshold: 0.1 }
    );

    cardRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const features = [
    { icon: Wallet, title: "Controle Total", desc: "Gerencie receitas e despesas com facilidade e precisão" },
    { icon: PieChart, title: "Análises Visuais", desc: "Gráficos intuitivos para entender suas finanças" },
    { icon: TrendingUp, title: "Metas Financeiras", desc: "Defina e acompanhe seus objetivos de economia" },
    { icon: Bell, title: "Lembretes", desc: "Nunca esqueça uma conta importante" },
    { icon: Shield, title: "Segurança", desc: "Seus dados sempre protegidos com criptografia" },
    { icon: Zap, title: "Rapidez", desc: "Interface otimizada e responsiva" },
  ];

  const stats = [
    { value: "50K+", label: "Usuários Ativos" },
    { value: "R$ 2B+", label: "Gerenciados" },
    { value: "4.9", label: "Avaliação" },
    { value: "99.9%", label: "Uptime" },
  ];

  const theme = {
    bg: isDark ? 'bg-slate-950' : 'bg-slate-50',
    bgCard: isDark ? 'bg-slate-900/80' : 'bg-white',
    bgCardGlass: isDark ? 'bg-slate-900/60 backdrop-blur-xl' : 'bg-white/80 backdrop-blur-xl',
    textPrimary: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-300' : 'text-slate-600',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    border: isDark ? 'border-slate-800/50' : 'border-slate-200',
    headerBg: isDark ? 'bg-slate-950/90' : 'bg-white/90',
    cardShadow: isDark ? 'shadow-2xl shadow-emerald-900/20' : 'shadow-xl shadow-emerald-100/50',
    badgeBg: isDark ? 'bg-emerald-950/50' : 'bg-emerald-50',
    testimonialBg: isDark ? 'bg-slate-900/50' : 'bg-slate-100/50',
    emeraldGlow: isDark ? 'shadow-emerald-500/20' : 'shadow-emerald-500/10',
  };

  const handleDemo = () => {
    localStorage.setItem('pixzen-demo-mode', 'true');
    window.location.href = '/app';
  };

  return (
    <div className={`min-h-screen ${theme.bg} overflow-x-hidden transition-colors duration-500`}>
      {/* Animated Emerald Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute w-[600px] h-[600px] sm:w-[900px] sm:h-[900px] rounded-full ${isDark ? 'bg-emerald-950/40' : 'bg-emerald-100/60'} blur-[100px] -top-40 -left-40 animate-pulse`} style={{ animationDuration: '8s' }} />
        <div className={`absolute w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] rounded-full ${isDark ? 'bg-teal-950/30' : 'bg-teal-100/50'} blur-[80px] top-1/4 -right-40 animate-pulse`} style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className={`absolute w-[400px] h-[400px] rounded-full ${isDark ? 'bg-cyan-950/20' : 'bg-cyan-100/40'} blur-[60px] bottom-1/4 left-1/4 animate-pulse`} style={{ animationDuration: '12s', animationDelay: '4s' }} />
        
        <div className={`absolute w-2 h-2 rounded-full ${isDark ? 'bg-emerald-500/30' : 'bg-emerald-400/40'} top-1/4 left-1/4 animate-bounce`} style={{ animationDuration: '3s' }} />
        <div className={`absolute w-3 h-3 rounded-full ${isDark ? 'bg-teal-500/20' : 'bg-teal-400/30'} top-1/3 right-1/3 animate-bounce`} style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className={`absolute w-2 h-2 rounded-full ${isDark ? 'bg-emerald-400/25' : 'bg-emerald-300/35'} bottom-1/3 right-1/4 animate-bounce`} style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 ${theme.headerBg} backdrop-blur-xl border-b ${theme.border}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center">
              <img 
                src={isDark ? "/logo-dark.png" : "/logo-light.png"} 
                alt="PixZen" 
                className="h-8 sm:h-10 w-auto"
              />
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle standalone isDarkMode={isDark} onToggle={() => setIsDark(!isDark)} />

              <Button 
                onClick={() => navigate("/auth")}
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-semibold shadow-lg shadow-emerald-500/30 px-4 sm:px-6 border-0"
              >
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Clean with Demo CTA */}
      <section className="relative pt-28 sm:pt-40 pb-16 sm:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${theme.badgeBg} border ${theme.border} mb-8 shadow-lg ${theme.emeraldGlow}`}>
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className={`text-sm font-semibold ${theme.textPrimary}`}>
              +50.000 usuários já transformaram suas finanças
            </span>
          </div>

          <h1 className={`text-4xl sm:text-5xl lg:text-7xl font-extrabold ${theme.textPrimary} mb-6 leading-tight`}>
            Suas finanças em{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              harmonia total
            </span>
          </h1>

          <p className={`text-lg sm:text-xl lg:text-2xl ${theme.textSecondary} max-w-2xl mx-auto mb-10 leading-relaxed`}>
            Controle suas finanças pessoais com elegância. 
            Simples, poderoso e disponível em todas as plataformas.
          </p>

          {/* Demo CTA Section */}
          <div 
            className={`relative max-w-xl mx-auto p-8 sm:p-10 rounded-3xl ${theme.bgCardGlass} border ${theme.border} ${theme.cardShadow} mb-10`}
            data-section="demo-cta"
            ref={(el) => el && sectionRefs.current.set('demo-cta', el)}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 rounded-3xl blur-xl" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-emerald-500" />
                <span className={`text-sm font-semibold ${theme.textMuted} uppercase tracking-wider`}>
                  Veja na prática
                </span>
              </div>
              
              <h3 className={`text-xl sm:text-2xl font-bold ${theme.textPrimary} mb-3`}>
                Quer ver como funciona por dentro?
              </h3>
              
              <p className={`${theme.textSecondary} mb-6 text-sm sm:text-base leading-relaxed`}>
                Explore todas as funcionalidades do PixZen sem precisar criar conta. 
                Veja dashboards, gráficos, transações e muito mais em ação.
                <span className={`block mt-2 font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  Sem cadastro, sem compromisso. Apenas clique e explore!
                </span>
              </p>

              <Button 
                size="lg"
                onClick={handleDemo}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white text-lg px-12 py-7 rounded-2xl shadow-2xl shadow-emerald-500/40 font-bold border-0 transition-all duration-300 hover:shadow-emerald-500/60 hover:scale-105 group"
              >
                <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                Ver Demonstração ao Vivo
                <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>

              <p className={`mt-4 text-xs ${theme.textMuted}`}>
                ⚡ Acesso instantâneo • Sem login necessário
              </p>
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-base px-8 py-5 rounded-xl font-semibold transition-all duration-300 bg-emerald-500/10 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20"
            >
              Criar conta grátis
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {/* Platforms */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-10 ${theme.textMuted}`}>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Smartphone className="w-5 h-5 text-emerald-500" />
              <span>iOS & Android</span>
            </div>
            <div className={`hidden sm:block w-px h-4 ${isDark ? 'bg-emerald-800' : 'bg-emerald-200'}`} />
            <div className="flex items-center gap-2 text-sm font-medium">
              <Monitor className="w-5 h-5 text-emerald-500" />
              <span>Windows, Mac & Linux</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-10 sm:py-16 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`text-center p-4 sm:p-6 rounded-2xl ${theme.bgCardGlass} border ${theme.border} ${theme.cardShadow} hover:border-emerald-500/30 transition-all duration-300 group`}
              >
                <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">
                  {stat.value}
                </div>
                <div className={`text-xs sm:text-sm font-medium ${theme.textMuted} mt-1`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 relative z-20">
        <div className="max-w-7xl mx-auto">

          {/* Features Grid */}
          <div className="text-center mb-10 sm:mb-16">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${theme.textPrimary} mb-3 sm:mb-4 px-4`}>
              Tudo que você precisa para{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                controlar suas finanças
              </span>
            </h2>
            <p className={`${theme.textSecondary} max-w-xl mx-auto text-sm sm:text-base px-4`}>
              Funcionalidades pensadas para simplificar sua vida financeira
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                ref={(el) => (cardRefs.current[index] = el)}
                className={`p-6 sm:p-8 rounded-2xl ${theme.bgCardGlass} border ${theme.border} ${theme.cardShadow} transition-all duration-500 hover:border-emerald-500/50 hover:shadow-emerald-500/10 group ${
                  visibleCards.has(index) 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 sm:mb-5 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${theme.textPrimary} mb-2`}>
                  {feature.title}
                </h3>
                <p className={`${theme.textSecondary} text-sm sm:text-base leading-relaxed`}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transactions Section */}
      {/* Features CTA Section */}
      <section className={`py-12 sm:py-20 px-4 ${theme.testimonialBg} relative z-30`}>
        <div className="max-w-4xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${theme.badgeBg} border ${theme.border} mb-6`}>
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span className={`text-xs font-semibold ${theme.textPrimary}`}>Gestão Completa</span>
          </div>
          
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${theme.textPrimary} mb-4`}>
            Quer ver tudo isso{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              funcionando?
            </span>
          </h2>
          
          <p className={`${theme.textSecondary} text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto`}>
            Não precisa imaginar. Clique no botão abaixo e explore o PixZen por dentro. 
            Veja dashboards, gráficos, transações e todas as funcionalidades em tempo real.
          </p>

          <div className="space-y-4">
            {['Categorização automática', 'Filtros avançados', 'Exportação de relatórios', 'Dashboard em tempo real'].map((item, i) => (
              <div key={i} className={`inline-flex items-center gap-3 ${theme.textSecondary} mx-2`}>
                <div className="w-5 h-5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm sm:text-base">{item}</span>
              </div>
            ))}
          </div>

          <Button 
            size="lg"
            onClick={handleDemo}
            className="mt-10 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white text-lg px-10 py-6 rounded-2xl shadow-2xl shadow-emerald-500/40 font-bold border-0 transition-all duration-300 hover:shadow-emerald-500/60 hover:scale-105 group"
          >
            <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Explorar o App Agora
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-20 px-4 relative z-40">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${theme.textPrimary} mb-3 px-4`}>
              O que nossos usuários{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                dizem
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { name: "Marina S.", role: "Profissional de RH", text: "Finalmente consegui organizar minhas finanças pessoais. O PixZen é incrível!" },
              { name: "Carlos R.", role: "Autônomo", text: "Interface linda e super fácil de usar. Recomendo para todos!" },
              { name: "Ana P.", role: "Designer", text: "Melhor investimento que fiz. Agora tenho controle total das minhas finanças." },
            ].map((testimonial, index) => (
              <div
                key={index}
                className={`p-6 sm:p-8 rounded-2xl ${theme.bgCardGlass} border ${theme.border} ${theme.cardShadow} hover:border-emerald-500/30 transition-all duration-300`}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  ))}
                </div>
                <p className={`${theme.textSecondary} mb-6 italic text-sm sm:text-base leading-relaxed`}>
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/30">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <div className={`font-semibold ${theme.textPrimary} text-sm sm:text-base`}>
                      {testimonial.name}
                    </div>
                    <div className={`${theme.textMuted} text-xs sm:text-sm`}>
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* WhatsApp Integration Section */}
      <section className={`py-12 sm:py-20 px-4 ${isDark ? "bg-slate-900/50" : "bg-emerald-50/50"} relative z-45`}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${isDark ? "bg-emerald-950/50 border-emerald-800/50" : "bg-emerald-100 border-emerald-200"} border mb-6`}>
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                <span className={`text-xs font-semibold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>Exclusivo Premium</span>
              </div>

              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isDark ? "text-white" : "text-slate-900"} mb-4`}>
                Registre gastos pelo{" "}
                <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                  WhatsApp
                </span>
              </h2>

              <p className={`${isDark ? "text-slate-300" : "text-slate-600"} text-base sm:text-lg leading-relaxed mb-6`}>
                Com o plano Premium, registre transacoes pelo WhatsApp. Envie audio, foto de recibo ou texto - nossa IA faz o resto!
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"} mb-1`}>Audio com IA</h3>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Grave um audio e a IA transcreve e categoriza automaticamente
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"} mb-1`}>Foto de Recibos</h3>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Tire foto do cupom e a IA extrai valor e categoria
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/30">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"} mb-1`}>Texto Simples</h3>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      Digite "gastei 50 no mercado" e pronto!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`relative p-6 rounded-2xl ${isDark ? "bg-slate-800/80" : "bg-white"} border ${isDark ? "border-slate-700" : "border-slate-200"} shadow-xl`}>
              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] text-sm">
                    Gastei 45,90 no almoco hoje
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className={`${isDark ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-900"} px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%] text-sm`}>
                    Registrado! R$ 45,90 em Alimentacao
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] text-sm flex items-center gap-2">
                    <Mic className="w-4 h-4" /> 0:05
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className={`${isDark ? "bg-slate-700 text-white" : "bg-slate-100 text-slate-900"} px-4 py-2 rounded-2xl rounded-tl-sm max-w-[80%] text-sm`}>
                    Entendi! R$ 89,00 em Transporte
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-20 px-4 relative z-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${theme.textPrimary} mb-3 px-4`}>
              Escolha o plano{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                ideal para voce
              </span>
            </h2>
            <p className={`${theme.textSecondary} max-w-xl mx-auto text-sm sm:text-base px-4`}>
              Comece a organizar suas financas com nossos planos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Starter Plan */}
            <div className={`relative p-6 sm:p-8 rounded-2xl ${theme.bgCardGlass} border ${theme.border} ${theme.cardShadow} hover:border-emerald-500/30 transition-all duration-300`}>
              <div className={`text-lg font-bold ${theme.textPrimary} mb-2`}>{PLANS.starter.name}</div>
              <div className="mb-4">
                <span className={`text-3xl sm:text-4xl font-bold ${theme.textPrimary}`}>{PLANS.starter.priceDisplay}</span>
                <span className={`${theme.textMuted} text-sm`}>{PLANS.starter.period}</span>
              </div>
              <p className={`${theme.textSecondary} text-sm mb-6`}>{PLANS.starter.description}</p>

              <ul className="space-y-3 mb-6">
                {PLANS.starter.features.filter(f => f.included).map((feature, index) => (
                  <li key={index} className={`flex items-center gap-3 text-sm ${theme.textSecondary}`}>
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    {feature.text}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate("/auth")}
                className={`w-full ${isDark ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-slate-200 hover:bg-slate-300 text-slate-900"} py-5 rounded-xl font-semibold transition-all duration-300`}
              >
                Comecar agora
              </Button>
            </div>

            {/* Premium Plan */}
            <div className="relative p-6 sm:p-8 rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600" />
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/50 via-transparent to-cyan-500/50 animate-pulse" style={{ animationDuration: "4s" }} />

              {PLANS.premium.badge && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold text-white">
                  {PLANS.premium.badge}
                </div>
              )}

              <div className="relative z-10 text-white">
                <div className="text-lg font-bold mb-2">{PLANS.premium.name}</div>
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold">{PLANS.premium.priceDisplay}</span>
                  <span className="text-white/80 text-sm">{PLANS.premium.period}</span>
                </div>
                <p className="text-white/80 text-sm mb-6">{PLANS.premium.description}</p>

                <ul className="space-y-3 mb-6">
                  {PLANS.premium.features.filter(f => f.included).map((feature, index) => (
                    <li key={index} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      {feature.text}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => navigate("/auth")}
                  className="w-full bg-white text-emerald-600 hover:bg-slate-100 py-5 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  Assinar {PLANS.premium.name}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`py-10 sm:py-12 px-4 border-t ${theme.border} relative z-50`}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <img
              src={isDark ? "/logo-dark.png" : "/logo-light.png"}
              alt="PixZen"
              className="h-8 w-auto"
            />
          </div>
          <p className={`${theme.textMuted} text-sm`}>
            © 2026 PixZen. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
