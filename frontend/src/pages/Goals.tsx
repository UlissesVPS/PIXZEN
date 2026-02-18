import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Target,
  Trash2,
  Calendar,
  TrendingUp,
  Trophy,
  Sparkles,
  PiggyBank,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { goalsApi, type Goal, type CreateGoalData } from '@/services/goalsApi';
import { useAuth } from '@/contexts/AuthContext';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';

// Demo mock goals
const generateDemoGoals = (): Goal[] => [
  {
    id: 'demo-goal-1',
    user_id: 'demo-user-id',
    title: 'Viagem para Europa',
    description: 'Ferias dos sonhos em Portugal e Espanha',
    target_amount: 15000,
    current_amount: 8500,
    category: 'travel',
    icon: '🏖️',
    color: '#3B82F6',
    deadline: new Date(Date.now() + 120 * 86400000).toISOString(),
    completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-goal-2',
    user_id: 'demo-user-id',
    title: 'Reserva de Emergencia',
    description: '6 meses de despesas guardados',
    target_amount: 25000,
    current_amount: 18000,
    category: 'emergency',
    icon: '🚨',
    color: '#EF4444',
    deadline: null,
    completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-goal-3',
    user_id: 'demo-user-id',
    title: 'Notebook Novo',
    description: 'MacBook Pro para trabalho',
    target_amount: 8000,
    current_amount: 8000,
    category: 'purchase',
    icon: '💻',
    color: '#22C55E',
    deadline: null,
    completed: true,
    completed_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const GOAL_CATEGORIES = [
  { value: 'savings', label: 'Economia', icon: '💰' },
  { value: 'travel', label: 'Viagem', icon: '🏖️' },
  { value: 'purchase', label: 'Compra', icon: '🛒' },
  { value: 'education', label: 'Educacao', icon: '📚' },
  { value: 'emergency', label: 'Emergencia', icon: '🚨' },
  { value: 'investment', label: 'Investimento', icon: '📈' },
  { value: 'custom', label: 'Outro', icon: '📌' },
];

const ICON_OPTIONS = ['🎯', '💰', '🏖️', '🛒', '📚', '🚨', '📈', '📌', '🏠', '🚗', '💻', '📱', '👗', '🎓', '💍', '🎮', '🏋️', '🎸'];

const COLOR_OPTIONS = [
  '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#EAB308',
  '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#6366F1',
];

export default function Goals() {
  const navigate = useNavigate();
  const { isDemoMode } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [celebratingGoalId, setCelebratingGoalId] = useState<string | null>(null);

  const [newGoal, setNewGoal] = useState<CreateGoalData>({
    title: '',
    description: '',
    target_amount: 0,
    category: 'savings',
    icon: '🎯',
    color: '#8B5CF6',
    deadline: '',
  });

  const [editGoal, setEditGoal] = useState<{
    id: string;
    title: string;
    description: string;
    target_amount: string;
    category: string;
    icon: string;
    color: string;
    deadline: string;
  }>({
    id: '',
    title: '',
    description: '',
    target_amount: '',
    category: 'savings',
    icon: '🎯',
    color: '#8B5CF6',
    deadline: '',
  });

  // Load goals
  const fetchGoals = async () => {
    if (isDemoMode) {
      setGoals(generateDemoGoals());
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await goalsApi.list();
      setGoals(data);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar metas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [isDemoMode]);

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (filter === 'active') return !g.completed;
      if (filter === 'completed') return g.completed;
      return true;
    });
  }, [goals, filter]);

  const totalSaved = useMemo(() => {
    return goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
  }, [goals]);

  const activeGoalsCount = useMemo(() => {
    return goals.filter((g) => !g.completed).length;
  }, [goals]);

  const completedGoalsCount = useMemo(() => {
    return goals.filter((g) => g.completed).length;
  }, [goals]);

  const getPercentage = (current: number, target: number) => {
    if (target <= 0) return 0;
    const pct = (current / target) * 100;
    return Math.min(pct, 100);
  };

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dl = new Date(deadline);
    dl.setHours(0, 0, 0, 0);
    const diff = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getCategoryInfo = (categoryValue: string) => {
    return GOAL_CATEGORIES.find((c) => c.value === categoryValue) || GOAL_CATEGORIES[6];
  };

  // Create goal
  const handleCreateGoal = async () => {
    if (!newGoal.title || !newGoal.target_amount || newGoal.target_amount <= 0) {
      toast({ title: 'Preencha o titulo e o valor alvo', variant: 'destructive' });
      return;
    }

    if (isDemoMode) {
      const demoGoal: Goal = {
        id: `demo-goal-${Date.now()}`,
        user_id: 'demo-user-id',
        title: newGoal.title,
        description: newGoal.description,
        target_amount: newGoal.target_amount,
        current_amount: 0,
        category: newGoal.category,
        icon: newGoal.icon,
        color: newGoal.color,
        deadline: newGoal.deadline || null,
        completed: false,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setGoals(prev => [...prev, demoGoal]);
      toast({ title: 'Meta criada com sucesso!' });
      setShowAddGoal(false);
      setNewGoal({ title: '', description: '', target_amount: 0, category: 'savings', icon: '🎯', color: '#8B5CF6', deadline: '' });
      return;
    }

    try {
      await goalsApi.create({
        ...newGoal,
        deadline: newGoal.deadline || undefined,
      });
      toast({ title: 'Meta criada com sucesso!' });
      setShowAddGoal(false);
      setNewGoal({
        title: '',
        description: '',
        target_amount: 0,
        category: 'savings',
        icon: '🎯',
        color: '#8B5CF6',
        deadline: '',
      });
      fetchGoals();
    } catch (error: any) {
      toast({ title: 'Erro ao criar meta', variant: 'destructive' });
    }
  };

  // Deposit to goal
  const handleDeposit = async () => {
    if (!selectedGoal || !depositAmount || parseFloat(depositAmount) <= 0) {
      toast({ title: 'Informe um valor valido', variant: 'destructive' });
      return;
    }

    if (isDemoMode) {
      const amount = parseFloat(depositAmount);
      const newAmount = Number(selectedGoal.current_amount) + amount;
      const targetReached = newAmount >= Number(selectedGoal.target_amount);
      setGoals(prev => prev.map(g => g.id === selectedGoal.id ? { ...g, current_amount: newAmount, completed: targetReached, completed_at: targetReached ? new Date().toISOString() : null } : g));
      toast({ title: `R$ ${formatCurrency(amount)} depositado na meta!` });
      setShowDeposit(false);
      setDepositAmount('');
      if (targetReached) {
        setCelebratingGoalId(selectedGoal.id);
        toast({ title: '🎉 Parabens! Meta concluida!', description: `Voce atingiu sua meta "${selectedGoal.title}"!` });
        setTimeout(() => setCelebratingGoalId(null), 5000);
      }
      setSelectedGoal(null);
      return;
    }

    try {
      const result = await goalsApi.deposit(selectedGoal.id, parseFloat(depositAmount));
      toast({ title: `R$ ${formatCurrency(parseFloat(depositAmount))} depositado na meta!` });
      setShowDeposit(false);
      setDepositAmount('');
      setSelectedGoal(null);

      if (result.target_reached) {
        setCelebratingGoalId(result.goal.id);
        toast({
          title: '🎉 Parabens! Meta concluida!',
          description: `Voce atingiu sua meta "${selectedGoal.title}"!`,
        });
        setTimeout(() => setCelebratingGoalId(null), 5000);
      }

      fetchGoals();
    } catch (error: any) {
      toast({ title: 'Erro ao depositar', variant: 'destructive' });
    }
  };

  // Open edit dialog
  const handleOpenEdit = (goal: Goal) => {
    setEditGoal({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      target_amount: String(goal.target_amount),
      category: goal.category,
      icon: goal.icon,
      color: goal.color,
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
    });
    setShowEditGoal(true);
  };

  // Update goal
  const handleUpdateGoal = async () => {
    if (!editGoal.title || !editGoal.target_amount || parseFloat(editGoal.target_amount) <= 0) {
      toast({ title: 'Preencha o titulo e o valor alvo', variant: 'destructive' });
      return;
    }

    if (isDemoMode) {
      setGoals(prev => prev.map(g => g.id === editGoal.id ? { ...g, title: editGoal.title, description: editGoal.description, target_amount: parseFloat(editGoal.target_amount), category: editGoal.category, icon: editGoal.icon, color: editGoal.color, deadline: editGoal.deadline || null } : g));
      toast({ title: 'Meta atualizada!' });
      setShowEditGoal(false);
      return;
    }

    try {
      await goalsApi.update(editGoal.id, {
        title: editGoal.title,
        description: editGoal.description,
        target_amount: parseFloat(editGoal.target_amount),
        category: editGoal.category,
        icon: editGoal.icon,
        color: editGoal.color,
        deadline: editGoal.deadline || null,
      });
      toast({ title: 'Meta atualizada!' });
      setShowEditGoal(false);
      fetchGoals();
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar meta', variant: 'destructive' });
    }
  };

  // Delete goal
  const handleDeleteGoal = async (id: string) => {
    if (isDemoMode) {
      setGoals(prev => prev.filter(g => g.id !== id));
      toast({ title: 'Meta excluida' });
      return;
    }
    try {
      await goalsApi.delete(id);
      toast({ title: 'Meta excluida' });
      fetchGoals();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir meta', variant: 'destructive' });
    }
  };

  // Mark complete manually (via update endpoint)
  const handleMarkComplete = async (id: string) => {
    if (isDemoMode) {
      const goal = goals.find(g => g.id === id);
      setGoals(prev => prev.map(g => g.id === id ? { ...g, current_amount: Number(goal?.target_amount || 0), completed: true, completed_at: new Date().toISOString() } : g));
      setCelebratingGoalId(id);
      toast({ title: '🎉 Meta concluida!', description: 'Parabens por alcancar sua meta!' });
      setTimeout(() => setCelebratingGoalId(null), 5000);
      return;
    }
    try {
      const goal = goals.find((g) => g.id === id);
      await goalsApi.update(id, {
        current_amount: Number(goal?.target_amount || 0),
      });
      setCelebratingGoalId(id);
      toast({
        title: '🎉 Meta concluida!',
        description: 'Parabens por alcancar sua meta!',
      });
      setTimeout(() => setCelebratingGoalId(null), 5000);
      fetchGoals();
    } catch (error: any) {
      toast({ title: 'Erro ao completar meta', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex h-14 items-center justify-between px-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-sm flex-1 text-center md:text-left">Metas Financeiras</h1>
          <Button variant="ghost" size="icon" onClick={() => setShowAddGoal(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 container px-3 py-4 max-w-lg mx-auto space-y-4 pb-24 md:pb-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-violet-500/20 to-violet-500/5 rounded-xl p-4 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className="h-4 w-4 text-violet-500" />
              <p className="text-xs text-muted-foreground">Total Guardado</p>
            </div>
            <p className="text-xl font-bold text-violet-500">
              R$ {formatCurrency(totalSaved)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-xl p-4 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Metas</p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-xl font-bold text-amber-500">{activeGoalsCount}</p>
              <p className="text-xs text-muted-foreground">ativas</p>
              {completedGoalsCount > 0 && (
                <>
                  <p className="text-xs text-muted-foreground">|</p>
                  <p className="text-xs text-emerald-500 font-medium">{completedGoalsCount} concluidas</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Streak / Motivational Banner */}
        {activeGoalsCount > 0 && (
          <div className="bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 rounded-xl p-3 border border-violet-500/10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium">Continue assim!</p>
              <p className="text-xs text-muted-foreground">
                Voce tem {activeGoalsCount} {activeGoalsCount === 1 ? 'meta ativa' : 'metas ativas'}.
                {completedGoalsCount > 0 && ` Ja concluiu ${completedGoalsCount}!`}
              </p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-1.5 bg-secondary rounded-lg p-1">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'flex-1 py-1.5 rounded-md text-xs font-medium transition-all',
                filter === f ? 'bg-card shadow-sm' : 'text-muted-foreground'
              )}
            >
              {f === 'all' ? 'Todas' : f === 'active' ? 'Ativas' : 'Concluidas'}
            </button>
          ))}
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Carregando metas...</p>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                {filter === 'completed'
                  ? 'Nenhuma meta concluida ainda'
                  : 'Nenhuma meta encontrada'}
              </p>
              <p className="text-xs mt-1">
                {filter !== 'completed' && 'Crie sua primeira meta financeira!'}
              </p>
              {filter !== 'completed' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowAddGoal(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Meta
                </Button>
              )}
            </div>
          ) : (
            filteredGoals.map((goal) => {
              const current = Number(goal.current_amount);
              const target = Number(goal.target_amount);
              const pct = getPercentage(current, target);
              const daysLeft = getDaysUntilDeadline(goal.deadline);
              const catInfo = getCategoryInfo(goal.category);
              const isCelebrating = celebratingGoalId === goal.id;

              return (
                <div
                  key={goal.id}
                  className={cn(
                    'bg-card rounded-xl p-4 border transition-all',
                    goal.completed
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-border',
                    isCelebrating && 'ring-2 ring-amber-400 animate-pulse'
                  )}
                >
                  {/* Header Row */}
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${goal.color}20` }}
                    >
                      {goal.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{goal.title}</p>
                        {goal.completed && (
                          <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {goal.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${goal.color}20`,
                            color: goal.color,
                          }}
                        >
                          {catInfo.icon} {catInfo.label}
                        </span>
                        {daysLeft !== null && !goal.completed && (
                          <span
                            className={cn(
                              'text-[10px] flex items-center gap-1',
                              daysLeft < 0
                                ? 'text-destructive'
                                : daysLeft <= 7
                                ? 'text-amber-500'
                                : 'text-muted-foreground'
                            )}
                          >
                            <Calendar className="h-3 w-3" />
                            {daysLeft < 0
                              ? `${Math.abs(daysLeft)}d atrasada`
                              : daysLeft === 0
                              ? 'Vence hoje'
                              : `${daysLeft}d restantes`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!goal.completed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleOpenEdit(goal)}
                        >
                          <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        R$ {formatCurrency(current)} / R$ {formatCurrency(target)}
                      </span>
                      <span
                        className="font-bold"
                        style={{ color: goal.color }}
                      >
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${goal.color}, ${goal.color}CC)`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!goal.completed && (
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs font-medium"
                        style={{
                          background: `linear-gradient(135deg, ${goal.color}, ${goal.color}CC)`,
                        }}
                        onClick={() => {
                          setSelectedGoal(goal);
                          setShowDeposit(true);
                        }}
                      >
                        <TrendingUp className="h-3.5 w-3.5 mr-1" />
                        Depositar
                      </Button>
                      {pct >= 80 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs font-medium border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                          onClick={() => handleMarkComplete(goal.id)}
                        >
                          <Trophy className="h-3.5 w-3.5 mr-1" />
                          Concluir
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Completed banner */}
                  {goal.completed && (
                    <div className="mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10">
                      <Trophy className="h-4 w-4 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-500">
                        Meta concluida
                        {goal.completed_at &&
                          ` em ${new Date(goal.completed_at).toLocaleDateString('pt-BR')}`}
                      </span>
                    </div>
                  )}

                  {/* Celebration effect */}
                  {isCelebrating && (
                    <div className="mt-2 text-center text-2xl animate-bounce">
                      🎉🏆🎊
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

        <BottomNav />
      </div>

      {/* Add Goal Dialog */}
      <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Meta Financeira</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Titulo</label>
              <Input
                placeholder="Ex: Viagem para Europa"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Descricao (opcional)
              </label>
              <Textarea
                placeholder="Descreva sua meta..."
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Valor Alvo (R$)</label>
              <Input
                type="number"
                placeholder="0,00"
                value={newGoal.target_amount || ''}
                onChange={(e) =>
                  setNewGoal({ ...newGoal, target_amount: parseFloat(e.target.value) || 0 })
                }
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <Select
                value={newGoal.category}
                onValueChange={(v) => {
                  const cat = GOAL_CATEGORIES.find((c) => c.value === v);
                  setNewGoal({ ...newGoal, category: v, icon: cat?.icon || '🎯' });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Icone</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setNewGoal({ ...newGoal, icon })}
                    className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center text-lg transition-all border',
                      newGoal.icon === icon
                        ? 'border-primary bg-primary/10 scale-110'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cor</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewGoal({ ...newGoal, color })}
                    className={cn(
                      'h-8 w-8 rounded-full transition-all border-2',
                      newGoal.color === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prazo (opcional)</label>
              <Input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button className="w-full" onClick={handleCreateGoal}>
              Criar Meta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={showDeposit} onOpenChange={setShowDeposit}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Depositar na Meta
            </DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${selectedGoal.color}20` }}
                >
                  {selectedGoal.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedGoal.title}</p>
                  <p className="text-xs text-muted-foreground">
                    R$ {formatCurrency(Number(selectedGoal.current_amount))} / R${' '}
                    {formatCurrency(Number(selectedGoal.target_amount))}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Quanto deseja depositar? (R$)
                </label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="mt-1 text-lg font-semibold"
                  autoFocus
                />
                {depositAmount && parseFloat(depositAmount) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Novo saldo: R${' '}
                    {formatCurrency(
                      Number(selectedGoal.current_amount) + parseFloat(depositAmount)
                    )}
                    {Number(selectedGoal.current_amount) + parseFloat(depositAmount) >=
                      Number(selectedGoal.target_amount) && (
                      <span className="text-emerald-500 font-medium ml-1">
                        - Meta atingida! 🎉
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {[50, 100, 200, 500].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => setDepositAmount(String(quickAmount))}
                    className="flex-1 py-2 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors"
                  >
                    R$ {quickAmount}
                  </button>
                ))}
              </div>
              <Button
                className="w-full"
                onClick={handleDeposit}
                style={{
                  background: `linear-gradient(135deg, ${selectedGoal.color}, ${selectedGoal.color}CC)`,
                }}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Depositar R$ {depositAmount ? formatCurrency(parseFloat(depositAmount) || 0) : '0,00'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={showEditGoal} onOpenChange={setShowEditGoal}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Titulo</label>
              <Input
                placeholder="Ex: Viagem para Europa"
                value={editGoal.title}
                onChange={(e) => setEditGoal({ ...editGoal, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Descricao (opcional)
              </label>
              <Textarea
                placeholder="Descreva sua meta..."
                value={editGoal.description}
                onChange={(e) => setEditGoal({ ...editGoal, description: e.target.value })}
                className="mt-1 min-h-[60px]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Valor Alvo (R$)</label>
              <Input
                type="number"
                placeholder="0,00"
                value={editGoal.target_amount}
                onChange={(e) => setEditGoal({ ...editGoal, target_amount: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <Select
                value={editGoal.category}
                onValueChange={(v) => {
                  const cat = GOAL_CATEGORIES.find((c) => c.value === v);
                  setEditGoal({ ...editGoal, category: v, icon: cat?.icon || editGoal.icon });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.icon} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Icone</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {ICON_OPTIONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setEditGoal({ ...editGoal, icon })}
                    className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center text-lg transition-all border',
                      editGoal.icon === icon
                        ? 'border-primary bg-primary/10 scale-110'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Cor</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setEditGoal({ ...editGoal, color })}
                    className={cn(
                      'h-8 w-8 rounded-full transition-all border-2',
                      editGoal.color === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Prazo (opcional)</label>
              <Input
                type="date"
                value={editGoal.deadline}
                onChange={(e) => setEditGoal({ ...editGoal, deadline: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button className="w-full" onClick={handleUpdateGoal}>
              Salvar Alteracoes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
