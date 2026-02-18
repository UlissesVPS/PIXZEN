import { useFinance, PeriodFilter as PeriodFilterType } from '@/contexts/FinanceContext';
import { cn } from '@/lib/utils';

const periods: { value: PeriodFilterType; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
];

export function PeriodFilter() {
  const { periodFilter, setPeriodFilter } = useFinance();

  return (
    <div className="flex items-center gap-1 sm:gap-2 bg-secondary rounded-lg sm:rounded-xl p-1 animate-fade-in">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => setPeriodFilter(period.value)}
          className={cn(
            "flex-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all",
            periodFilter === period.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
}
