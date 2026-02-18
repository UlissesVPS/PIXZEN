import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Shield, Brain, BarChart3, MessageSquare, FileText,
  RefreshCw, Ban, CheckCircle, Edit, Trash2,
  DollarSign, TrendingUp, TrendingDown, MessageCircle,
  Search, MoreVertical, Calendar, Receipt,
  Menu, X, Home, ChevronRight, Activity,
  ArrowUpRight, ArrowDownRight, Zap, Target,
  UserCheck, UserX, AlertTriangle, LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/services/adminApi';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  created_at: string;
  profile?: { id: string; nome: string | null; avatar_url: string | null } | null;
  assinante?: {
    id: string;
    status: string;
    plano: string;
    criado_em: string;
    data_expiracao: string | null;
  } | null;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  trialUsers: number;
  totalTransactions: number;
  totalTransactionsThisMonth: number;
  totalIncome: number;
  totalExpenses: number;
  totalReminders: number;
  totalGoals: number;
  totalGoalsSaved: number;
  whatsappLinked: number;
  recentUsers: AdminUser[];
  userGrowth: { month: string; count: number }[];
}

interface ActivityItem {
  type: 'transaction' | 'ai_usage';
  description: string;
  user: string;
  created_at: string;
}

type ActiveSection = 'overview' | 'users' | 'quick-nav';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('pt-BR', { month: 'short' });
};

const getUserStatus = (u: AdminUser): string => {
  if (!u.assinante) return 'trial';
  return u.assinante.status || 'trial';
};

const getUserPlan = (u: AdminUser): string => {
  if (!u.assinante) return 'trial';
  return u.assinante.plano || 'trial';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ativo': case 'active': return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'trial': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'inativo': case 'inactive': return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20';
    case 'premium': return 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20';
    default: return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    ativo: 'Ativo', active: 'Ativo', trial: 'Trial',
    inativo: 'Inativo', inactive: 'Inativo', premium: 'Premium',
  };
  return map[status] || status;
};

const getPlanColor = (plan: string) => {
  switch (plan?.toLowerCase()) {
    case 'premium': case 'pro': return 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20';
    case 'trial': return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'basic': case 'basico': return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20';
    default: return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20';
  }
};

const getInitial = (name: string | null, email: string) => {
  const src = name || email;
  return (src || '?').charAt(0).toUpperCase();
};

// ─── Sidebar Navigation ───────────────────────────────────────────────────────

const navItems = [
  { id: 'overview' as ActiveSection, label: 'Visao Geral', icon: BarChart3 },
  { id: 'users' as ActiveSection, label: 'Usuarios', icon: Users },
  { id: 'quick-nav' as ActiveSection, label: 'Navegacao', icon: Zap },
];

interface SidebarContentProps {
  activeSection: ActiveSection;
  onNavigate: (section: ActiveSection) => void;
  user: { email: string; name: string | null; is_admin: boolean } | null;
  onClose?: () => void;
}

