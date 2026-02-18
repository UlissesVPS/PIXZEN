import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';

export function IncomeExpenseChart() {
  const { getFilteredTransactions, periodFilter } = useFinance();

  const chartData = useMemo(() => {
    const transactions = getFilteredTransactions();
    const grouped: Record<string, { income: number; expense: number; label: string }> = {};

    transactions.forEach(t => {
      const date = new Date(t.date);
      let key: string;
      let label: string;

      switch (periodFilter) {
        case 'week':
          key = date.toLocaleDateString('pt-BR', { weekday: 'short' });
          label = key;
          break;
        case 'month':
          key = `week-${Math.ceil(date.getDate() / 7)}`;
          label = `Sem ${Math.ceil(date.getDate() / 7)}`;
          break;
        case 'year':
          key = date.toLocaleDateString('pt-BR', { month: 'short' });
          label = key;
          break;
      }

      if (!grouped[key]) {
        grouped[key] = { income: 0, expense: 0, label };
      }

      if (t.type === 'income') {
        grouped[key].income += t.amount;
      } else {
        grouped[key].expense += t.amount;
      }
    });

    return Object.values(grouped).slice(-7);
  }, [getFilteredTransactions, periodFilter]);

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value}`;
  };

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-border animate-slide-up">
        <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Receitas vs Despesas</h3>
        <div className="h-40 sm:h-48 flex items-center justify-center text-muted-foreground text-sm">
          Nenhuma transação no período
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-border animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
        <h3 className="font-semibold text-sm sm:text-base">Receitas vs Despesas</h3>
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-income" />
            <span className="text-muted-foreground">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-expense" />
            <span className="text-muted-foreground">Despesas</span>
          </div>
        </div>
      </div>
      
      <div className="h-40 sm:h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="label" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickFormatter={formatCurrency}
              width={50}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
                name === 'income' ? 'Receitas' : 'Despesas'
              ]}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
                boxShadow: 'var(--shadow-lg)',
                fontSize: '12px',
              }}
            />
            <Bar 
              dataKey="income" 
              fill="hsl(var(--income))" 
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
            <Bar 
              dataKey="expense" 
              fill="hsl(var(--expense))" 
              radius={[3, 3, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
