import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { BusinessMenu } from '@/components/dashboard/BusinessMenu';
import { PersonalMenu } from '@/components/dashboard/PersonalMenu';
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart';
import { ExpenseChart } from '@/components/dashboard/ExpenseChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { SmartInsights } from '@/components/dashboard/SmartInsights';
import { useFinance } from '@/contexts/FinanceContext';
import { useTrialCheck } from '@/hooks/useTrialCheck';
import { useAuth } from '@/contexts/AuthContext';
import TrialExpiredPopup from '@/components/TrialExpiredPopup';
import { User, Building2, X, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isDemoMode, exitDemoMode } = useAuth();
  const { accountType, setAccountType } = useFinance();
  const { isTrialExpired, daysRemaining, isLoggedIn, isLoading: trialLoading } = useTrialCheck();
  
  // Banner dismissed state - uses sessionStorage so it reappears on new session
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    return sessionStorage.getItem('pixzen_trial_banner_dismissed') === 'true';
  });

  // Redirect to auth if not logged in and not in demo mode
  useEffect(() => {
    if (!authLoading && !user && !isDemoMode) {
      navigate('/auth');
    }
  }, [user, authLoading, isDemoMode, navigate]);

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem('pixzen_trial_banner_dismissed', 'true');
  };

  const handleSubscribe = () => {
    // Redirect to landing page pricing section
    navigate('/#pricing');
  };

  const handleExitDemo = () => {
    exitDemoMode();
    navigate('/auth');
  };

  const isLoading = authLoading || (!isDemoMode && trialLoading);
  const showTrialBanner = !isDemoMode && isLoggedIn && !isTrialExpired && daysRemaining > 0 && daysRemaining <= 7 && !bannerDismissed;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border-b border-violet-500/30 px-4 py-3">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
                  Modo Demonstração - Dados fictícios para explorar o app
                </p>
              </div>
              <Button
                size="sm"
                onClick={handleExitDemo}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-1 h-7"
              >
                Criar conta grátis
              </Button>
            </div>
          </div>
        )}

        {/* Trial Days Remaining Banner - Dismissible */}
        {showTrialBanner && (
          <div className="bg-gradient-to-r from-primary/20 to-amber-500/20 border-b border-primary/20 px-4 py-2 relative">
            <p className="text-center text-sm text-primary font-medium pr-8">
              🎉 Você tem {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'} no seu período de teste gratuito
            </p>
            <button
              onClick={handleDismissBanner}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-primary/10 transition-colors"
              aria-label="Fechar banner"
            >
              <X className="h-4 w-4 text-primary/70" />
            </button>
          </div>
        )}
        
        <main className="flex-1 pb-20 md:pb-8">
          <div className="container px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            {/* Mobile Account Toggle */}
            <div className="sm:hidden">
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

            <BalanceCard />
            
            <PeriodFilter />
            
            <QuickStats />

            <SmartInsights />

            <PersonalMenu />
            <BusinessMenu />
            
            <div className="grid gap-6 lg:grid-cols-2">
              <IncomeExpenseChart />
              <ExpenseChart />
            </div>
            
            <RecentTransactions />
          </div>
        </main>
        
        <BottomNav />
      </div>

      {/* Trial Expired Popup - Don't show in demo mode */}
      {!isDemoMode && (
        <TrialExpiredPopup 
          open={isTrialExpired} 
          onSubscribe={handleSubscribe} 
        />
      )}
    </div>
  );
};

export default Index;
