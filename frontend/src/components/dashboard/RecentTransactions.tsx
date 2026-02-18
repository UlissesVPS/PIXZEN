import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/contexts/FinanceContext';
import { cn } from '@/lib/utils';

export function RecentTransactions() {
  const navigate = useNavigate();
  const { getFilteredTransactions, categories } = useFinance();

  const transactions = getFilteredTransactions()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Hoje';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-border animate-slide-up">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h3 className="font-semibold text-sm sm:text-base">Transações Recentes</h3>
        <button 
          onClick={() => navigate('/transactions')}
          className="text-xs sm:text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
        >
          Ver todas
          <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
          Nenhuma transação no período
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {transactions.map((transaction, index) => {
            const category = categories.find(c => c.id === transaction.categoryId);
            
            return (
              <div 
                key={transaction.id}
                className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div 
                  className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-xl flex-shrink-0"
                  style={{ backgroundColor: `${category?.color}20` }}
                >
                  {category?.icon || '💰'}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{transaction.description}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {category?.name} • {formatDate(transaction.date)}
                  </p>
                </div>

                <span className={cn(
                  "font-semibold text-sm sm:text-base flex-shrink-0",
                  transaction.type === 'income' ? "text-income" : "text-expense"
                )}>
                  {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
