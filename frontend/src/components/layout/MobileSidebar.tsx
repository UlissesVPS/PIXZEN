import { useState } from 'react';
import {
  Home, PieChart, Plus, List, Settings, User, Building2,
  CalendarClock, Target, BookOpen, Wallet, Menu,
  Shield, LogOut, CreditCard, Receipt, HandCoins, Bell,
  MessageSquare, UserCircle
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useFinance } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';

const mainNavItems = [
  { icon: Home, label: 'Dashboard', path: '/app' },
  { icon: PieChart, label: 'Analises', path: '/analytics' },
  { icon: List, label: 'Transacoes', path: '/transactions' },
  { icon: Plus, label: 'Nova Transacao', path: '/add' },
  { icon: Wallet, label: 'Orcamento', path: '/budgets' },
  { icon: CalendarClock, label: 'Lembretes', path: '/reminders' },
  { icon: Target, label: 'Metas', path: '/goals' },
];

const financeNavItems = [
  { icon: CreditCard, label: 'Cartoes de Credito', path: '/credit-cards' },
  { icon: Receipt, label: 'Contas a Pagar', path: '/bills' },
  { icon: HandCoins, label: 'Contas a Receber', path: '/receivables' },
];

const settingsNavItems = [
  { icon: Bell, label: 'Notificacoes', path: '/notifications' },
  { icon: UserCircle, label: 'Perfil', path: '/profile' },
  { icon: MessageSquare, label: 'WhatsApp', path: '/whatsapp' },
  { icon: Settings, label: 'Configuracoes', path: '/settings' },
  { icon: BookOpen, label: 'Ajuda', path: '/help' },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { accountType, setAccountType } = useFinance();
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isAdmin = user?.is_admin === true;

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  const renderNavItem = (item: { icon: any; label: string; path: string }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <button
        key={item.path}
        onClick={() => handleNavigate(item.path)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
          isActive
            ? "bg-primary text-primary-foreground shadow-md"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground active:bg-secondary/80"
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {item.label}
      </button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6 text-foreground" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-80 max-w-[85vw] flex flex-col" aria-describedby={undefined}>
        <SheetTitle className="sr-only">Menu de navegacao</SheetTitle>

        {/* Header */}
        <div className="flex items-center px-5 h-16 border-b border-border flex-shrink-0">
          <img
            src={isDark ? "/logo-dark.png" : "/logo-light.png"}
            alt="PixZen"
            className="h-7 w-auto"
          />
        </div>

        {/* User Info */}
        <div className="px-5 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.name || user?.email?.split('@')[0] || 'Usuario'}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Account Toggle */}
        <div className="px-5 py-3 flex-shrink-0">
          <div className="bg-secondary rounded-xl p-1 flex">
            <button
              onClick={() => setAccountType('personal')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                accountType === 'personal'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <User className="h-4 w-4" />
              Pessoal
            </button>
            <button
              onClick={() => setAccountType('business')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                accountType === 'business'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building2 className="h-4 w-4" />
              Empresa
            </button>
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Principal
            </p>
            {mainNavItems.map(renderNavItem)}
          </div>

          {/* Finance */}
          <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Financeiro
            </p>
            {financeNavItems.map(renderNavItem)}
          </div>

          {/* Settings */}
          <div className="space-y-1">
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Conta
            </p>
            {settingsNavItems.map(renderNavItem)}
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="space-y-1">
              <p className="px-4 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                Administracao
              </p>
              <button
                onClick={() => handleNavigate('/admin')}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  location.pathname.startsWith('/admin')
                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 shadow-md border border-amber-500/30"
                    : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 active:bg-amber-500/20"
                )}
              >
                <Shield className="h-5 w-5 flex-shrink-0" />
                Painel Admin
              </button>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Tema</span>
            <ThemeToggle />
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sair da Conta
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
