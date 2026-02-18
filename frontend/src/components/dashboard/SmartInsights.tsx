import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, AlertTriangle, TrendingUp, TrendingDown, Target,
  Calendar, ChevronRight, Wallet, Zap, Bell, Loader2,
  ArrowUpRight, ArrowDownRight, ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { budgetApi, type Insights } from '@/services/budgetApi';
import { useFinance } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Generate demo insights
const generateDemoInsights = (): Insights => ({
  anomalies: [
    { category_id: 'entertainment', current_amount: 450, previous_amount: 200, increase_pct: 125 },
    { category_id: 'food', current_amount: 1200, previous_amount: 750, increase_pct: 60 },
  ],
  projection: {
    projected_total: 8500,
    daily_average: 283,
    days_elapsed: 18,
    days_in_month: 30,
    run_rate_warning: true,
  },
  budget_alerts: [
    { category_id: 'entertainment', budgeted: 300, spent: 450, pct: 150 },
    { category_id: 'groceries', budgeted: 1200, spent: 980, pct: 82 },
  ],
  month_comparison: [
    { category_id: 'food', current: 1200, previous: 750, change_pct: 60 },
    { category_id: 'transport', current: 280, previous: 350, change_pct: -20 },
    { category_id: 'entertainment', current: 450, previous: 200, change_pct: 125 },
  ],
  overdue_bills: [
    { id: '1', description: 'Conta de Luz', amount: 280, due_date: new Date(Date.now() - 3 * 86400000).toISOString(), status: 'overdue' },
  ],
  upcoming_bills: [
    { id: '2', description: 'Internet', amount: 150, due_date: new Date(Date.now() + 2 * 86400000).toISOString(), status: 'pending' },
    { id: '3', description: 'Academia', amount: 120, due_date: new Date(Date.now() + 5 * 86400000).toISOString(), status: 'pending' },
  ],
  goals_behind: [
    { id: '1', title: 'Viagem Europa', current_amount: 8500, target_amount: 15000, deadline: new Date(Date.now() + 60 * 86400000).toISOString(), pct: 57, days_left: 60 },
  ],
  top_categories: [
    { category_id: 'food', total: 1200 },
    { category_id: 'groceries', total: 980 },
    { category_id: 'entertainment', total: 450 },
    { category_id: 'transport', total: 350 },
    { category_id: 'utilities', total: 280 },
  ],
});

