import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  CreditCard,
  Bell,
  PiggyBank,
  Target,
  Wallet,
  ChevronRight,
  User,
  Plus,
  Trash2,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinance, CreditCard as CreditCardType } from '@/contexts/FinanceContext';
import { useNotifications, Reminder } from '@/contexts/NotificationsContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const personalFeatures = [
  {
    id: 'credit-cards',
    name: 'Meus Cartões',
    description: 'Cadastre e gerencie seus cartões',
    icon: CreditCard,
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    id: 'reminders',
    name: 'Lembretes',
    description: 'Crie alertas personalizados',
    icon: Bell,
    color: 'bg-amber-500/10 text-amber-500',
  },
  {
    id: 'goals',
    name: 'Metas de Economia',
    description: 'Defina objetivos financeiros',
    icon: Target,
    color: 'bg-green-500/10 text-green-500',
  },
  {
    id: 'budget',
    name: 'Orçamento Mensal',
    description: 'Limite de gastos por categoria',
    icon: PiggyBank,
    color: 'bg-blue-500/10 text-blue-500',
  },
];

const cardColors = [
  { name: 'Roxo', value: 'hsl(280, 100%, 50%)' },
  { name: 'Laranja', value: 'hsl(24, 95%, 53%)' },
  { name: 'Azul', value: 'hsl(217, 91%, 60%)' },
  { name: 'Verde', value: 'hsl(152, 69%, 40%)' },
  { name: 'Rosa', value: 'hsl(340, 82%, 52%)' },
  { name: 'Preto', value: 'hsl(220, 14%, 20%)' },
  { name: 'Dourado', value: 'hsl(38, 92%, 50%)' },
];

const cardBrands = [
  { id: 'visa', name: 'Visa' },
  { id: 'mastercard', name: 'Mastercard' },
  { id: 'elo', name: 'Elo' },
  { id: 'amex', name: 'American Express' },
  { id: 'other', name: 'Outro' },
];

