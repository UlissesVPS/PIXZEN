import { useMemo } from 'react';
import { Target, CreditCard, Percent } from 'lucide-react';
import { useFinance } from '@/contexts/FinanceContext';
import { AnimatedNumber } from '@/components/ui/animated-number';

export function QuickStats() {
  const { getFilteredTransactions, getTotalIncome, getTotalExpense } = useFinance();

  const stats = useMemo(() => {
    const transactions = getFilteredTransactions();
    const income = getTotalIncome();
    const expense = getTotalExpense();
    
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const transactionCount = transactions.length;
    const avgTransaction = transactionCount > 0 
      ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactionCount 
      : 0;

    return [
      {
        icon: Percent,
        label: 'Taxa de Economia',
        value: savingsRate,
        formatFn: (v: number) => `${v.toFixed(1)}%`,
        color: 'bg-success/10 text-success',
      },
      {
        icon: CreditCard,
        label: 'Transações',
        value: transactionCount,
        formatFn: (v: number) => Math.round(v).toString(),
        color: 'bg-primary/10 text-primary',
      },
      {
        icon: Target,
        label: 'Média/Transação',
        value: avgTransaction,
        formatFn: (v: number) => new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0,
        }).format(v),
        color: 'bg-accent/10 text-accent',
      },
    ];
  }, [getFilteredTransactions, getTotalIncome, getTotalExpense]);

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div 
            key={index}
            className="bg-card rounded-lg sm:rounded-xl p-2.5 sm:p-4 shadow-sm border border-border transition-all duration-300 hover:shadow-md hover:scale-[1.02] hover:border-primary/20"
            style={{ 
              animation: `fadeIn 0.4s ease-out ${index * 0.1}s both`
            }}
          >
            <div className={`h-7 w-7 sm:h-9 sm:w-9 rounded-md sm:rounded-lg ${stat.color} flex items-center justify-center mb-1.5 sm:mb-2 transition-transform duration-300 hover:scale-110`}>
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <p className="text-sm sm:text-lg font-bold truncate">
              <AnimatedNumber value={stat.value} formatFn={stat.formatFn} duration={500} />
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
