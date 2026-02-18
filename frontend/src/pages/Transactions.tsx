import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Trash2, Pencil, Download, Building2, User, LayoutGrid, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFinance, TransactionType, Transaction, PaymentMethod, AccountType } from '@/contexts/FinanceContext';
import { cn } from '@/lib/utils';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Transactions() {
  const navigate = useNavigate();
  const { getFilteredTransactions, transactions: allTransactions, categories, deleteTransaction, updateTransaction, getCategoriesByType, accountType, periodFilter } = useFinance();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<AccountType | 'all'>('all');

  // Delete confirmation state
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const handleConfirmDelete = async () => {
    if (!deletingTransaction) return;
    try {
      await deleteTransaction(deletingTransaction.id);
      toast({ title: 'Transacao removida!' });
    } catch {
      toast({ title: 'Erro ao remover transacao', variant: 'destructive' });
    }
    setDeletingTransaction(null);
  };

  // Edit dialog state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<TransactionType>('expense');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('pix');

  const openEditDialog = (t: Transaction) => {
    setEditingTransaction(t);
    setEditDescription(t.description);
    setEditAmount(t.amount.toString());
    setEditType(t.type);
    setEditCategory(t.categoryId);
    setEditDate(new Date(t.date).toISOString().split('T')[0]);
    setEditPaymentMethod(t.paymentMethod || 'pix');
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    if (!editAmount || parseFloat(editAmount) <= 0) {
      toast({ title: 'Digite um valor valido', variant: 'destructive' });
      return;
    }
    if (!editDescription.trim()) {
      toast({ title: 'Digite uma descricao', variant: 'destructive' });
      return;
    }
    try {
      await updateTransaction(editingTransaction.id, {
        description: editDescription.trim(),
        amount: parseFloat(editAmount),
        type: editType,
        categoryId: editCategory,
        date: new Date(editDate),
        paymentMethod: editPaymentMethod,
      });
      toast({ title: 'Transacao atualizada!' });
      setEditingTransaction(null);
    } catch {
      toast({ title: 'Erro ao atualizar transacao', variant: 'destructive' });
    }
  };

  const editCategories = useMemo(() => {
    return getCategoriesByType(editType, accountType);
  }, [editType, accountType, getCategoriesByType]);

  // Export CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast({ title: 'Nenhuma transacao para exportar', variant: 'destructive' });
      return;
    }
    const header = 'Data,Descricao,Valor,Tipo,Categoria,Conta,Metodo de Pagamento';
    const rows = transactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const dateStr = new Date(t.date).toLocaleDateString('pt-BR');
      const typeStr = t.type === 'income' ? 'Receita' : 'Despesa';
      const amountStr = t.amount.toFixed(2).replace('.', ',');
      const acctStr = t.accountType === 'personal' ? 'Pessoal' : 'Empresa';
      const methodStr = t.paymentMethod || '';
      return `${dateStr},"${t.description}",${amountStr},${typeStr},"${cat?.name || ''}",${acctStr},${methodStr}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixzen-transacoes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exportado com sucesso!' });
  };

  const transactions = useMemo(() => {
    // When accountFilter is 'all', get all transactions (both personal & business)
    // Otherwise, use the context's filtered transactions (respects current accountType)
    let filtered: Transaction[];
    if (accountFilter === 'all') {
      // Apply same period filter as getFilteredTransactions but for ALL account types
      const now = new Date();
      let startDate: Date;
      switch (periodFilter) {
        case 'week': startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); break;
        case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
      }
      filtered = allTransactions.filter(t => new Date(t.date) >= startDate);
    } else {
      // Filter by specific account type
      const now = new Date();
      let startDate: Date;
      switch (periodFilter) {
        case 'week': startDate = new Date(now); startDate.setDate(startDate.getDate() - 7); break;
        case 'month': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
        case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
      }
      filtered = allTransactions.filter(t => t.accountType === accountFilter && new Date(t.date) >= startDate);
    }

    if (search) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === typeFilter);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTransactions, accountFilter, periodFilter, search, typeFilter]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, typeof transactions> = {};
    
    transactions.forEach(t => {
      const dateKey = formatDate(t.date);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });
    
    return groups;
  }, [transactions]);

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex h-16 items-center px-4">
            <div className="md:hidden">
              <MobileSidebar />
            </div>
            <h1 className="flex-1 text-center md:text-left font-semibold">Transações</h1>
            <Button variant="ghost" size="icon" onClick={handleExportCSV} title="Exportar CSV">
              <Download className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">
          <div className="container px-4 py-6 max-w-4xl mx-auto space-y-4">
            {/* Search & Filters */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transações..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Account Filter */}
            <div className="flex gap-2">
              {([
                { value: 'all' as const, label: 'Todas Contas', icon: LayoutGrid },
                { value: 'personal' as const, label: 'Pessoal', icon: User },
                { value: 'business' as const, label: 'Empresa', icon: Building2 },
              ]).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setAccountFilter(value)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    accountFilter === value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div className="flex gap-2">
              {(['all', 'income', 'expense'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTypeFilter(filter)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    typeFilter === filter
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {filter === 'all' ? 'Todas' : filter === 'income' ? 'Receitas' : 'Despesas'}
                </button>
              ))}
            </div>

            {/* Transactions List */}
            {Object.keys(groupedTransactions).length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                Nenhuma transação encontrada
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedTransactions).map(([date, items]) => (
                  <div key={date}>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
                    <div className="bg-card rounded-2xl border border-border overflow-hidden">
                      {items.map((transaction, index) => {
                        const category = categories.find(c => c.id === transaction.categoryId);
                        
                        return (
                          <div 
                            key={transaction.id}
                            className={cn(
                              "flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors",
                              index !== items.length - 1 && "border-b border-border"
                            )}
                          >
                            <div 
                              className="h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                              style={{ backgroundColor: `${category?.color}20` }}
                            >
                              {category?.icon || '💰'}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{transaction.description}</p>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm text-muted-foreground">{category?.name}</p>
                                {accountFilter === 'all' && (
                                  <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                    transaction.accountType === 'personal'
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                  )}>
                                    {transaction.accountType === 'personal' ? 'Pessoal' : 'Empresa'}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-semibold text-sm",
                                transaction.type === 'income' ? "text-income" : "text-expense"
                              )}>
                                {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                              </span>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                onClick={() => openEditDialog(transaction)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setDeletingTransaction(transaction)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingTransaction} onOpenChange={(open) => !open && setDeletingTransaction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusao
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta transacao? Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {deletingTransaction && (
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{deletingTransaction.description}</span>
                <span className={cn(
                  "font-bold text-sm",
                  deletingTransaction.type === 'income' ? "text-income" : "text-expense"
                )}>
                  {deletingTransaction.type === 'income' ? '+' : '-'} {formatCurrency(deletingTransaction.amount)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {deletingTransaction.type === 'income' ? (
                  <TrendingUp className="h-3 w-3 text-income" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-expense" />
                )}
                <span>{deletingTransaction.type === 'income' ? 'Receita' : 'Despesa'}</span>
                <span>•</span>
                <span>{formatDate(deletingTransaction.date)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingTransaction(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Transacao</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Type Toggle */}
            <div className="bg-secondary rounded-lg p-1 flex">
              <button
                onClick={() => { setEditType('expense'); setEditCategory(''); }}
                className={cn(
                  "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                  editType === 'expense' ? "bg-expense text-white shadow-sm" : "text-muted-foreground"
                )}
              >
                Despesa
              </button>
              <button
                onClick={() => { setEditType('income'); setEditCategory(''); }}
                className={cn(
                  "flex-1 py-2 rounded-md text-sm font-medium transition-all",
                  editType === 'income' ? "bg-income text-white shadow-sm" : "text-muted-foreground"
                )}
              >
                Receita
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Valor</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">R$</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="pl-10 h-12 text-lg font-bold"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Descricao</label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Data</label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Forma de Pagamento</label>
              <Select value={editPaymentMethod} onValueChange={(v) => setEditPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartao Credito</SelectItem>
                  <SelectItem value="debit_card">Cartao Debito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="ted">TED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
                {editCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setEditCategory(cat.id)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                      editCategory === cat.id
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-secondary/50 hover:bg-secondary"
                    )}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <Button className="w-full h-11" onClick={handleSaveEdit} disabled={!editAmount || !editDescription || !editCategory}>
              Salvar Alteracoes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
