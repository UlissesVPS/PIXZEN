import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CreditCard, Calendar, Trash2, ChevronRight } from 'lucide-react';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFinance, CreditCard as CreditCardType } from '@/contexts/FinanceContext';
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

export default function CreditCards() {
  const navigate = useNavigate();
  const { creditCards, addCreditCard, deleteCreditCard, getCardInvoices, accountType } = useFinance();
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const [newCard, setNewCard] = useState({
    name: '',
    lastDigits: '',
    brand: 'mastercard' as const,
    limit: '',
    dueDay: '15',
    closingDay: '8',
    color: cardColors[0].value,
  });

  const filteredCards = creditCards.filter(c => c.accountType === accountType);
  const selectedCard = selectedCardId ? creditCards.find(c => c.id === selectedCardId) : null;
  const invoices = selectedCardId ? getCardInvoices(selectedCardId) : [];

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
      accountType,
    });

    toast({ title: 'Cartão adicionado!' });
    setShowAddCard(false);
    setNewCard({ name: '', lastDigits: '', brand: 'mastercard', limit: '', dueDay: '15', closingDay: '8', color: cardColors[0].value });
  };

  const handleDeleteCard = (id: string) => {
    deleteCreditCard(id);
    setSelectedCardId(null);
    toast({ title: 'Cartão removido!' });
  };

  const getMonthName = (month: number) => {
    return new Date(2024, month, 1).toLocaleDateString('pt-BR', { month: 'long' });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex h-14 items-center justify-between px-3">
          <div className="md:hidden">
            <MobileSidebar />
          </div>
          <h1 className="font-semibold text-sm">
            {selectedCard ? selectedCard.name : 'Meus Cartões'}
          </h1>
          {!selectedCardId && (
            <Button variant="ghost" size="icon" onClick={() => setShowAddCard(true)}>
              <Plus className="h-5 w-5" />
            </Button>
          )}
          {selectedCardId && (
            <Button variant="ghost" size="icon" onClick={() => handleDeleteCard(selectedCardId)}>
              <Trash2 className="h-5 w-5 text-destructive" />
            </Button>
          )}
        </div>
      </header>

      <main className="container px-3 py-4 max-w-lg mx-auto space-y-4 pb-20">
        {!selectedCardId ? (
          // Card List
          <>
            {filteredCards.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum cartão cadastrado</p>
                <Button className="mt-4" onClick={() => setShowAddCard(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Cartão
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCards.map((card) => {
                  const usagePercent = (card.usedLimit / card.limit) * 100;
                  
                  return (
                    <button
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className="w-full text-left"
                    >
                      <div 
                        className="relative overflow-hidden rounded-xl p-4 text-white shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)` }}
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        
                        <div className="relative">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium opacity-90">{card.name}</span>
                            <span className="text-xs opacity-70 uppercase">{card.brand}</span>
                          </div>
                          
                          <p className="text-lg font-mono tracking-widest mb-4">
                            •••• •••• •••• {card.lastDigits}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <p className="opacity-70">Usado</p>
                              <p className="font-semibold">R$ {card.usedLimit.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="text-right">
                              <p className="opacity-70">Limite</p>
                              <p className="font-semibold">R$ {card.limit.toLocaleString('pt-BR')}</p>
                            </div>
                          </div>
                          
                          <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all",
                                usagePercent > 80 ? "bg-red-400" : usagePercent > 50 ? "bg-yellow-400" : "bg-white"
                              )}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 text-xs opacity-70">
                            <span>Vencimento: dia {card.dueDay}</span>
                            <span>Fechamento: dia {card.closingDay}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          // Card Detail - Invoices
          <div className="space-y-4">
            {/* Card Summary */}
            <div 
              className="relative overflow-hidden rounded-xl p-4 text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${selectedCard?.color}, ${selectedCard?.color}dd)` }}
            >
              <p className="text-sm opacity-70">Fatura Atual</p>
              <p className="text-2xl font-bold">
                R$ {invoices[0]?.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </p>
              <p className="text-xs opacity-70 mt-1">
                Vencimento: {selectedCard ? new Date(new Date().getFullYear(), new Date().getMonth(), selectedCard.dueDay).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>

            {/* Invoice List */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Faturas</h3>
              {invoices.map((invoice) => (
                <div 
                  key={invoice.id}
                  className="bg-card rounded-xl p-3 border border-border flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-sm capitalize">{getMonthName(invoice.month)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Venc. {new Date(invoice.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      R$ {invoice.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <span className={cn(
                      "text-xs",
                      invoice.status === 'paid' ? "text-income" : 
                      invoice.status === 'open' ? "text-primary" : 
                      invoice.status === 'overdue' ? "text-destructive" : "text-muted-foreground"
                    )}>
                      {invoice.status === 'paid' ? 'Paga' : 
                       invoice.status === 'open' ? 'Aberta' : 
                       invoice.status === 'overdue' ? 'Atrasada' : 'Fechada'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Add Card Dialog */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cartão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nome do Cartão</label>
              <Input
                placeholder="Ex: Nubank"
                value={newCard.name}
                onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Últimos 4 dígitos</label>
              <Input
                placeholder="1234"
                maxLength={4}
                value={newCard.lastDigits}
                onChange={(e) => setNewCard({ ...newCard, lastDigits: e.target.value.replace(/\D/g, '') })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Bandeira</label>
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
              <label className="text-xs font-medium text-muted-foreground">Limite</label>
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
                <label className="text-xs font-medium text-muted-foreground">Dia Vencimento</label>
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
                <label className="text-xs font-medium text-muted-foreground">Dia Fechamento</label>
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
              <label className="text-xs font-medium text-muted-foreground">Cor do Cartão</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {cardColors.map((color) => (
                  <button
                    key={color.value}
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
    </div>
  );
}
