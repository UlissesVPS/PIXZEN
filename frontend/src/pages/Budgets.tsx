import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Wallet, TrendingDown, TrendingUp, AlertTriangle,
  ChevronLeft, ChevronRight, Copy, Trash2, Check, Edit2, X, Loader2,
  PieChart, Target, DollarSign, ShieldAlert,
} from 'lucide-react';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { budgetApi, type Budget } from '@/services/budgetApi';
import { useFinance, type Category } from '@/contexts/FinanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getMonthLabel = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]} ${year}`;
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const getAdjacentMonth = (monthStr: string, offset: number) => {
  const [year, month] = monthStr.split('-').map(Number);
  const d = new Date(year, month - 1 + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Demo mock budgets generator
const generateDemoBudgets = (month: string, accountType: string): Budget[] => {
  const personalBudgets = [
    { category_id: 'food', amount: 800, spent: 620 },
    { category_id: 'groceries', amount: 1200, spent: 980 },
    { category_id: 'transport', amount: 400, spent: 350 },
    { category_id: 'entertainment', amount: 300, spent: 450 },
    { category_id: 'health', amount: 500, spent: 180 },
    { category_id: 'streaming', amount: 100, spent: 95 },
    { category_id: 'utilities', amount: 600, spent: 580 },
    { category_id: 'clothing', amount: 400, spent: 120 },
    { category_id: 'education', amount: 300, spent: 300 },
  ];
  const businessBudgets = [
    { category_id: 'marketing', amount: 3000, spent: 2800 },
    { category_id: 'software', amount: 500, spent: 480 },
    { category_id: 'salary_employees', amount: 15000, spent: 15000 },
    { category_id: 'rent_biz', amount: 3500, spent: 3500 },
    { category_id: 'supplies', amount: 800, spent: 350 },
  ];
  const budgets = accountType === 'business' ? businessBudgets : personalBudgets;
  return budgets.map((b, i) => ({
    id: `demo-budget-${i}`,
    user_id: 'demo-user',
    category_id: b.category_id,
    amount: b.amount,
    month,
    spent: 0,
    actual_spent: b.spent,
    account_type: accountType,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
};

export default function Budgets() {
  const navigate = useNavigate();
  const { isDemoMode } = useAuth();
  const { categories, accountType } = useFinance();

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [newBudget, setNewBudget] = useState({ category_id: '', amount: '' });
  const [copyLoading, setCopyLoading] = useState(false);

  const expenseCategories = useMemo(() => {
    return categories.filter(c => c.type === 'expense' && (c.accountType === accountType || c.isCustom));
  }, [categories, accountType]);

  const categoriesWithoutBudget = useMemo(() => {
    const budgetedIds = new Set(budgets.map(b => b.category_id));
    return expenseCategories.filter(c => !budgetedIds.has(c.id));
  }, [expenseCategories, budgets]);

  const getCategoryInfo = useCallback((categoryId: string): Category | undefined => {
    return categories.find(c => c.id === categoryId);
  }, [categories]);

  // Load budgets
  const fetchBudgets = useCallback(async () => {
    if (isDemoMode) {
      setBudgets(generateDemoBudgets(selectedMonth, accountType));
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await budgetApi.list(selectedMonth, accountType);
      setBudgets(data);
    } catch (err) {
      console.error('Error loading budgets:', err);
      toast({ title: 'Erro ao carregar orcamentos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, accountType, isDemoMode]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // Summary calculations
  const summary = useMemo(() => {
    let totalBudgeted = 0;
    let totalSpent = 0;
    let overBudget = 0;
    let underBudget = 0;

    budgets.forEach(b => {
      const amount = Number(b.amount);
      const spent = Number(b.actual_spent ?? b.spent ?? 0);
      totalBudgeted += amount;
      totalSpent += spent;
      if (spent > amount) overBudget++;
      else underBudget++;
    });

    return {
      totalBudgeted,
      totalSpent,
      remaining: totalBudgeted - totalSpent,
      overBudget,
      underBudget,
      usagePct: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0,
    };
  }, [budgets]);

  // Sorted budgets: over-budget first, then by usage %
  const sortedBudgets = useMemo(() => {
    return [...budgets].sort((a, b) => {
      const aPct = Number(a.amount) > 0 ? (Number(a.actual_spent ?? a.spent ?? 0) / Number(a.amount)) * 100 : 0;
      const bPct = Number(b.amount) > 0 ? (Number(b.actual_spent ?? b.spent ?? 0) / Number(b.amount)) * 100 : 0;
      return bPct - aPct;
    });
  }, [budgets]);

  // Handlers
  const handleCreateBudget = async () => {
    if (!newBudget.category_id || !newBudget.amount || parseFloat(newBudget.amount) <= 0) {
      toast({ title: 'Selecione uma categoria e informe o valor', variant: 'destructive' });
      return;
    }

    if (isDemoMode) {
      const demoBudget: Budget = {
        id: `demo-budget-${Date.now()}`,
        user_id: 'demo-user',
        category_id: newBudget.category_id,
        amount: parseFloat(newBudget.amount),
        month: selectedMonth,
        spent: 0,
        actual_spent: 0,
        account_type: accountType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setBudgets(prev => [...prev, demoBudget]);
      toast({ title: 'Orcamento criado!' });
      setShowAddBudget(false);
      setNewBudget({ category_id: '', amount: '' });
      return;
    }

    try {
      await budgetApi.upsert({
        category_id: newBudget.category_id,
        amount: parseFloat(newBudget.amount),
        month: selectedMonth,
        account_type: accountType,
      });
      toast({ title: 'Orcamento criado!' });
      setShowAddBudget(false);
      setNewBudget({ category_id: '', amount: '' });
      fetchBudgets();
    } catch (err) {
      toast({ title: 'Erro ao criar orcamento', variant: 'destructive' });
    }
  };

  const handleUpdateBudget = async (budgetId: string) => {
    if (!editAmount || parseFloat(editAmount) <= 0) {
      toast({ title: 'Informe um valor valido', variant: 'destructive' });
      return;
    }

    if (isDemoMode) {
      setBudgets(prev => prev.map(b => b.id === budgetId ? { ...b, amount: parseFloat(editAmount) } : b));
      toast({ title: 'Orcamento atualizado!' });
      setEditingBudgetId(null);
      setEditAmount('');
      return;
    }

    try {
      const budget = budgets.find(b => b.id === budgetId);
      if (!budget) return;
      await budgetApi.upsert({
        category_id: budget.category_id,
        amount: parseFloat(editAmount),
        month: selectedMonth,
        account_type: accountType,
      });
      toast({ title: 'Orcamento atualizado!' });
      setEditingBudgetId(null);
      setEditAmount('');
      fetchBudgets();
    } catch (err) {
      toast({ title: 'Erro ao atualizar orcamento', variant: 'destructive' });
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (isDemoMode) {
      setBudgets(prev => prev.filter(b => b.id !== budgetId));
      toast({ title: 'Orcamento removido!' });
      return;
    }
    try {
      await budgetApi.delete(budgetId);
      toast({ title: 'Orcamento removido!' });
      fetchBudgets();
    } catch (err) {
      toast({ title: 'Erro ao remover orcamento', variant: 'destructive' });
    }
  };

  const handleCopyPrevious = async () => {
    if (isDemoMode) {
      toast({ title: 'Orcamentos do mes anterior copiados!' });
      return;
    }
    try {
      setCopyLoading(true);
      await budgetApi.copyPrevious(selectedMonth, accountType);
      toast({ title: 'Orcamentos copiados do mes anterior!' });
      fetchBudgets();
    } catch (err: any) {
      toast({ title: err.response?.data?.error || 'Erro ao copiar orcamentos', variant: 'destructive' });
    } finally {
      setCopyLoading(false);
    }
  };

  const getStatusColor = (pct: number) => {
    if (pct >= 100) return { bg: 'bg-red-500', text: 'text-red-500', border: 'border-red-500/30', light: 'bg-red-500/10' };
    if (pct >= 80) return { bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500/30', light: 'bg-amber-500/10' };
    return { bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500/30', light: 'bg-emerald-500/10' };
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex h-14 items-center justify-between px-3">
            <div className="md:hidden">
              <MobileSidebar />
            </div>
            <h1 className="font-semibold text-sm flex-1 text-center md:text-left">Orcamento Mensal</h1>
            <Button variant="ghost" size="icon" onClick={() => setShowAddBudget(true)}>
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 container px-3 py-4 max-w-lg mx-auto space-y-4 pb-24 md:pb-8">
          {/* Month Selector */}
          <div className="flex items-center justify-between bg-card rounded-xl p-3 border border-border">
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setSelectedMonth(getAdjacentMonth(selectedMonth, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-semibold text-sm">{getMonthLabel(selectedMonth)}</span>
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setSelectedMonth(getAdjacentMonth(selectedMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl p-4 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-blue-500" />
                <p className="text-[11px] text-muted-foreground">Orcado</p>
              </div>
              <p className="text-lg font-bold text-blue-500">R$ {formatCurrency(summary.totalBudgeted)}</p>
            </div>
            <div className={cn(
              "rounded-xl p-4 border",
              summary.remaining >= 0
                ? "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500/20"
                : "bg-gradient-to-br from-red-500/20 to-red-500/5 border-red-500/20"
            )}>
              <div className="flex items-center gap-2 mb-1">
                {summary.remaining >= 0 ? (
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <p className="text-[11px] text-muted-foreground">
                  {summary.remaining >= 0 ? 'Disponivel' : 'Excedido'}
                </p>
              </div>
              <p className={cn("text-lg font-bold", summary.remaining >= 0 ? "text-emerald-500" : "text-red-500")}>
                R$ {formatCurrency(Math.abs(summary.remaining))}
              </p>
            </div>
          </div>

          {/* Usage Progress */}
          {summary.totalBudgeted > 0 && (
            <div className="bg-card rounded-xl p-4 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Uso do orcamento</span>
                <span className={cn("text-xs font-bold", getStatusColor(summary.usagePct).text)}>
                  {summary.usagePct.toFixed(0)}%
                </span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", getStatusColor(summary.usagePct).bg)}
                  style={{ width: `${Math.min(summary.usagePct, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>R$ {formatCurrency(summary.totalSpent)} gasto</span>
                <span>
                  {summary.overBudget > 0 && (
                    <span className="text-red-500 font-medium">{summary.overBudget} acima</span>
                  )}
                  {summary.overBudget > 0 && summary.underBudget > 0 && ' | '}
                  {summary.underBudget > 0 && (
                    <span className="text-emerald-500 font-medium">{summary.underBudget} dentro</span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Copy from Previous + Quick Actions */}
          {budgets.length === 0 && !loading && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 text-xs" onClick={handleCopyPrevious} disabled={copyLoading}>
                {copyLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                Copiar do mes anterior
              </Button>
              <Button className="flex-1 text-xs" onClick={() => setShowAddBudget(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Novo orcamento
              </Button>
            </div>
          )}

          {/* Budget List */}
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-2">Carregando orcamentos...</p>
              </div>
            ) : sortedBudgets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <PieChart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum orcamento definido</p>
                <p className="text-xs mt-1">Defina limites para controlar seus gastos</p>
              </div>
            ) : (
              sortedBudgets.map((budget) => {
                const cat = getCategoryInfo(budget.category_id);
                const spent = Number(budget.actual_spent ?? budget.spent ?? 0);
                const amount = Number(budget.amount);
                const pct = amount > 0 ? (spent / amount) * 100 : 0;
                const remaining = amount - spent;
                const status = getStatusColor(pct);
                const isEditing = editingBudgetId === budget.id;

                return (
                  <div key={budget.id} className={cn("bg-card rounded-xl p-4 border transition-all", status.border)}>
                    <div className="flex items-center gap-3 mb-3">
                      {/* Category Icon */}
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0", status.light)}>
                        {cat?.icon || '📊'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{cat?.name || budget.category_id}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>R$ {formatCurrency(spent)}</span>
                          <span>/</span>
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="h-6 w-20 text-xs px-1"
                                autoFocus
                              />
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleUpdateBudget(budget.id)}>
                                <Check className="h-3 w-3 text-emerald-500" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingBudgetId(null); setEditAmount(''); }}>
                                <X className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          ) : (
                            <span>R$ {formatCurrency(amount)}</span>
                          )}
                        </div>
                      </div>

                      {/* Percentage Badge */}
                      <div className={cn("px-2 py-1 rounded-lg text-xs font-bold", status.light, status.text)}>
                        {pct.toFixed(0)}%
                      </div>

                      {/* Actions */}
                      {!isEditing && (
                        <div className="flex items-center gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                            setEditingBudgetId(budget.id);
                            setEditAmount(String(amount));
                          }}>
                            <Edit2 className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteBudget(budget.id)}>
                            <Trash2 className="h-3 w-3 text-muted-foreground" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", status.bg)}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    {/* Bottom Info */}
                    <div className="flex items-center justify-between mt-2 text-[10px]">
                      {remaining >= 0 ? (
                        <span className="text-emerald-500 font-medium">R$ {formatCurrency(remaining)} disponivel</span>
                      ) : (
                        <span className="text-red-500 font-medium">R$ {formatCurrency(Math.abs(remaining))} acima do limite</span>
                      )}
                      {pct >= 80 && pct < 100 && (
                        <span className="text-amber-500 flex items-center gap-0.5">
                          <AlertTriangle className="h-3 w-3" /> Quase no limite
                        </span>
                      )}
                      {pct >= 100 && (
                        <span className="text-red-500 flex items-center gap-0.5">
                          <ShieldAlert className="h-3 w-3" /> Limite estourado!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Copy from Previous (when has budgets) */}
          {budgets.length > 0 && !loading && (
            <Button variant="outline" className="w-full text-xs" onClick={handleCopyPrevious} disabled={copyLoading}>
              {copyLoading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
              Copiar orcamentos do mes anterior
            </Button>
          )}
        </main>

        <BottomNav />
      </div>

      {/* Add Budget Dialog */}
      <Dialog open={showAddBudget} onOpenChange={setShowAddBudget}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Orcamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              {categoriesWithoutBudget.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-2 text-center py-4">
                  Todas as categorias ja possuem orcamento definido para este mes.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-[200px] overflow-y-auto">
                  {categoriesWithoutBudget.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setNewBudget({ ...newBudget, category_id: cat.id })}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all text-xs",
                        newBudget.category_id === cat.id
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className="truncate font-medium">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Limite mensal (R$)</label>
              <Input
                type="number"
                placeholder="0,00"
                value={newBudget.amount}
                onChange={(e) => setNewBudget({ ...newBudget, amount: e.target.value })}
                className="mt-1 text-lg font-semibold"
              />
              {/* Quick amounts */}
              <div className="flex gap-1.5 mt-2">
                {[200, 500, 1000, 2000, 5000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setNewBudget({ ...newBudget, amount: String(v) })}
                    className="flex-1 py-1.5 rounded-lg border border-border text-[10px] font-medium hover:bg-secondary transition-colors"
                  >
                    R$ {v >= 1000 ? `${v / 1000}k` : v}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleCreateBudget}
              disabled={!newBudget.category_id || !newBudget.amount}
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Definir Orcamento
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
