import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Check, Calendar, User } from 'lucide-react';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFinance } from '@/contexts/FinanceContext';
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

export default function Receivables() {
  const navigate = useNavigate();
  const { receivables, addReceivable, markAsReceived, categories, accountType } = useFinance();
  const [showAddReceivable, setShowAddReceivable] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'received'>('all');

  const [newReceivable, setNewReceivable] = useState({
    description: '',
    amount: '',
    expectedDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    payer: '',
  });

  const filteredReceivables = receivables
    .filter(r => r.accountType === accountType)
    .filter(r => {
      if (filter === 'all') return true;
      return r.status === filter;
    })
    .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime());

  const incomeCategories = categories.filter(c => c.type === 'income' && (c.accountType === accountType || c.isCustom));

  const handleAddReceivable = () => {
    if (!newReceivable.description || !newReceivable.amount || !newReceivable.categoryId) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    addReceivable({
      description: newReceivable.description,
      amount: parseFloat(newReceivable.amount),
      expectedDate: new Date(newReceivable.expectedDate),
      categoryId: newReceivable.categoryId,
      status: 'pending',
      payer: newReceivable.payer,
      accountType,
    });

    toast({ title: 'Valor a receber adicionado!' });
    setShowAddReceivable(false);
    setNewReceivable({ description: '', amount: '', expectedDate: new Date().toISOString().split('T')[0], categoryId: '', payer: '' });
  };

  const handleMarkAsReceived = (id: string) => {
    markAsReceived(id);
    toast({ title: 'Valor marcado como recebido!' });
  };

  const totalPending = filteredReceivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex h-14 items-center justify-between px-3">
          <div className="md:hidden">
            <MobileSidebar />
          </div>
          <h1 className="font-semibold text-sm">Valores a Receber</h1>
          <Button variant="ghost" size="icon" onClick={() => setShowAddReceivable(true)}>
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container px-3 py-4 max-w-lg mx-auto space-y-4 pb-20">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-income/20 to-income/5 rounded-xl p-4 border border-income/20">
          <p className="text-xs text-muted-foreground mb-1">Total a Receber</p>
          <p className="text-2xl font-bold text-income">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {filteredReceivables.filter(r => r.status === 'pending').length} valores pendentes
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-1.5 bg-secondary rounded-lg p-1">
          {(['all', 'pending', 'received'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
                filter === f ? "bg-card shadow-sm" : "text-muted-foreground"
              )}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Recebidos'}
            </button>
          ))}
        </div>

        {/* Receivables List */}
        <div className="space-y-2">
          {filteredReceivables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhum valor a receber encontrado</p>
            </div>
          ) : (
            filteredReceivables.map((receivable) => {
              const category = categories.find(c => c.id === receivable.categoryId);

              return (
                <div 
                  key={receivable.id}
                  className="bg-card rounded-xl p-3 border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-10 w-10 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${category?.color}20` }}
                    >
                      {category?.icon || '💵'}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{receivable.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(receivable.expectedDate).toLocaleDateString('pt-BR')}</span>
                        {receivable.payer && (
                          <>
                            <User className="h-3 w-3" />
                            <span className="truncate">{receivable.payer}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-sm text-income">
                        R$ {receivable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {receivable.status === 'pending' ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-7 text-xs mt-1"
                          onClick={() => handleMarkAsReceived(receivable.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Recebido
                        </Button>
                      ) : (
                        <span className="text-xs text-income">✓ Recebido</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Add Receivable Dialog */}
      <Dialog open={showAddReceivable} onOpenChange={setShowAddReceivable}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo Valor a Receber</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Descrição</label>
              <Input
                placeholder="Ex: Pagamento freelance"
                value={newReceivable.description}
                onChange={(e) => setNewReceivable({ ...newReceivable, description: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Valor</label>
              <Input
                type="number"
                placeholder="0,00"
                value={newReceivable.amount}
                onChange={(e) => setNewReceivable({ ...newReceivable, amount: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Data Prevista</label>
              <Input
                type="date"
                value={newReceivable.expectedDate}
                onChange={(e) => setNewReceivable({ ...newReceivable, expectedDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pagador (opcional)</label>
              <Input
                placeholder="Ex: Cliente XYZ"
                value={newReceivable.payer}
                onChange={(e) => setNewReceivable({ ...newReceivable, payer: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <Select value={newReceivable.categoryId} onValueChange={(v) => setNewReceivable({ ...newReceivable, categoryId: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {incomeCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddReceivable}>
              Adicionar Valor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
