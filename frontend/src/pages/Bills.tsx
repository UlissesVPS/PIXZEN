import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, Calendar, AlertCircle, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFinance, Bill } from '@/contexts/FinanceContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Bills() {
  const navigate = useNavigate();
  const { bills, addBill, updateBill, markBillAsPaid, deleteBill, categories, accountType } = useFinance();
  const [showAddBill, setShowAddBill] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '', dueDate: '', categoryId: '', recurrence: 'once' as string });
  const [newBill, setNewBill] = useState({ description: '', amount: '', dueDate: new Date().toISOString().split('T')[0], categoryId: '', recurrence: 'once' as const });

  const filteredBills = bills.filter(b => b.accountType === accountType).filter(b => filter === 'all' ? true : b.status === filter).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const expenseCategories = categories.filter(c => c.type === 'expense' && (c.accountType === accountType || c.isCustom));

  const handleAddBill = () => {
    if (!newBill.description || !newBill.amount || !newBill.categoryId) { toast({ title: 'Preencha todos os campos', variant: 'destructive' }); return; }
    addBill({ description: newBill.description, amount: parseFloat(newBill.amount), dueDate: new Date(newBill.dueDate), categoryId: newBill.categoryId, status: 'pending', recurrence: newBill.recurrence, accountType });
    toast({ title: 'Conta adicionada!' }); setShowAddBill(false);
    setNewBill({ description: '', amount: '', dueDate: new Date().toISOString().split('T')[0], categoryId: '', recurrence: 'once' });
  };

  const handleConfirmDelete = async () => {
    if (!deletingBill) return;
    try { await deleteBill(deletingBill.id); toast({ title: 'Conta removida!' }); } catch { toast({ title: 'Erro ao remover', variant: 'destructive' }); }
    setDeletingBill(null);
  };

  const openEditDialog = (bill: Bill) => {
    setEditingBill(bill);
    setEditForm({ description: bill.description, amount: bill.amount.toString(), dueDate: new Date(bill.dueDate).toISOString().split('T')[0], categoryId: bill.categoryId, recurrence: bill.recurrence || 'once' });
  };

  const handleSaveEdit = async () => {
    if (!editingBill || !editForm.description || !editForm.amount) return;
    try {
      if (updateBill) await updateBill(editingBill.id, { description: editForm.description, amount: parseFloat(editForm.amount), dueDate: new Date(editForm.dueDate), categoryId: editForm.categoryId, recurrence: editForm.recurrence as any });
      toast({ title: 'Conta atualizada!' }); setEditingBill(null);
    } catch { toast({ title: 'Erro ao atualizar', variant: 'destructive' }); }
  };

  const getDaysUntilDue = (dueDate: Date) => { const today = new Date(); today.setHours(0,0,0,0); const due = new Date(dueDate); due.setHours(0,0,0,0); return Math.ceil((due.getTime() - today.getTime()) / (1000*60*60*24)); };
  const totalPending = filteredBills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex h-14 items-center justify-between px-3">
          <div className="md:hidden"><MobileSidebar /></div>
          <h1 className="font-semibold text-sm">Contas a Pagar</h1>
          <Button variant="ghost" size="icon" onClick={() => setShowAddBill(true)}><Plus className="h-5 w-5" /></Button>
        </div>
      </header>
      <main className="container px-3 py-4 max-w-lg mx-auto space-y-4 pb-20">
        <div className="bg-gradient-to-br from-expense/20 to-expense/5 rounded-xl p-4 border border-expense/20">
          <p className="text-xs text-muted-foreground mb-1">Total Pendente</p>
          <p className="text-2xl font-bold text-expense">R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">{filteredBills.filter(b => b.status === 'pending').length} contas pendentes</p>
        </div>
        <div className="flex gap-1.5 bg-secondary rounded-lg p-1">
          {(['all', 'pending', 'paid', 'overdue'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn("flex-1 py-1.5 rounded-md text-xs font-medium transition-all", filter === f ? "bg-card shadow-sm" : "text-muted-foreground")}>
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : f === 'paid' ? 'Pagas' : 'Atrasadas'}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {filteredBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><p className="text-sm">Nenhuma conta encontrada</p></div>
          ) : filteredBills.map((bill) => {
            const category = categories.find(c => c.id === bill.categoryId);
            const daysUntil = getDaysUntilDue(bill.dueDate);
            const isOverdue = daysUntil < 0 && bill.status === 'pending';
            const isDueSoon = daysUntil >= 0 && daysUntil <= 3 && bill.status === 'pending';
            return (
              <div key={bill.id} className={cn("bg-card rounded-xl p-3 border", isOverdue ? "border-destructive/50" : isDueSoon ? "border-warning/50" : "border-border")}>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${category?.color}20` }}>{category?.icon || '📄'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{bill.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" /><span>{new Date(bill.dueDate).toLocaleDateString('pt-BR')}</span>
                      {isOverdue && <span className="text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Atrasada</span>}
                      {isDueSoon && !isOverdue && <span className="text-warning">Vence em {daysUntil} dias</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-right mr-1">
                      <p className="font-semibold text-sm text-expense">R$ {bill.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      {bill.status === 'pending' ? (
                        <Button size="sm" variant="outline" className="h-6 text-[10px] mt-0.5 px-2" onClick={() => markBillAsPaid(bill.id)}><Check className="h-3 w-3 mr-0.5" /> Pagar</Button>
                      ) : <span className="text-xs text-income">✓ Paga</span>}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(bill)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeletingBill(bill)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Dialog open={!!deletingBill} onOpenChange={(open) => !open && setDeletingBill(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Confirmar Exclusao</DialogTitle>
            <DialogDescription>Tem certeza que deseja excluir "{deletingBill?.description}"?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeletingBill(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingBill} onOpenChange={(open) => !open && setEditingBill(null)}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Conta</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-xs font-medium text-muted-foreground">Descricao</label><Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Valor</label><Input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Vencimento</label><Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <Select value={editForm.categoryId} onValueChange={(v) => setEditForm({ ...editForm, categoryId: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{expenseCategories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>))}</SelectContent></Select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Recorrencia</label>
              <Select value={editForm.recurrence} onValueChange={(v) => setEditForm({ ...editForm, recurrence: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="once">Unica vez</SelectItem><SelectItem value="monthly">Mensal</SelectItem><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="yearly">Anual</SelectItem></SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleSaveEdit}>Salvar Alteracoes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddBill} onOpenChange={setShowAddBill}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Nova Conta a Pagar</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-xs font-medium text-muted-foreground">Descricao</label><Input placeholder="Ex: Conta de luz" value={newBill.description} onChange={(e) => setNewBill({ ...newBill, description: e.target.value })} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Valor</label><Input type="number" placeholder="0,00" value={newBill.amount} onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Vencimento</label><Input type="date" value={newBill.dueDate} onChange={(e) => setNewBill({ ...newBill, dueDate: e.target.value })} className="mt-1" /></div>
            <div><label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <Select value={newBill.categoryId} onValueChange={(v) => setNewBill({ ...newBill, categoryId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{expenseCategories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>))}</SelectContent></Select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Recorrencia</label>
              <Select value={newBill.recurrence} onValueChange={(v: any) => setNewBill({ ...newBill, recurrence: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="once">Unica vez</SelectItem><SelectItem value="monthly">Mensal</SelectItem><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="yearly">Anual</SelectItem></SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleAddBill}>Adicionar Conta</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