// ---- Monthly Budget Component ----
function MonthlyBudget() {
  const { getFilteredTransactions, getCategoriesByType, accountType } = useFinance();
  const { user } = useAuth();

  const storageKey = 'pixzen-budgets-' + (user?.id || 'demo');

  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Persist budgets
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(budgets));
  }, [budgets, storageKey]);

  const expenseCategories = getCategoriesByType('expense', accountType);
  const transactions = getFilteredTransactions();
  const expenses = transactions.filter(t => t.type === 'expense');

  // Spending per category
  const spendingByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });
    return map;
  }, [expenses]);

  // Categories with budgets set (show first) + top categories by spend
  const displayCategories = useMemo(() => {
    const withBudget = expenseCategories.filter(c => budgets[c.id] && budgets[c.id] > 0);
    const withSpend = expenseCategories
      .filter(c => spendingByCategory[c.id] && !budgets[c.id])
      .sort((a, b) => (spendingByCategory[b.id] || 0) - (spendingByCategory[a.id] || 0))
      .slice(0, 5);
    return [...withBudget, ...withSpend];
  }, [expenseCategories, budgets, spendingByCategory]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const handleSetBudget = (catId: string) => {
    const val = parseFloat(editValue);
    if (val > 0) {
      setBudgets(prev => ({ ...prev, [catId]: val }));
      toast({ title: 'Limite definido!' });
    } else {
      // Remove budget
      setBudgets(prev => {
        const next = { ...prev };
        delete next[catId];
        return next;
      });
    }
    setEditingCat(null);
    setEditValue('');
  };

  const totalBudget = Object.values(budgets).reduce((s, v) => s + v, 0);
  const totalSpent = Object.keys(budgets).reduce((s, catId) => s + (spendingByCategory[catId] || 0), 0);
  const overallPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Overall Summary */}
      {totalBudget > 0 && (
        <div className="bg-secondary rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Gasto Total</span>
            <span className="font-medium">{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}</span>
          </div>
          <div className="h-3 bg-background rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                overallPct > 90 ? "bg-destructive" : overallPct > 70 ? "bg-amber-500" : "bg-green-500"
              )}
              style={{ width: Math.min(overallPct, 100) + '%' }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">{overallPct.toFixed(0)}% utilizado</p>
        </div>
      )}

      {/* Categories */}
      <div className="space-y-2">
        <h4 className="font-semibold text-sm">Limites por Categoria</h4>
        {displayCategories.length > 0 ? (
          displayCategories.map(cat => {
            const spent = spendingByCategory[cat.id] || 0;
            const limit = budgets[cat.id] || 0;
            const pct = limit > 0 ? (spent / limit) * 100 : 0;
            const isEditing = editingCat === cat.id;

            return (
              <div key={cat.id} className="bg-secondary rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder="Limite"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="h-7 w-24 text-xs"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSetBudget(cat.id)}
                      />
                      <Button size="sm" className="h-7 text-xs px-2" onClick={() => handleSetBudget(cat.id)}>OK</Button>
                    </div>
                  ) : (
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        setEditingCat(cat.id);
                        setEditValue(limit > 0 ? limit.toString() : '');
                      }}
                    >
                      {limit > 0 ? formatCurrency(limit) : 'Definir limite'}
                    </button>
                  )}
                </div>
                {limit > 0 && (
                  <>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          pct > 90 ? "bg-destructive" : pct > 70 ? "bg-amber-500" : "bg-green-500"
                        )}
                        style={{ width: Math.min(pct, 100) + '%' }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(spent)} gasto</span>
                      <span className={cn(pct > 90 ? "text-destructive font-medium" : "")}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </>
                )}
                {!limit && spent > 0 && (
                  <p className="text-xs text-muted-foreground">{formatCurrency(spent)} gasto este mes</p>
                )}
              </div>
            );
          })
        ) : (
          <p className="text-muted-foreground text-sm text-center py-4">
            Adicione transacoes de despesa para definir limites de orcamento
          </p>
        )}
      </div>

      {/* Add budget for other category */}
      {expenseCategories.length > displayCategories.length && (
        <Select
          onValueChange={(catId) => {
            setEditingCat(catId);
            setEditValue('');
          }}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="+ Adicionar limite para outra categoria" />
          </SelectTrigger>
          <SelectContent className="max-h-48">
            {expenseCategories
              .filter(c => !displayCategories.find(d => d.id === c.id))
              .map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}

export function PersonalMenu() {
  const navigate = useNavigate();
  const { accountType, creditCards, addCreditCard, deleteCreditCard, getFilteredTransactions, getCategoriesByType } = useFinance();
  const { reminders, addReminder, deleteReminder, toggleReminder, updateReminder } = useNotifications();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  
  // Credit Card State
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    name: '',
    lastDigits: '',
    brand: 'mastercard' as const,
    limit: '',
    dueDay: '15',
    closingDay: '8',
    color: cardColors[0].value,
  });

  // Reminder State
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: '',
    dueTime: '09:00',
    recurring: 'none' as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    category: 'custom' as 'bill' | 'goal' | 'custom',
    advanceWarning: 'same_day' as 'same_day' | '1_hour' | '1_day' | '2_days' | '1_week',
    notificationType: 'both' as 'app' | 'push' | 'both',
  });

  // Only show for personal account
  if (accountType !== 'personal') return null;

  const filteredCards = creditCards.filter(c => c.accountType === 'personal');

  const handleAddCard = () => {
    if (!newCard.name || !newCard.lastDigits || !newCard.limit) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    addCreditCard({
      name: newCard.name,
      lastDigits: newCard.lastDigits,
      brand: newCard.brand,
      limit: parseFloat(newCard.limit),
      usedLimit: 0,
      dueDay: parseInt(newCard.dueDay),
      closingDay: parseInt(newCard.closingDay),
      color: newCard.color,
      accountType: 'personal',
    });

    toast({ title: 'Cartão adicionado!' });
    setShowAddCard(false);
    setNewCard({ name: '', lastDigits: '', brand: 'mastercard', limit: '', dueDay: '15', closingDay: '8', color: cardColors[0].value });
  };

  const handleAddReminder = () => {
    if (!newReminder.title || !newReminder.dueDate) {
      toast({ title: 'Preencha título e data', variant: 'destructive' });
      return;
    }

    const dueDateTime = new Date(`${newReminder.dueDate}T${newReminder.dueTime}`);

    addReminder({
      title: newReminder.title,
      description: newReminder.description || `Lembrete: ${newReminder.title}`,
      amount: newReminder.amount ? parseFloat(newReminder.amount) : undefined,
      dueDate: dueDateTime,
      dueTime: newReminder.dueTime,
      recurring: newReminder.recurring,
      category: newReminder.category,
      enabled: true,
      advanceNotification: newReminder.advanceWarning === 'same_day' ? 'same_day' 
        : newReminder.advanceWarning === '1_hour' ? '1_hour'
        : newReminder.advanceWarning === '1_day' ? '1_day'
        : newReminder.advanceWarning === '2_days' ? '2_days'
        : newReminder.advanceWarning === '1_week' ? '1_week'
        : 'same_day',
    });

    // Schedule notification based on advance warning
    scheduleNotification(newReminder.title, dueDateTime, newReminder.advanceWarning);

    setShowAddReminder(false);
    setNewReminder({
      title: '',
      description: '',
      amount: '',
      dueDate: '',
      dueTime: '09:00',
      recurring: 'none',
      category: 'custom',
      advanceWarning: 'same_day',
      notificationType: 'both',
    });
  };

  const scheduleNotification = async (title: string, dueDate: Date, advance: string) => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }

    // Calculate notification time based on advance warning
    let notificationTime = new Date(dueDate);
    switch (advance) {
      case '1_hour':
        notificationTime.setHours(notificationTime.getHours() - 1);
        break;
      case '1_day':
        notificationTime.setDate(notificationTime.getDate() - 1);
        break;
      case '2_days':
        notificationTime.setDate(notificationTime.getDate() - 2);
        break;
      case '1_week':
        notificationTime.setDate(notificationTime.getDate() - 7);
        break;
    }

    const timeUntilNotification = notificationTime.getTime() - Date.now();
    
    if (timeUntilNotification > 0) {
      setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('PixZen - Lembrete', {
            body: title,
            icon: '/favicon.ico',
            tag: `reminder-${title}`,
          });
        }
      }, timeUntilNotification);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getRecurringLabel = (recurring: string) => {
    switch (recurring) {
      case 'daily': return 'Diário';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      default: return 'Único';
    }
  };

  const renderFeatureContent = () => {
    switch (activeFeature) {
      case 'credit-cards':
        return (
          <div className="space-y-4">
            {/* Cards List */}
            {filteredCards.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {filteredCards.map((card) => {
                  const usagePercent = (card.usedLimit / card.limit) * 100;
                  return (
                    <div
                      key={card.id}
                      className="relative overflow-hidden rounded-xl p-3 text-white"
                      style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{card.name}</span>
                        <button
                          onClick={() => deleteCreditCard(card.id)}
                          className="p-1 rounded-full hover:bg-white/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      <p className="text-xs font-mono tracking-wider opacity-90 mb-2">
                        •••• {card.lastDigits}
                      </p>
                      <div className="flex justify-between text-xs">
                        <span>Usado: {formatCurrency(card.usedLimit)}</span>
                        <span>Limite: {formatCurrency(card.limit)}</span>
                      </div>
                      <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            usagePercent > 80 ? "bg-red-400" : "bg-white"
                          )}
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-[10px] opacity-70">
                        <span>Venc.: dia {card.dueDay}</span>
                        <span>Fecha: dia {card.closingDay}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhum cartão cadastrado
              </p>
            )}
            <Button onClick={() => setShowAddCard(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cartão
            </Button>
          </div>
        );

      case 'reminders':
        return (
          <div className="space-y-4">
            {/* Reminders List */}
            {reminders.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className="bg-secondary rounded-lg p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center",
                        reminder.category === 'bill' ? "bg-red-500/10 text-red-500" :
                        reminder.category === 'goal' ? "bg-green-500/10 text-green-500" :
                        "bg-amber-500/10 text-amber-500"
                      )}>
                        {reminder.category === 'bill' ? <AlertCircle className="h-4 w-4" /> :
                         reminder.category === 'goal' ? <Target className="h-4 w-4" /> :
                         <Bell className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{reminder.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(reminder.dueDate).toLocaleDateString('pt-BR')}
                          <Clock className="h-3 w-3 ml-1" />
                          {new Date(reminder.dueDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {reminder.amount && (
                          <p className="text-xs text-primary font-medium">{formatCurrency(reminder.amount)}</p>
                        )}
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                          {getRecurringLabel(reminder.recurring)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reminder.enabled}
                        onCheckedChange={() => toggleReminder(reminder.id)}
                      />
                      <button
                        onClick={() => deleteReminder(reminder.id)}
                        className="p-1 rounded hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhum lembrete criado
              </p>
            )}
            <Button onClick={() => setShowAddReminder(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar Lembrete
            </Button>
          </div>
        );

      case 'budget':
        return <MonthlyBudget />;
    }
  };

  return (
    <>
      {/* Menu Button Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-xl p-3 flex items-center justify-between transition-all duration-300 hover:border-accent/40 hover:shadow-md",
          isExpanded && "border-accent/40 shadow-md"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <User className="h-5 w-5 text-accent" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">Ferramentas Pessoais</p>
            <p className="text-xs text-muted-foreground">Cartões, lembretes e metas</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Menu className="h-5 w-5 text-accent" />
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-300",
            isExpanded && "rotate-90"
          )} />
        </div>
      </button>

      {/* Expanded Menu */}
      {isExpanded && (
        <div className="grid grid-cols-2 gap-2 animate-fade-in">
          {personalFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => {
                  if (feature.id === 'goals') {
                    navigate('/goals');
                  } else if (feature.id === 'budget') {
                    navigate('/budgets');
                  } else {
                    setActiveFeature(feature.id);
                  }
                }}
                className="bg-card border border-border rounded-xl p-3 text-left transition-all duration-300 hover:shadow-md hover:border-accent/30 hover:scale-[1.02]"
              >
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center mb-2", feature.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="font-medium text-xs sm:text-sm truncate">{feature.name}</p>
                <p className="text-[10px] text-muted-foreground truncate hidden sm:block">{feature.description}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Feature Dialog */}
      <Dialog open={!!activeFeature} onOpenChange={() => setActiveFeature(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeFeature && (() => {
                const feature = personalFeatures.find(f => f.id === activeFeature);
                if (!feature) return null;
                const Icon = feature.icon;
                return (
                  <>
                    <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", feature.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {feature.name}
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          {renderFeatureContent()}
        </DialogContent>
      </Dialog>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cartão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Nome do Cartão</Label>
              <Input
                placeholder="Ex: Nubank"
                value={newCard.name}
                onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Últimos 4 dígitos</Label>
              <Input
                placeholder="1234"
                maxLength={4}
                value={newCard.lastDigits}
                onChange={(e) => setNewCard({ ...newCard, lastDigits: e.target.value.replace(/\D/g, '') })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Bandeira</Label>
              <Select value={newCard.brand} onValueChange={(v: any) => setNewCard({ ...newCard, brand: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cardBrands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Limite</Label>
              <Input
                type="number"
                placeholder="5000"
                value={newCard.limit}
                onChange={(e) => setNewCard({ ...newCard, limit: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Dia Vencimento</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={newCard.dueDay}
                  onChange={(e) => setNewCard({ ...newCard, dueDay: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Dia Fechamento</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={newCard.closingDay}
                  onChange={(e) => setNewCard({ ...newCard, closingDay: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Cor do Cartão</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {cardColors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setNewCard({ ...newCard, color: color.value })}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      newCard.color === color.value && "ring-2 ring-offset-2 ring-primary"
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={handleAddCard}>
              Adicionar Cartão
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Reminder Dialog */}
      <Dialog open={showAddReminder} onOpenChange={setShowAddReminder}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Lembrete</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Título</Label>
              <Input
                placeholder="Ex: Pagar conta de luz"
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Descrição (opcional)</Label>
              <Textarea
                placeholder="Detalhes do lembrete..."
                value={newReminder.description}
                onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-xs">Valor (opcional)</Label>
              <Input
                type="number"
                placeholder="R$ 0,00"
                value={newReminder.amount}
                onChange={(e) => setNewReminder({ ...newReminder, amount: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Data</Label>
                <Input
                  type="date"
                  value={newReminder.dueDate}
                  onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Horário</Label>
                <Input
                  type="time"
                  value={newReminder.dueTime}
                  onChange={(e) => setNewReminder({ ...newReminder, dueTime: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={newReminder.category} onValueChange={(v: any) => setNewReminder({ ...newReminder, category: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bill">💳 Conta a Pagar</SelectItem>
                  <SelectItem value="goal">🎯 Meta</SelectItem>
                  <SelectItem value="custom">🔔 Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Recorrência</Label>
              <Select value={newReminder.recurring} onValueChange={(v: any) => setNewReminder({ ...newReminder, recurring: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Único (não repete)</SelectItem>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Lembrar com antecedência</Label>
              <Select value={newReminder.advanceWarning} onValueChange={(v: any) => setNewReminder({ ...newReminder, advanceWarning: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same_day">No dia/horário marcado</SelectItem>
                  <SelectItem value="1_hour">1 hora antes</SelectItem>
                  <SelectItem value="1_day">1 dia antes</SelectItem>
                  <SelectItem value="2_days">2 dias antes</SelectItem>
                  <SelectItem value="1_week">1 semana antes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tipo de Notificação</Label>
              <Select value={newReminder.notificationType} onValueChange={(v: any) => setNewReminder({ ...newReminder, notificationType: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="app">📱 Apenas no app</SelectItem>
                  <SelectItem value="push">🔔 Push notification</SelectItem>
                  <SelectItem value="both">📲 Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddReminder}>
              Criar Lembrete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
