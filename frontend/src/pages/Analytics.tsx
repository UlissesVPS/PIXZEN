import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useFinance } from '@/contexts/FinanceContext';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function Analytics() {
  const navigate = useNavigate();
  const { getFilteredTransactions, transactions: allTransactions, categories, getTotalIncome, getTotalExpense, periodFilter, accountType } = useFinance();

  const income = getTotalIncome();
  const expense = getTotalExpense();
  const balance = income - expense;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCompact = (value: number) => {
    if (Math.abs(value) >= 1000) return `R$ ${(value / 1000).toFixed(1)}k`;
    return `R$ ${value.toFixed(0)}`;
  };

  // ---- Previous period comparison ----
  const previousPeriodData = useMemo(() => {
    const now = new Date();
    let prevStart: Date;
    let prevEnd: Date;

    switch (periodFilter) {
      case 'week': {
        prevEnd = new Date(now);
        prevEnd.setDate(prevEnd.getDate() - 7);
        prevStart = new Date(prevEnd);
        prevStart.setDate(prevStart.getDate() - 7);
        break;
      }
      case 'month': {
        prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      }
      case 'year': {
        prevStart = new Date(now.getFullYear() - 1, 0, 1);
        prevEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
      }
    }

    const prevTxns = allTransactions.filter(t => {
      const d = new Date(t.date);
      return t.accountType === accountType && d >= prevStart && d <= prevEnd;
    });

    const prevIncome = prevTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const prevExpense = prevTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const incomeChange = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : (income > 0 ? 100 : 0);
    const expenseChange = prevExpense > 0 ? ((expense - prevExpense) / prevExpense) * 100 : (expense > 0 ? 100 : 0);
    const balanceChange = (income - expense) - (prevIncome - prevExpense);

    return { prevIncome, prevExpense, incomeChange, expenseChange, balanceChange };
  }, [allTransactions, accountType, periodFilter, income, expense]);

  // Category breakdown data
  const expenseByCategory = useMemo(() => {
    const transactions = getFilteredTransactions().filter(t => t.type === 'expense');
    const totals: Record<string, number> = {};
    transactions.forEach(t => { totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amount; });
    return Object.entries(totals)
      .map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return { name: cat?.name || id, value, color: cat?.color || 'hsl(220, 14%, 46%)', icon: cat?.icon || '📊' };
      })
      .sort((a, b) => b.value - a.value);
  }, [getFilteredTransactions, categories]);

  const incomeByCategory = useMemo(() => {
    const transactions = getFilteredTransactions().filter(t => t.type === 'income');
    const totals: Record<string, number> = {};
    transactions.forEach(t => { totals[t.categoryId] = (totals[t.categoryId] || 0) + t.amount; });
    return Object.entries(totals)
      .map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return { name: cat?.name || id, value, color: cat?.color || 'hsl(152, 69%, 40%)', icon: cat?.icon || '💰' };
      })
      .sort((a, b) => b.value - a.value);
  }, [getFilteredTransactions, categories]);

  // Balance trend data
  const balanceTrend = useMemo(() => {
    const transactions = getFilteredTransactions();
    const grouped: Record<string, { income: number; expense: number; balance: number }> = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      let key: string;
      switch (periodFilter) {
        case 'week': key = date.toLocaleDateString('pt-BR', { weekday: 'short' }); break;
        case 'month': key = date.getDate().toString().padStart(2, '0'); break;
        case 'year': key = date.toLocaleDateString('pt-BR', { month: 'short' }); break;
      }
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0, balance: 0 };
      if (t.type === 'income') grouped[key].income += t.amount;
      else grouped[key].expense += t.amount;
      grouped[key].balance = grouped[key].income - grouped[key].expense;
    });
    return Object.entries(grouped).map(([name, data]) => ({ name, ...data })).slice(-12);
  }, [getFilteredTransactions, periodFilter]);

  // Income vs Expense BarChart data
  const barChartData = useMemo(() => {
    const transactions = getFilteredTransactions();
    const grouped: Record<string, { name: string; Receitas: number; Despesas: number }> = {};
    transactions.forEach(t => {
      const date = new Date(t.date);
      let key: string;
      let label: string;
      switch (periodFilter) {
        case 'week': key = label = date.toLocaleDateString('pt-BR', { weekday: 'short' }); break;
        case 'month': { const wk = Math.ceil(date.getDate() / 7); key = `w${wk}`; label = `Sem ${wk}`; break; }
        case 'year': key = label = date.toLocaleDateString('pt-BR', { month: 'short' }); break;
      }
      if (!grouped[key]) grouped[key] = { name: label, Receitas: 0, Despesas: 0 };
      if (t.type === 'income') grouped[key].Receitas += t.amount;
      else grouped[key].Despesas += t.amount;
    });
    return Object.values(grouped);
  }, [getFilteredTransactions, periodFilter]);

  // Export Report (printable HTML)
  const handleExportReport = () => {
    const periodLbl = periodFilter === 'week' ? 'Semanal' : periodFilter === 'month' ? 'Mensal' : 'Anual';
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const topExp = expenseByCategory.slice(0, 10).map((item, i) =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i + 1}. ${item.icon} ${item.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;color:#ef4444">${formatCurrency(item.value)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${expense > 0 ? ((item.value / expense) * 100).toFixed(1) : 0}%</td></tr>`
    ).join('');
    const topInc = incomeByCategory.slice(0, 10).map((item, i) =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i + 1}. ${item.icon} ${item.name}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right;color:#22c55e">${formatCurrency(item.value)}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${income > 0 ? ((item.value / income) * 100).toFixed(1) : 0}%</td></tr>`
    ).join('');

    const reportContent = [
      '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Relatorio PixZen</title>',
      '<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:20px;color:#1a1a2e}',
      'h1{color:#6366f1;border-bottom:3px solid #6366f1;padding-bottom:10px}',
      'h2{color:#374151;margin-top:30px;border-bottom:1px solid #e5e7eb;padding-bottom:8px}',
      '.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0}',
      '.card{padding:20px;border-radius:12px;text-align:center}',
      '.card-i{background:#f0fdf4;border:1px solid #bbf7d0}',
      '.card-e{background:#fef2f2;border:1px solid #fecaca}',
      '.card-b{background:#eff6ff;border:1px solid #bfdbfe}',
      '.card h3{font-size:14px;color:#6b7280;margin:0 0 8px}.card p{font-size:24px;font-weight:700;margin:0}',
      '.green{color:#16a34a}.red{color:#ef4444}',
      'table{width:100%;border-collapse:collapse;margin:10px 0}',
      'th{text-align:left;padding:10px 8px;background:#f9fafb;border-bottom:2px solid #e5e7eb;font-size:13px}',
      '.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;color:#9ca3af;font-size:12px}',
      '@media print{body{padding:0}}</style></head><body>',
      `<h1>Relatorio Financeiro ${periodLbl}</h1>`,
      `<p style="color:#6b7280">Gerado em ${dateStr} | Conta: ${accountType === 'personal' ? 'Pessoal' : 'Empresa'}</p>`,
      '<div class="cards">',
      `<div class="card card-i"><h3>Receitas</h3><p class="green">${formatCurrency(income)}</p></div>`,
      `<div class="card card-e"><h3>Despesas</h3><p class="red">${formatCurrency(expense)}</p></div>`,
      `<div class="card card-b"><h3>Saldo</h3><p class="${balance >= 0 ? 'green' : 'red'}">${formatCurrency(balance)}</p></div>`,
      '</div>',
      '<h2>Top Despesas por Categoria</h2>',
      '<table><tr><th>Categoria</th><th style="text-align:right">Valor</th><th style="text-align:right">%</th></tr>',
      topExp || '<tr><td colspan="3" style="padding:20px;text-align:center;color:#9ca3af">Sem despesas</td></tr>',
      '</table>',
      '<h2>Top Receitas por Categoria</h2>',
      '<table><tr><th>Categoria</th><th style="text-align:right">Valor</th><th style="text-align:right">%</th></tr>',
      topInc || '<tr><td colspan="3" style="padding:20px;text-align:center;color:#9ca3af">Sem receitas</td></tr>',
      '</table>',
      '<div class="footer"><p>PixZen - Financas Pessoais e Empresariais</p></div>',
      '<script>window.print();<\/script></body></html>'
    ].join('');

    const win = window.open('', '_blank');
    if (win) {
      win.document.open();
      win.document.writeln(reportContent);
      win.document.close();
      toast({ title: 'Relatorio gerado!' });
    }
  };

  const periodLabel = periodFilter === 'week' ? 'semana anterior' : periodFilter === 'month' ? 'mes anterior' : 'ano anterior';

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex h-14 items-center px-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="flex-1 text-center md:text-left font-semibold text-sm">Analises</h1>
            <Button variant="ghost" size="icon" onClick={handleExportReport} title="Exportar Relatorio">
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 pb-20 md:pb-8">
          <div className="container px-3 sm:px-4 py-4 sm:py-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
            <PeriodFilter />

            {/* Summary Cards with comparison */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-card rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-border">
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-md sm:rounded-lg bg-income/10 flex items-center justify-center mb-1.5 sm:mb-2">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-income" />
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Receitas</p>
                <p className="text-xs sm:text-base font-bold text-income truncate">{formatCurrency(income)}</p>
                {previousPeriodData.prevIncome > 0 && (
                  <div className={cn("flex items-center gap-0.5 mt-1", previousPeriodData.incomeChange >= 0 ? "text-income" : "text-expense")}>
                    {previousPeriodData.incomeChange >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    <span className="text-[9px] sm:text-[10px] font-medium">{Math.abs(previousPeriodData.incomeChange).toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <div className="bg-card rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-border">
                <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-md sm:rounded-lg bg-expense/10 flex items-center justify-center mb-1.5 sm:mb-2">
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-expense" />
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Despesas</p>
                <p className="text-xs sm:text-base font-bold text-expense truncate">{formatCurrency(expense)}</p>
                {previousPeriodData.prevExpense > 0 && (
                  <div className={cn("flex items-center gap-0.5 mt-1", previousPeriodData.expenseChange <= 0 ? "text-income" : "text-expense")}>
                    {previousPeriodData.expenseChange <= 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                    <span className="text-[9px] sm:text-[10px] font-medium">{Math.abs(previousPeriodData.expenseChange).toFixed(1)}%</span>
                  </div>
                )}
              </div>
              <div className="bg-card rounded-lg sm:rounded-xl p-2.5 sm:p-4 border border-border">
                <div className={cn("h-6 w-6 sm:h-8 sm:w-8 rounded-md sm:rounded-lg flex items-center justify-center mb-1.5 sm:mb-2", balance >= 0 ? "bg-income/10" : "bg-expense/10")}>
                  <Wallet className={cn("h-3 w-3 sm:h-4 sm:w-4", balance >= 0 ? "text-income" : "text-expense")} />
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Saldo</p>
                <p className={cn("text-xs sm:text-base font-bold truncate", balance >= 0 ? "text-income" : "text-expense")}>{formatCurrency(balance)}</p>
                {income > 0 && <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-1">{((balance / income) * 100).toFixed(0)}% economia</p>}
              </div>
            </div>

            {/* Comparison Banner */}
            {(previousPeriodData.prevIncome > 0 || previousPeriodData.prevExpense > 0) && (
              <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <h3 className="font-medium text-xs sm:text-sm">Comparacao com {periodLabel}</h3>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className="text-center p-2 rounded-lg bg-secondary/50">
                    <p className="text-[10px] text-muted-foreground mb-1">Receitas</p>
                    <p className={cn("text-xs sm:text-sm font-bold", previousPeriodData.incomeChange >= 0 ? "text-income" : "text-expense")}>
                      {previousPeriodData.incomeChange >= 0 ? '+' : ''}{previousPeriodData.incomeChange.toFixed(1)}%
                    </p>
                    <p className="text-[9px] text-muted-foreground">antes: {formatCompact(previousPeriodData.prevIncome)}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/50">
                    <p className="text-[10px] text-muted-foreground mb-1">Despesas</p>
                    <p className={cn("text-xs sm:text-sm font-bold", previousPeriodData.expenseChange <= 0 ? "text-income" : "text-expense")}>
                      {previousPeriodData.expenseChange >= 0 ? '+' : ''}{previousPeriodData.expenseChange.toFixed(1)}%
                    </p>
                    <p className="text-[9px] text-muted-foreground">antes: {formatCompact(previousPeriodData.prevExpense)}</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-secondary/50">
                    <p className="text-[10px] text-muted-foreground mb-1">Saldo Var.</p>
                    <p className={cn("text-xs sm:text-sm font-bold", previousPeriodData.balanceChange >= 0 ? "text-income" : "text-expense")}>
                      {previousPeriodData.balanceChange >= 0 ? '+' : ''}{formatCompact(previousPeriodData.balanceChange)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Income vs Expense Bar Chart */}
            {barChartData.length > 0 && (
              <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border">
                <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Receitas vs Despesas</h3>
                <div className="h-44 sm:h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} width={50} />
                      <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="Receitas" fill="hsl(152, 69%, 40%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Despesas" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Balance Trend */}
            <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border">
              <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Evolucao do Saldo</h3>
              <div className="h-40 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={balanceTrend}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={(v) => formatCompact(v)} width={50} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorBalance)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
              <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border">
                <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Despesas por Categoria</h3>
                {expenseByCategory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">Sem despesas no periodo</p>
                ) : (
                  <div className="space-y-2.5 sm:space-y-3">
                    {expenseByCategory.slice(0, 7).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 sm:gap-3">
                        <span className="text-base sm:text-xl">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1 gap-2">
                            <span className="text-xs sm:text-sm font-medium truncate">{item.name}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">{formatCurrency(item.value)}</span>
                          </div>
                          <div className="h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(item.value / expense) * 100}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{((item.value / expense) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-card rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-border">
                <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Receitas por Categoria</h3>
                {incomeByCategory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6 text-sm">Sem receitas no periodo</p>
                ) : (
                  <div className="space-y-2.5 sm:space-y-3">
                    {incomeByCategory.slice(0, 7).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 sm:gap-3">
                        <span className="text-base sm:text-xl">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between mb-1 gap-2">
                            <span className="text-xs sm:text-sm font-medium truncate">{item.name}</span>
                            <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">{formatCurrency(item.value)}</span>
                          </div>
                          <div className="h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(item.value / income) * 100}%`, backgroundColor: item.color }} />
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{((item.value / income) * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
