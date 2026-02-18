import { Bell, Crown, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useFinance } from '@/contexts/FinanceContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export function Header() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { accountType, setAccountType } = useFinance();
  const { unreadCount } = useNotifications();
  const { user, isDemoMode } = useAuth();
  const isDark = theme === 'dark';

  const planStatus = user?.assinante?.plano;
  const isPremium = planStatus === 'premium';
  const isStarter = planStatus === 'starter';

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <img
            src={isDark ? "/logo-dark.png" : "/logo-light.png"}
            alt="PixZen"
            className="h-7 w-auto"
          />
          {/* Plan Badge */}
          {!isDemoMode && isPremium && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
              <Crown className="h-3 w-3" />
              Premium
            </span>
          )}
          {!isDemoMode && isStarter && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold">
              <Sparkles className="h-3 w-3" />
              Starter
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Account Type Toggle */}
          <div className="hidden sm:flex items-center bg-secondary rounded-lg p-1">
            <button
              onClick={() => setAccountType('personal')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                accountType === 'personal'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Pessoal
            </button>
            <button
              onClick={() => setAccountType('business')}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                accountType === 'business'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Empresa
            </button>
          </div>

          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
