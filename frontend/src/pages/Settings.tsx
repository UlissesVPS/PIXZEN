import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Bell, LogOut, ChevronRight, Palette, Check, User, Shield, MessageCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTheme, accentColors } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useAuth } from '@/contexts/AuthContext';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { cn } from '@/lib/utils';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme, accentColor, setAccentColor } = useTheme();
  const { unreadCount } = useNotifications();
  const { signOut, user } = useAuth();

  const isAdmin = user?.is_admin === true;

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex h-16 items-center px-4">
            <div className="md:hidden">
              <MobileSidebar />
            </div>
            <h1 className="flex-1 text-center md:text-left font-semibold">Configurações</h1>
            <div className="w-10 md:hidden" />
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">
          <div className="container px-4 py-6 max-w-lg mx-auto space-y-6">
            {/* App Info */}
            <div className="flex flex-col items-center py-8">
              <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-4" style={{ background: 'var(--gradient-primary)' }}>
                <span className="text-primary-foreground font-bold text-3xl">P</span>
              </div>
              <h2 className="font-bold text-2xl tracking-tight">PixZen</h2>
              <p className="text-xs text-muted-foreground tracking-widest uppercase mt-1">Finance</p>
              <p className="text-sm text-muted-foreground mt-2">Versão 1.0.0</p>
            </div>

            {/* Aparência */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-1">Aparência</h3>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                {/* Dark Mode Toggle */}
                <div className="flex items-center gap-4 p-4 border-b border-border">
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                    {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Modo Escuro</p>
                    <p className="text-sm text-muted-foreground">Alternar tema do aplicativo</p>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                </div>

                {/* Accent Color */}
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                      <Palette className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Cor do Tema</p>
                      <p className="text-sm text-muted-foreground">Personalize a cor principal</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {accentColors.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => setAccentColor(color)}
                        className={cn(
                          "relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                          accentColor.id === color.id
                            ? "bg-secondary ring-2 ring-primary scale-105"
                            : "hover:bg-secondary/50 hover:scale-105"
                        )}
                        title={color.name}
                      >
                        <div
                          className="h-8 w-8 rounded-full shadow-md"
                          style={{ backgroundColor: `hsl(${color.primary})` }}
                        >
                          {accentColor.id === color.id && (
                            <div className="h-full w-full rounded-full flex items-center justify-center bg-white/20">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-medium truncate w-full text-center">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Preferências */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-1">Preferências</h3>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                  onClick={() => navigate('/notifications')}
                >
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">Notificações e Lembretes</p>
                    <p className="text-sm text-muted-foreground">Gerenciar alertas e lembretes</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Integrações */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-1">Integrações</h3>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                  onClick={() => navigate('/whatsapp')}
                >
                  <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">Registre transações pelo WhatsApp</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Administracao - apenas para admins */}
            {isAdmin && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground px-1">Administracao</h3>
                <div className="bg-card rounded-2xl border border-border overflow-hidden">
                  <button
                    className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                    onClick={() => navigate('/admin')}
                  >
                    <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">Painel Administrativo</p>
                      <p className="text-sm text-muted-foreground">Usuarios, planos e configuracoes</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            )}

            {/* Conta */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-1">Conta</h3>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors border-b border-border"
                  onClick={() => navigate('/profile')}
                >
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">Perfil</p>
                    <p className="text-sm text-muted-foreground">Informações pessoais e assinatura</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
                <button
                  className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                  onClick={() => navigate('/security')}
                >
                  <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">Segurança</p>
                    <p className="text-sm text-muted-foreground">Senha e autenticação</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Ajuda */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-1">Suporte</h3>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors"
                  onClick={() => navigate('/help')}
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">Central de Ajuda</p>
                    <p className="text-sm text-muted-foreground">Tutoriais, guias e perguntas frequentes</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              variant="outline"
              className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sair da Conta
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Feito com amor para você gerenciar suas finanças
            </p>
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
