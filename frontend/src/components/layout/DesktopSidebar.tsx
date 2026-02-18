import { Home, PieChart, Plus, List, Settings, User, Building2, CalendarClock, Target, BookOpen, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useFinance } from '@/contexts/FinanceContext';
import { useTheme } from '@/contexts/ThemeContext';

const navItems = [
  { icon: Home, label: 'Dashboard', path: '/app' },
  { icon: PieChart, label: 'Analises', path: '/analytics' },
  { icon: List, label: 'Transacoes', path: '/transactions' },
  { icon: CalendarClock, label: 'Lembretes', path: '/reminders' },
  { icon: Target, label: 'Metas', path: '/goals' },
  { icon: Wallet, label: 'Orcamento', path: '/budgets' },
  { icon: Settings, label: 'Configuracoes', path: '/settings' },
  { icon: BookOpen, label: 'Ajuda', path: '/help' },
];

export function DesktopSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { accountType, setAccountType } = useFinance();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center justify-center px-4 h-16 border-b border-border">
        <img
          src={isDark ? "/logo-dark.png" : "/logo-light.png"}
          alt="PixZen"
          className="h-8 w-auto"
        />
      </div>

      {/* Account Toggle */}
      <div className="px-4 py-4">
        <div className="bg-secondary rounded-xl p-1 flex">
          <button
            onClick={() => setAccountType('personal')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
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
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all",
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

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/app' && location.pathname === '/app');
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="px-4 py-2 flex justify-center">
        <ThemeToggle />
      </div>

      {/* Add Transaction Button */}
      <div className="p-4">
        <Button
          className="w-full"
          size="lg"
          onClick={() => navigate('/add')}
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Transacao
        </Button>
      </div>
    </aside>
  );
}
