import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { AnimatedNumber } from '@/components/ui/animated-number';

export function BalanceCard() {
  const { getBalance, getTotalIncome, getTotalExpense, accountType, periodFilter } = useFinance();
  
  const balance = getBalance();
  const income = getTotalIncome();
  const expense = getTotalExpense();
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const periodLabels = {
    week: 'esta semana',
    month: 'este mês',
    year: 'este ano',
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Balance Card - Blue Gradient */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl p-4 sm:p-6 text-primary-foreground shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-[1.01]" style={{ background: 'var(--gradient-hero)' }}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 bg-accent/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
        
        <div className="relative">
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 transition-transform duration-300 hover:rotate-12">
              <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span className="text-xs sm:text-sm font-medium opacity-90 truncate">
              Saldo {accountType === 'personal' ? 'Pessoal' : 'Empresa'}
            </span>
          </div>
          
          <p className="text-2xl sm:text-4xl md:text-5xl font-bold mb-0.5 sm:mb-1 tracking-tight truncate">
            <AnimatedNumber value={balance} formatFn={formatCurrency} duration={600} />
          </p>
          
          <p className="text-xs sm:text-sm opacity-70">
            {periodLabels[periodFilter]}
          </p>
        </div>
      </div>

      {/* Income & Expense Cards - Separate */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Income Card - Green */}
        <div className="relative overflow-hidden rounded-xl p-3 sm:p-4 border-2 border-green-400 bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-400/40 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          
          <div className="relative flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/25 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-white/90 font-medium">Receitas</p>
              <p className="font-bold text-sm sm:text-base truncate text-white">
                <AnimatedNumber value={income} formatFn={formatCurrency} duration={600} />
              </p>
            </div>
          </div>
        </div>
        
        {/* Expense Card - Red */}
        <div className="relative overflow-hidden rounded-xl p-3 sm:p-4 border-2 border-red-400 bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-red-400/40 hover:scale-[1.02]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          
          <div className="relative flex items-center gap-2 sm:gap-3">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-white/25 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-white/90 font-medium">Despesas</p>
              <p className="font-bold text-sm sm:text-base truncate text-white">
                <AnimatedNumber value={expense} formatFn={formatCurrency} duration={600} />
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