export function SmartInsights() {
  const navigate = useNavigate();
  const { isDemoMode } = useAuth();
  const { categories, accountType } = useFinance();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const getCatName = (id: string) => categories.find(c => c.id === id)?.name || id;
  const getCatIcon = (id: string) => categories.find(c => c.id === id)?.icon || '📊';

  useEffect(() => {
    const fetchInsights = async () => {
      if (isDemoMode) {
        setInsights(generateDemoInsights());
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await budgetApi.getInsights(accountType);
        setInsights(data);
      } catch (err) {
        console.error('Error loading insights:', err);
        // Silently fail - insights are optional
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [isDemoMode, accountType]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold">Insights Inteligentes</span>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!insights) return null;

  // Count total action items
  const actionCount = insights.overdue_bills.length + insights.budget_alerts.filter(a => a.pct >= 100).length + insights.goals_behind.length;
  const hasAnomalies = insights.anomalies.length > 0;
  const hasAlerts = insights.budget_alerts.length > 0;

  // Show nothing if there are zero insights
  if (
    actionCount === 0 &&
    !hasAnomalies &&
    !hasAlerts &&
    !insights.projection.run_rate_warning &&
    insights.upcoming_bills.length === 0 &&
    insights.top_categories.length === 0
  ) return null;

  return (
    <div className="space-y-3">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-xl p-3 border border-violet-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold">Insights Inteligentes</p>
              <p className="text-[10px] text-muted-foreground">Analise automatica das suas financas</p>
            </div>
          </div>
          {actionCount > 0 && (
            <div className="px-2 py-1 rounded-full bg-red-500/10 border border-red-500/30">
              <span className="text-[10px] font-bold text-red-500">{actionCount} {actionCount === 1 ? 'acao' : 'acoes'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Urgent Action Items */}
      {insights.overdue_bills.length > 0 && (
        <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-500">Contas atrasadas</span>
          </div>
          {insights.overdue_bills.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between bg-red-500/5 rounded-lg p-2">
              <div>
                <p className="text-xs font-medium">{bill.description}</p>
                <p className="text-[10px] text-muted-foreground">
                  Venceu em {new Date(bill.due_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <span className="text-xs font-bold text-red-500">R$ {formatCurrency(bill.amount)}</span>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-7 text-[10px] border-red-500/30 text-red-500" onClick={() => navigate('/bills')}>
            Ver contas <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}

      {/* Budget Alerts */}
      {hasAlerts && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold">Alertas de Orcamento</span>
          </div>
          {insights.budget_alerts.slice(0, expanded ? undefined : 3).map((alert) => {
            const isOver = alert.pct >= 100;
            return (
              <div key={alert.category_id} className="flex items-center gap-2">
                <span className="text-base">{getCatIcon(alert.category_id)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium truncate">{getCatName(alert.category_id)}</span>
                    <span className={cn("text-[10px] font-bold", isOver ? "text-red-500" : "text-amber-500")}>
                      {alert.pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary mt-1">
                    <div
                      className={cn("h-full rounded-full", isOver ? "bg-red-500" : "bg-amber-500")}
                      style={{ width: `${Math.min(alert.pct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
          <Button size="sm" variant="outline" className="w-full h-7 text-[10px]" onClick={() => navigate('/budgets')}>
            <Wallet className="h-3 w-3 mr-1" /> Ver orcamentos
          </Button>
        </div>
      )}

      {/* Spending Anomalies */}
      {hasAnomalies && (
        <div className="bg-card rounded-xl p-3 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold">Gastos Incomuns</span>
          </div>
          {insights.anomalies.map((a) => (
            <div key={a.category_id} className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">{getCatIcon(a.category_id)}</span>
                <div>
                  <p className="text-xs font-medium">{getCatName(a.category_id)}</p>
                  <p className="text-[10px] text-muted-foreground">
                    R$ {formatCurrency(a.previous_amount)} &rarr; R$ {formatCurrency(a.current_amount)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-red-500">
                <ArrowUpRight className="h-3 w-3" />
                <span className="text-xs font-bold">+{a.increase_pct.toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Spending Projection */}
      {insights.projection.run_rate_warning && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-semibold">Projecao do Mes</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Media diaria: R$ {formatCurrency(insights.projection.daily_average)}</p>
              <p className="text-xs text-muted-foreground">
                Dia {insights.projection.days_elapsed} de {insights.projection.days_in_month}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-amber-500">R$ {formatCurrency(insights.projection.projected_total)}</p>
              <p className="text-[10px] text-amber-500">projecao total</p>
            </div>
          </div>
        </div>
      )}

      {/* Goals Behind Schedule */}
      {insights.goals_behind.length > 0 && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-2">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-violet-500" />
            <span className="text-xs font-semibold">Metas Atrasadas</span>
          </div>
          {insights.goals_behind.map((goal) => (
            <div key={goal.id} className="flex items-center gap-2 py-1">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{goal.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {goal.pct.toFixed(0)}% completo
                  {goal.days_left !== null && ` • ${goal.days_left} dias restantes`}
                </p>
              </div>
              <span className="text-xs font-semibold text-violet-500">
                R$ {formatCurrency(goal.target_amount - goal.current_amount)} faltam
              </span>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full h-7 text-[10px]" onClick={() => navigate('/goals')}>
            <Target className="h-3 w-3 mr-1" /> Ver metas
          </Button>
        </div>
      )}

      {/* Upcoming Bills */}
      {insights.upcoming_bills.length > 0 && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-semibold">Proximas Contas</span>
          </div>
          {insights.upcoming_bills.slice(0, 3).map((bill) => {
            const dueDate = new Date(bill.due_date);
            const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / 86400000);
            return (
              <div key={bill.id} className="flex items-center justify-between py-1">
                <div>
                  <p className="text-xs font-medium">{bill.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {daysUntil <= 0 ? 'Vence hoje' : daysUntil === 1 ? 'Vence amanha' : `Em ${daysUntil} dias`}
                  </p>
                </div>
                <span className="text-xs font-semibold">R$ {formatCurrency(bill.amount)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Top Categories (mini chart) */}
      {insights.top_categories.length > 0 && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-xs font-semibold">Maiores Gastos do Mes</span>
          </div>
          {insights.top_categories.slice(0, 5).map((cat, i) => {
            const maxTotal = insights.top_categories[0]?.total || 1;
            const widthPct = (cat.total / maxTotal) * 100;
            const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500'];
            return (
              <div key={cat.category_id} className="flex items-center gap-2">
                <span className="text-sm w-6">{getCatIcon(cat.category_id)}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] font-medium">{getCatName(cat.category_id)}</span>
                    <span className="text-[10px] text-muted-foreground">R$ {formatCurrency(cat.total)}</span>
                  </div>
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div className={cn("h-full rounded-full", colors[i % colors.length])} style={{ width: `${widthPct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Month Comparison highlights */}
      {insights.month_comparison.length > 0 && (
        <div className="bg-card rounded-xl p-3 border border-border space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-semibold">vs. Mes Anterior</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {insights.month_comparison.slice(0, 4).map((cmp) => {
              const isUp = cmp.change_pct > 0;
              return (
                <div key={cmp.category_id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{getCatIcon(cmp.category_id)}</span>
                    <span className="text-xs font-medium">{getCatName(cmp.category_id)}</span>
                  </div>
                  <div className={cn("flex items-center gap-1 text-xs font-semibold", isUp ? "text-red-500" : "text-emerald-500")}>
                    {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {isUp ? '+' : ''}{cmp.change_pct.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