function SidebarContent({ activeSection, onNavigate, user, onClose }: SidebarContentProps) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Shield className="h-4.5 w-4.5 text-primary-foreground" style={{ height: '18px', width: '18px' }} />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-tight">PixZen</p>
            <p className="text-xs text-white/50 leading-tight">Super Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 mb-3">
          Painel
        </p>
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => { onNavigate(id); onClose?.(); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 group
                ${isActive
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
                }
              `}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'}`} />
              <span>{label}</span>
              {isActive && <ChevronRight className="h-3 w-3 ml-auto text-white/40" />}
            </button>
          );
        })}

        <Separator className="my-3 bg-white/10" />
        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 mb-3">
          Sistema
        </p>
        <button
          onClick={() => { navigate('/admin/templates'); onClose?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all duration-150 group"
        >
          <FileText className="h-4 w-4 flex-shrink-0 text-white/40 group-hover:text-white/70" />
          Templates
        </button>
        <button
          onClick={() => { navigate('/admin/ai'); onClose?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/8 transition-all duration-150 group"
        >
          <Brain className="h-4 w-4 flex-shrink-0 text-white/40 group-hover:text-white/70" />
          Config. IA
        </button>
      </nav>

      {/* User Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitial(user?.name ?? null, user?.email ?? '')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">{user?.name || user?.email}</p>
            <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
  trend?: { value: number; positive: boolean };
  loading?: boolean;
}

function StatCard({ label, value, icon: Icon, gradient, iconColor, trend, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5">
        <Skeleton className="h-10 w-10 rounded-xl mb-3" />
        <Skeleton className="h-7 w-16 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${gradient}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${trend.positive ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/15 text-red-600 dark:text-red-400'}`}>
            {trend.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground leading-none mb-1">{value}</p>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

// ─── User Growth Chart ────────────────────────────────────────────────────────

function UserGrowthChart({ data, loading }: { data: { month: string; count: number }[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="flex items-end gap-2 h-32">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${40 + Math.random() * 60}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const displayData = data.length > 0 ? data.slice(-6) : [];
  const maxCount = Math.max(...displayData.map(d => d.count), 1);

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Crescimento de Usuarios</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Ultimos 6 meses</p>
        </div>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
      </div>
      {displayData.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
          Sem dados suficientes
        </div>
      ) : (
        <div className="flex items-end gap-2 h-32">
          {displayData.map((d, i) => {
            const heightPct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium text-muted-foreground">{d.count}</span>
                <div className="w-full relative rounded-t-md overflow-hidden bg-primary/10" style={{ height: '88px' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-primary/60 rounded-t-md transition-all duration-500"
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{formatMonth(d.month)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityFeed({ items, loading }: { items: ActivityItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5">
        <Skeleton className="h-5 w-28 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-40 mb-1.5" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Atividade Recente</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Ultimas acoes do sistema</p>
        </div>
        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Activity className="h-4 w-4 text-blue-500" />
        </div>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atividade recente</p>
        ) : (
          items.slice(0, 10).map((item, i) => (
            <div key={i} className="flex items-start gap-3 group">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                item.type === 'transaction' ? 'bg-emerald-500/10' : 'bg-purple-500/10'
              }`}>
                {item.type === 'transaction'
                  ? <Receipt className="h-3.5 w-3.5 text-emerald-500" />
                  : <Brain className="h-3.5 w-3.5 text-purple-500" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">{item.user}</span>
                  <span className="text-[10px] text-muted-foreground">·</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Recent Users List ─────────────────────────────────────────────────────────

function RecentUsersList({ users, loading }: { users: AdminUser[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-3.5 w-28 mb-1.5" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Usuarios Recentes</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Ultimos cadastros</p>
        </div>
        <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <Users className="h-4 w-4 text-violet-500" />
        </div>
      </div>
      <div className="space-y-3">
        {users.slice(0, 5).map((u) => {
          const status = getUserStatus(u);
          return (
            <div key={u.id} className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-border flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                {getInitial(u.name, u.email)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{u.name || u.email.split('@')[0]}</p>
                <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(status)}`}>
                {getStatusLabel(status)}
              </span>
            </div>
          );
        })}
        {users.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuario encontrado</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);

  // Data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  // Users tab state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // User edit modal
  const [editUserModal, setEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  // Delete confirm modal
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Access check ──
  const isAdmin = user?.is_admin === true;

  // ── Data loading ──
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await adminApi.getStats();
      setStats(data);
    } catch {
      toast({ title: 'Erro ao carregar estatisticas', variant: 'destructive' });
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const { data } = await adminApi.getActivity();
      setActivity(Array.isArray(data) ? data : []);
    } catch {
      // Activity is optional, fail silently
      setActivity([]);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const { data } = await adminApi.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast({ title: 'Erro ao carregar usuarios', variant: 'destructive' });
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isAdmin) return;
    loadStats();
    loadActivity();
    loadUsers();
  }, [isAdmin, loadStats, loadActivity, loadUsers]);

  // ── User actions ──
  const openEditUser = (u: AdminUser) => {
    setSelectedUser(u);
    setEditStatus(getUserStatus(u));
    setEditPlan(getUserPlan(u));
    setEditUserModal(true);
  };

  const saveUserStatus = async () => {
    if (!selectedUser) return;
    setSavingUser(true);
    try {
      await adminApi.updateUserStatus(selectedUser.id, { status: editStatus, plano: editPlan });
      toast({ title: 'Usuario atualizado com sucesso' });
      setEditUserModal(false);
      setSelectedUser(null);
      await loadUsers();
      await loadStats();
    } catch {
      toast({ title: 'Erro ao atualizar usuario', variant: 'destructive' });
    } finally {
      setSavingUser(false);
    }
  };

  const toggleAdmin = async (u: AdminUser) => {
    try {
      await adminApi.toggleUserAdmin(u.id, !u.is_admin);
      toast({
        title: u.is_admin ? 'Admin removido' : 'Admin concedido',
        description: `${u.name || u.email} ${u.is_admin ? 'nao e mais admin' : 'agora e admin'}`,
      });
      await loadUsers();
    } catch {
      toast({ title: 'Erro ao alterar permissao', variant: 'destructive' });
    }
  };

  const confirmDeleteUser = (u: AdminUser) => {
    setUserToDelete(u);
    setDeleteConfirmModal(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await adminApi.deleteUser(userToDelete.id);
      toast({ title: 'Usuario excluido', description: `${userToDelete.name || userToDelete.email} foi removido.` });
      setDeleteConfirmModal(false);
      setUserToDelete(null);
      await loadUsers();
      await loadStats();
    } catch {
      toast({ title: 'Erro ao excluir usuario', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // ── Filtered users ──
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchSearch = !q || u.email.toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q);
    const status = getUserStatus(u);
    const matchStatus = statusFilter === 'all' || status === statusFilter;
    return matchSearch && matchStatus;
  });

  // ── Access denied ──
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-5">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Esta area e exclusiva para administradores do sistema.
            Faca login com uma conta de administrador.
          </p>
          <Button onClick={() => navigate('/app')} className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Voltar ao App
          </Button>
        </div>
      </div>
    );
  }

  // ── Sidebar styles ──
  const sidebarBg = 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900';

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Desktop Sidebar ── */}
      <aside className={`hidden lg:flex flex-col w-60 flex-shrink-0 fixed inset-y-0 left-0 z-40 ${sidebarBg} shadow-2xl`}>
        <SidebarContent
          activeSection={activeSection}
          onNavigate={setActiveSection}
          user={user}
        />
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">

        {/* ── Top Header ── */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between h-14 px-4 md:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-60 border-r-0" aria-describedby={undefined}>
                  <SheetTitle className="sr-only">Menu de navegacao admin</SheetTitle>
                  <div className={`h-full ${sidebarBg}`}>
                    <SidebarContent
                      activeSection={activeSection}
                      onNavigate={setActiveSection}
                      user={user}
                      onClose={() => setMobileMenuOpen(false)}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Page title */}
              <div>
                <h1 className="text-sm font-semibold text-foreground leading-tight">
                  {activeSection === 'overview' && 'Visao Geral'}
                  {activeSection === 'users' && 'Gerenciar Usuarios'}
                  {activeSection === 'quick-nav' && 'Navegacao Rapida'}
                </h1>
                <p className="text-[10px] text-muted-foreground">
                  Painel de Administracao · PixZen
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => { loadStats(); loadActivity(); loadUsers(); }}
                title="Atualizar dados"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <ThemeToggle />
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => navigate('/app')}>
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sair do Admin</span>
              </Button>
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 p-4 md:p-6 space-y-6">

          {/* ══ OVERVIEW SECTION ══ */}
          {activeSection === 'overview' && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                <StatCard
                  label="Total Usuarios"
                  value={stats?.totalUsers ?? 0}
                  icon={Users}
                  gradient="bg-card"
                  iconColor="bg-blue-500/15 text-blue-500"
                  loading={statsLoading}
                />
                <StatCard
                  label="Usuarios Ativos"
                  value={stats?.activeUsers ?? 0}
                  icon={UserCheck}
                  gradient="bg-card"
                  iconColor="bg-emerald-500/15 text-emerald-500"
                  loading={statsLoading}
                />
                <StatCard
                  label="Em Trial"
                  value={stats?.trialUsers ?? 0}
                  icon={Calendar}
                  gradient="bg-card"
                  iconColor="bg-amber-500/15 text-amber-500"
                  loading={statsLoading}
                />
                <StatCard
                  label="Transacoes/Mes"
                  value={stats?.totalTransactionsThisMonth ?? 0}
                  icon={Receipt}
                  gradient="bg-card"
                  iconColor="bg-violet-500/15 text-violet-500"
                  loading={statsLoading}
                />
                <StatCard
                  label="Receita Total"
                  value={formatCurrency(stats?.totalIncome ?? 0)}
                  icon={TrendingUp}
                  gradient="bg-card"
                  iconColor="bg-emerald-500/15 text-emerald-500"
                  loading={statsLoading}
                />
                <StatCard
                  label="WhatsApp Vinculados"
                  value={stats?.whatsappLinked ?? 0}
                  icon={MessageCircle}
                  gradient="bg-card"
                  iconColor="bg-green-500/15 text-green-500"
                  loading={statsLoading}
                />
              </div>

              {/* Secondary Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-xs font-medium text-muted-foreground">Despesas</span>
                  </div>
                  {statsLoading ? <Skeleton className="h-6 w-24" /> : (
                    <p className="text-lg font-bold text-foreground">{formatCurrency(stats?.totalExpenses ?? 0)}</p>
                  )}
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium text-muted-foreground">Metas Ativas</span>
                  </div>
                  {statsLoading ? <Skeleton className="h-6 w-12" /> : (
                    <p className="text-lg font-bold text-foreground">{stats?.totalGoals ?? 0}</p>
                  )}
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium text-muted-foreground">Guardado em Metas</span>
                  </div>
                  {statsLoading ? <Skeleton className="h-6 w-24" /> : (
                    <p className="text-lg font-bold text-foreground">{formatCurrency(stats?.totalGoalsSaved ?? 0)}</p>
                  )}
                </div>
                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-medium text-muted-foreground">Total Transacoes</span>
                  </div>
                  {statsLoading ? <Skeleton className="h-6 w-12" /> : (
                    <p className="text-lg font-bold text-foreground">{stats?.totalTransactions ?? 0}</p>
                  )}
                </div>
              </div>

              {/* Charts + Feed */}
              <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <UserGrowthChart data={stats?.userGrowth ?? []} loading={statsLoading} />
                </div>
                <div className="lg:col-span-2">
                  <ActivityFeed items={activity} loading={activityLoading} />
                </div>
              </div>

              {/* Recent Users */}
              <RecentUsersList users={stats?.recentUsers ?? []} loading={statsLoading} />
            </>
          )}

          {/* ══ USERS SECTION ══ */}
          {activeSection === 'users' && (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 text-sm whitespace-nowrap"
                  onClick={loadUsers}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Atualizar
                </Button>
              </div>

              {/* Summary badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {filteredUsers.length} de {users.length} usuarios
                </span>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-xs text-primary hover:underline"
                  >
                    Limpar busca
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Usuario
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                          Plano
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
                          Admin
                        </th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                          Cadastro
                        </th>
                        <th className="text-right px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Acoes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {usersLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                                <div>
                                  <Skeleton className="h-3.5 w-28 mb-1.5" />
                                  <Skeleton className="h-3 w-36" />
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></td>
                            <td className="px-4 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                            <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-5 w-10 rounded-full" /></td>
                            <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-3.5 w-20" /></td>
                            <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                          </tr>
                        ))
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                            Nenhum usuario encontrado
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const status = getUserStatus(u);
                          const plan = getUserPlan(u);
                          return (
                            <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/25 to-primary/5 border border-border flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                                    {getInitial(u.name, u.email)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-sm font-semibold text-foreground truncate max-w-[120px]">
                                        {u.name || u.email.split('@')[0]}
                                      </p>
                                      {u.is_admin && (
                                        <span className="inline-flex items-center gap-0.5 bg-primary/15 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-primary/20 uppercase tracking-wide flex-shrink-0">
                                          <Shield className="h-2.5 w-2.5" />
                                          Admin
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{u.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 hidden md:table-cell">
                                <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${getPlanColor(plan)}`}>
                                  {plan.charAt(0).toUpperCase() + plan.slice(1)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[11px] font-semibold px-2 py-1 rounded-full border ${getStatusColor(status)}`}>
                                  {getStatusLabel(status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                {u.is_admin ? (
                                  <span className="text-[10px] text-emerald-500 font-semibold">Sim</span>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground">Nao</span>
                                )}
                              </td>
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <span className="text-xs text-muted-foreground">{formatDate(u.created_at)}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem onClick={() => openEditUser(u)}>
                                      <Edit className="h-3.5 w-3.5 mr-2" />
                                      Editar Status/Plano
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => toggleAdmin(u)}>
                                      {u.is_admin ? (
                                        <>
                                          <UserX className="h-3.5 w-3.5 mr-2" />
                                          Remover Admin
                                        </>
                                      ) : (
                                        <>
                                          <Shield className="h-3.5 w-3.5 mr-2" />
                                          Tornar Admin
                                        </>
                                      )}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      onClick={() => confirmDeleteUser(u)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                                      Excluir Usuario
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ QUICK NAV SECTION ══ */}
          {activeSection === 'quick-nav' && (
            <div className="space-y-4 max-w-2xl">
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-1">Navegacao Rapida</h2>
                <p className="text-xs text-muted-foreground">Acesse rapidamente as areas do sistema de administracao.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/admin/templates')}
                  className="group bg-card hover:bg-muted/50 rounded-2xl border border-border p-5 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Templates de Mensagens</p>
                  <p className="text-xs text-muted-foreground">Edite mensagens do WhatsApp, emails e notificacoes do sistema.</p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary">
                    Abrir <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>

                <button
                  onClick={() => navigate('/admin/ai')}
                  className="group bg-card hover:bg-muted/50 rounded-2xl border border-border p-5 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Brain className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Configuracoes de IA</p>
                  <p className="text-xs text-muted-foreground">Gerencie modelos, prompts de sistema e monitore custos de IA.</p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary">
                    Abrir <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>

                <button
                  onClick={() => setActiveSection('users')}
                  className="group bg-card hover:bg-muted/50 rounded-2xl border border-border p-5 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Gerenciar Usuarios</p>
                  <p className="text-xs text-muted-foreground">Visualize, edite status, planos e permissoes de usuarios.</p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-medium text-primary">
                    Abrir <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>

                <button
                  onClick={() => navigate('/app')}
                  className="group bg-card hover:bg-muted/50 rounded-2xl border border-border p-5 text-left transition-all duration-150 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-500/10 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Home className="h-5 w-5 text-slate-500" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">Voltar ao App</p>
                  <p className="text-xs text-muted-foreground">Retornar ao dashboard principal do PixZen como usuario.</p>
                  <div className="flex items-center gap-1 mt-3 text-xs font-medium text-muted-foreground">
                    Sair do admin <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              </div>

              <Separator />

              <div className="bg-card rounded-2xl border border-border p-5">
                <h3 className="text-sm font-semibold text-foreground mb-1">Sobre este Painel</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Painel de super-administracao do PixZen. Gerencie usuarios, configuracoes de IA e templates de mensagens.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Total Usuarios', value: stats?.totalUsers ?? '...', icon: Users },
                    { label: 'Ativos', value: stats?.activeUsers ?? '...', icon: CheckCircle },
                    { label: 'Em Trial', value: stats?.trialUsers ?? '...', icon: Calendar },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="text-center p-3 bg-muted/40 rounded-xl">
                      <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
                      <p className="text-lg font-bold text-foreground">{value}</p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Edit User Dialog ── */}
      <Dialog open={editUserModal} onOpenChange={(open) => { if (!open) { setEditUserModal(false); setSelectedUser(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar Usuario
            </DialogTitle>
            <DialogDescription>
              Atualize o status e plano de {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/25 to-primary/5 border border-border flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {getInitial(selectedUser.name, selectedUser.email)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{selectedUser.name || 'Sem nome'}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedUser.email}</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plano</label>
                <Select value={editPlan} onValueChange={setEditPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditUserModal(false); setSelectedUser(null); }} disabled={savingUser}>
              Cancelar
            </Button>
            <Button onClick={saveUserStatus} disabled={savingUser} className="gap-2">
              {savingUser && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Salvar Alteracoes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ── */}
      <Dialog open={deleteConfirmModal} onOpenChange={(open) => { if (!open && !deleting) { setDeleteConfirmModal(false); setUserToDelete(null); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Confirmar Exclusao
            </DialogTitle>
            <DialogDescription>
              Esta acao e permanente e nao pode ser desfeita. O usuario e todos seus dados serao removidos.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="flex items-center gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
              <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center text-xs font-bold text-destructive flex-shrink-0">
                {getInitial(userToDelete.name, userToDelete.email)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{userToDelete.name || 'Sem nome'}</p>
                <p className="text-xs text-muted-foreground truncate">{userToDelete.email}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteConfirmModal(false); setUserToDelete(null); }} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={deleteUser} disabled={deleting} className="gap-2">
              {deleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
