import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';

export function ExpenseChart() {
  const { getFilteredTransactions, categories } = useFinance();

  const chartData = useMemo(() => {
    const transactions = getFilteredTransactions().filter(t => t.type === 'expense');
    const categoryTotals: Record<string, number> = {};

    transactions.forEach(t => {
      categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
    });

    return Object.entries(categoryTotals)
      .map(([categoryId, total]) => {
        const category = categories.find(c => c.id === categoryId);
        return {
          name: category?.name || categoryId,
          value: total,
          color: category?.color || 'hsl(220, 14%, 46%)',
          icon: category?.icon || '📊',
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [getFilteredTransactions, categories]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-border animate-slide-up">
        <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Despesas por Categoria</h3>
        <div className="h-40 sm:h-48 flex items-center justify-center text-muted-foreground text-sm">
          Nenhuma despesa no período
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm border border-border animate-slide-up">
      <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Despesas por Categoria</h3>
      
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="90%"
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.75rem',
                  boxShadow: 'var(--shadow-lg)',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-sm sm:text-lg flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs sm:text-sm font-medium truncate">{item.name}</span>
                  <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                    {((item.value / total) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="h-1 sm:h-1.5 bg-secondary rounded-full overflow-hidden mt-0.5 sm:mt-1">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${(item.value / total) * 100}%`,
                      backgroundColor: item.color 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
