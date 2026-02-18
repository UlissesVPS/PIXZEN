import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BellRing,
  Plus,
  Trash2,
  Calendar,
  Repeat,
  DollarSign,
  Clock,
  Check,
  CheckCircle2,
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  ListChecks,
  Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { useNotifications, Reminder } from '@/contexts/NotificationsContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type FilterTab = 'all' | 'today' | 'week' | 'overdue';

export default function Reminders() {
  const navigate = useNavigate();
  const {
    reminders,
    loading,
    addReminder,
    deleteReminder,
    toggleReminder,
    completeReminder,
  } = useNotifications();

  const { permission, isSupported, requestPermission, scheduleNotification } = usePushNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newReminder, setNewReminder] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00',
    recurring: 'none' as Reminder['recurring'],
    category: 'custom' as Reminder['category'],
    advanceNotification: 'same_day' as Reminder['advanceNotification'],
  });

  // --- Helpers ---

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const isOverdue = (r: Reminder) => {
    const due = new Date(r.dueDate);
    due.setHours(23, 59, 59, 999);
    return due < todayStart && r.enabled && !r.completed;
  };

  const isToday = (r: Reminder) => {
    const due = new Date(r.dueDate);
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    return dueDay.getTime() === todayStart.getTime();
  };

  const isThisWeek = (r: Reminder) => {
    const due = new Date(r.dueDate);
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    return dueDay > todayStart && dueDay < weekEnd;
  };

  const isFuture = (r: Reminder) => {
    const due = new Date(r.dueDate);
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    return dueDay >= weekEnd;
  };

  // --- Computed data ---

  const activeReminders = reminders.filter(r => !r.completed);

  const overdueReminders = activeReminders.filter(isOverdue);
  const todayReminders = activeReminders.filter(r => isToday(r) && !isOverdue(r));
  const weekReminders = activeReminders.filter(r => isThisWeek(r) && !isToday(r) && !isOverdue(r));
  const futureReminders = activeReminders.filter(r => isFuture(r));

  // Summary counts
  const totalCount = activeReminders.length;
  const todayCount = todayReminders.length;
  const weekCount = weekReminders.length;
  const totalPending = activeReminders
    .filter(r => r.amount)
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  // Filter logic
  const filteredGroups = useMemo(() => {
    switch (activeFilter) {
      case 'today':
        return { overdue: [], today: todayReminders, week: [], future: [] };
      case 'week':
        return { overdue: [], today: todayReminders, week: weekReminders, future: [] };
      case 'overdue':
        return { overdue: overdueReminders, today: [], week: [], future: [] };
      default:
        return { overdue: overdueReminders, today: todayReminders, week: weekReminders, future: futureReminders };
    }
  }, [activeFilter, overdueReminders, todayReminders, weekReminders, futureReminders]);

  const hasAnyReminders = filteredGroups.overdue.length > 0 ||
    filteredGroups.today.length > 0 ||
    filteredGroups.week.length > 0 ||
    filteredGroups.future.length > 0;

  // --- Date formatting ---

  const formatDueDate = (date: Date) => {
    const d = new Date(date);
    const dueDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffMs = dueDay.getTime() - todayStart.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < -1) return `Vencido ha ${Math.abs(diffDays)} dias`;
    if (diffDays === -1) return 'Vencido ontem';
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanha';
    if (diffDays <= 7) return `Em ${diffDays} dias`;
    if (diffDays <= 30) return `Em ${Math.ceil(diffDays / 7)} semanas`;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bill': return '📄';
      case 'goal': return '🎯';
      default: return '📌';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'bill': return 'Conta';
      case 'goal': return 'Meta';
      default: return 'Outros';
    }
  };

  const getRecurringLabel = (recurring: string) => {
    switch (recurring) {
      case 'daily': return 'Diario';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      default: return '';
    }
  };

  const getAdvanceLabel = (advance: string) => {
    switch (advance) {
      case '1_hour': return '1h antes';
      case '1_day': return '1 dia antes';
      case '2_days': return '2 dias antes';
      case '1_week': return '1 semana antes';
      case 'same_day': return 'No horario';
      default: return '';
    }
  };

  // --- Actions ---

  const handleAddReminder = async () => {
    if (!newReminder.title || !newReminder.dueDate) {
      toast({ title: 'Preencha titulo e data', variant: 'destructive' });
      return;
    }

    const dueDateTime = new Date(`${newReminder.dueDate}T${newReminder.dueTime || '09:00'}`);
    const reminderId = Date.now().toString();

    await addReminder({
      title: newReminder.title,
      description: newReminder.description,
      amount: newReminder.amount ? parseFloat(newReminder.amount) : undefined,
      dueDate: dueDateTime,
      dueTime: newReminder.dueTime,
      recurring: newReminder.recurring,
      enabled: true,
      category: newReminder.category,
      advanceNotification: newReminder.advanceNotification,
    });

    // Request push permission in background
    if (permission !== 'granted' && isSupported) {
      requestPermission().catch(() => {});
    }

    // Schedule push notification
    scheduleReminderNotification(reminderId, newReminder.title, newReminder.description, dueDateTime, newReminder.advanceNotification);

    setNewReminder({
      title: '',
      description: '',
      amount: '',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '09:00',
      recurring: 'none',
      category: 'custom',
      advanceNotification: 'same_day',
    });
    setShowAddReminder(false);
  };

  const scheduleReminderNotification = (
    id: string,
    title: string,
    description: string,
    dueDate: Date,
    advance: Reminder['advanceNotification']
  ) => {
    const nowMs = Date.now();
    let notificationTime = dueDate.getTime();

    switch (advance) {
      case '1_hour':
        notificationTime -= 60 * 60 * 1000;
        break;
      case '1_day':
        notificationTime -= 24 * 60 * 60 * 1000;
        break;
      case '2_days':
        notificationTime -= 2 * 24 * 60 * 60 * 1000;
        break;
      case '1_week':
        notificationTime -= 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        break;
    }

    if (notificationTime > nowMs) {
      scheduleNotification({
        id,
        title: `⏰ ${title}`,
        body: description || 'Voce tem um lembrete!',
        scheduledTime: notificationTime,
      });
    }

    if (advance !== 'none' && advance !== 'same_day' && dueDate.getTime() > nowMs) {
      scheduleNotification({
        id: `${id}-exact`,
        title: `🔔 ${title} - Agora!`,
        body: description || 'Este e o momento do seu lembrete!',
        scheduledTime: dueDate.getTime(),
      });
    }
  };

  const handleComplete = (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    completeReminder(id);
    if (reminder?.recurring && reminder.recurring !== 'none') {
      toast({
        title: 'Lembrete concluido!',
        description: 'Proxima ocorrencia criada automaticamente.',
      });
    } else {
      toast({ title: 'Lembrete concluido!' });
    }
  };

  const handleDelete = (id: string) => {
    deleteReminder(id);
  };

  // --- Render helpers ---

  const renderReminderCard = (reminder: Reminder) => {
    const due = new Date(reminder.dueDate);
    const overdueStatus = isOverdue(reminder);
    const todayStatus = isToday(reminder);

    return (
      <div
        key={reminder.id}
        className={cn(
          "bg-card rounded-xl p-4 border transition-all duration-200 hover:shadow-md group",
          !reminder.enabled && "opacity-50",
          overdueStatus && "border-destructive/40 bg-destructive/5",
          todayStatus && !overdueStatus && "border-amber-500/40 bg-amber-500/5",
        )}
      >
        <div className="flex items-start gap-3">
          {/* Category icon */}
          <div className={cn(
            "h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors",
            overdueStatus ? "bg-destructive/15" :
              todayStatus ? "bg-amber-500/15" :
                "bg-primary/10"
          )}>
            {getCategoryIcon(reminder.category)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-semibold text-sm truncate",
                !reminder.enabled && "line-through text-muted-foreground"
              )}>
                {reminder.title}
              </h3>
              {reminder.recurring !== 'none' && (
                <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                  <Repeat className="h-2.5 w-2.5" />
                  {getRecurringLabel(reminder.recurring)}
                </span>
              )}
            </div>

            {reminder.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{reminder.description}</p>
            )}

            <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2">
              {/* Due date */}
              <span className={cn(
                "text-xs font-medium flex items-center gap-1",
                overdueStatus ? "text-destructive" :
                  todayStatus ? "text-amber-600 dark:text-amber-400" :
                    "text-muted-foreground"
              )}>
                <Calendar className="h-3 w-3" />
                {formatDueDate(reminder.dueDate)}
              </span>

              {/* Time */}
              {reminder.dueTime && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {reminder.dueTime}
                </span>
              )}

              {/* Amount */}
              {reminder.amount && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                  <DollarSign className="h-3 w-3" />
                  R$ {reminder.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              )}

              {/* Advance notification */}
              {reminder.advanceNotification && reminder.advanceNotification !== 'same_day' && reminder.advanceNotification !== 'none' && (
                <span className="text-xs text-primary flex items-center gap-1">
                  <BellRing className="h-3 w-3" />
                  {getAdvanceLabel(reminder.advanceNotification)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Switch
              checked={reminder.enabled}
              onCheckedChange={() => toggleReminder(reminder.id)}
              className="scale-90"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-income hover:text-income hover:bg-income/10 transition-colors"
              onClick={() => handleComplete(reminder.id)}
              title="Concluir lembrete"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              onClick={() => handleDelete(reminder.id)}
              title="Excluir lembrete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderGroup = (
    title: string,
    reminders: Reminder[],
    borderColor: string,
    icon: React.ReactNode
  ) => {
    if (reminders.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className={cn(
          "flex items-center gap-2 px-1 pb-1 border-b",
          borderColor
        )}>
          {icon}
          <h2 className="text-sm font-semibold">{title}</h2>
          <span className="ml-auto text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium">
            {reminders.length}
          </span>
        </div>
        <div className="space-y-2">
          {reminders.map(renderReminderCard)}
        </div>
      </div>
    );
  };

  // --- Page ---

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="md:hidden">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <h1 className="font-semibold text-lg">Lembretes</h1>
                {totalCount > 0 && (
                  <span className="h-6 min-w-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {totalCount}
                  </span>
                )}
              </div>
            </div>

            <Button size="sm" onClick={() => setShowAddReminder(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Lembrete</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">
          <div className="container px-4 py-6 max-w-2xl mx-auto space-y-5">

            {/* Push Notification Permission Banner */}
            {isSupported && permission !== 'granted' && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <BellRing className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Ative notificacoes push</p>
                  <p className="text-xs text-muted-foreground">Receba lembretes mesmo com o app fechado</p>
                </div>
                <Button size="sm" onClick={requestPermission}>
                  Ativar
                </Button>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-card rounded-xl p-3.5 border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ListChecks className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Total de Lembretes</p>
              </div>

              <div className="bg-card rounded-xl p-3.5 border border-border hover:border-amber-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Timer className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Vencem Hoje</p>
              </div>

              <div className="bg-card rounded-xl p-3.5 border border-border hover:border-blue-500/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{weekCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Esta Semana</p>
              </div>

              <div className="bg-card rounded-xl p-3.5 border border-border hover:border-income/30 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-lg bg-income/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-income" />
                  </div>
                </div>
                <p className="text-2xl font-bold">
                  {totalPending > 0
                    ? `R$ ${totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                    : 'R$ 0'
                  }
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Pendente</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-secondary rounded-xl p-1 flex">
              {([
                { key: 'all', label: 'Todos' },
                { key: 'today', label: 'Hoje' },
                { key: 'week', label: 'Semana' },
                { key: 'overdue', label: 'Vencidos' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(key)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                    activeFilter === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                  {key === 'overdue' && overdueReminders.length > 0 && (
                    <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {overdueReminders.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Reminders List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm">Carregando lembretes...</p>
              </div>
            ) : !hasAnyReminders ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <CalendarClock className="h-8 w-8 text-primary/50" />
                </div>
                <p className="font-medium text-foreground">
                  {activeFilter === 'all' ? 'Nenhum lembrete' : 'Nenhum lembrete nesta categoria'}
                </p>
                <p className="text-sm mt-1">
                  {activeFilter === 'all'
                    ? 'Crie lembretes para nunca esquecer suas contas e compromissos'
                    : 'Tente outro filtro ou crie um novo lembrete'
                  }
                </p>
                <Button className="mt-6 gap-2" onClick={() => setShowAddReminder(true)}>
                  <Plus className="h-4 w-4" />
                  Criar Lembrete
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {renderGroup(
                  'Vencidos',
                  filteredGroups.overdue,
                  'border-destructive/40',
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}

                {renderGroup(
                  'Hoje',
                  filteredGroups.today,
                  'border-amber-500/40',
                  <Timer className="h-4 w-4 text-amber-500" />
                )}

                {renderGroup(
                  'Esta Semana',
                  filteredGroups.week,
                  'border-blue-500/40',
                  <CalendarDays className="h-4 w-4 text-blue-500" />
                )}

                {renderGroup(
                  'Proximos',
                  filteredGroups.future,
                  'border-border',
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>

      {/* Add Reminder Dialog */}
      <Dialog open={showAddReminder} onOpenChange={setShowAddReminder}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              Novo Lembrete
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titulo</label>
              <Input
                placeholder="Ex: Conta de luz"
                value={newReminder.title}
                onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descricao</label>
              <Input
                placeholder="Ex: Pagar ate o vencimento"
                value={newReminder.description}
                onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor (opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    type="number"
                    placeholder="0,00"
                    className="pl-10"
                    value={newReminder.amount}
                    onChange={(e) => setNewReminder({ ...newReminder, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Data</label>
                <Input
                  type="date"
                  value={newReminder.dueDate}
                  onChange={(e) => setNewReminder({ ...newReminder, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Horario</label>
                <Input
                  type="time"
                  value={newReminder.dueTime}
                  onChange={(e) => setNewReminder({ ...newReminder, dueTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select
                  value={newReminder.category}
                  onValueChange={(value: Reminder['category']) =>
                    setNewReminder({ ...newReminder, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bill">📄 Conta</SelectItem>
                    <SelectItem value="goal">🎯 Meta</SelectItem>
                    <SelectItem value="custom">📌 Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Repeticao</label>
                <Select
                  value={newReminder.recurring}
                  onValueChange={(value: Reminder['recurring']) =>
                    setNewReminder({ ...newReminder, recurring: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unico</SelectItem>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="yearly">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1.5">
                  <BellRing className="h-3.5 w-3.5" />
                  Antecedencia
                </label>
                <Select
                  value={newReminder.advanceNotification}
                  onValueChange={(value: Reminder['advanceNotification']) =>
                    setNewReminder({ ...newReminder, advanceNotification: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="same_day">No horario</SelectItem>
                    <SelectItem value="1_hour">1 hora antes</SelectItem>
                    <SelectItem value="1_day">1 dia antes</SelectItem>
                    <SelectItem value="2_days">2 dias antes</SelectItem>
                    <SelectItem value="1_week">1 semana antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button className="w-full mt-2 gap-2" onClick={handleAddReminder}>
              <Plus className="h-4 w-4" />
              Criar Lembrete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
