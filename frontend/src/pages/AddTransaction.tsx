import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Plus, Search, X, CreditCard, Banknote, Smartphone, Building2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFinance, TransactionType, PaymentMethod } from '@/contexts/FinanceContext';
import { AddCategoryDialog } from '@/components/categories/AddCategoryDialog';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'pix', label: 'PIX', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'cash', label: 'Dinheiro', icon: <Banknote className="h-4 w-4" /> },
  { id: 'credit_card', label: 'Cartão Crédito', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'debit_card', label: 'Cartão Débito', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'boleto', label: 'Boleto', icon: <FileText className="h-4 w-4" /> },
  { id: 'ted', label: 'TED', icon: <Building2 className="h-4 w-4" /> },
];

export default function AddTransaction() {
  const navigate = useNavigate();
  const { addTransaction, getCategoriesByType, accountType } = useFinance();
  
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [installments, setInstallments] = useState(1);

  const categories = getCategoriesByType(type, accountType);
  
  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories;
    return categories.filter(c => 
      c.name.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const installmentValue = useMemo(() => {
    const value = parseFloat(amount) || 0;
    return value / installments;
  }, [amount, installments]);

  const handleSubmit = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: 'Digite um valor válido', variant: 'destructive' });
      return;
    }

    if (!description.trim()) {
      toast({ title: 'Digite uma descrição', variant: 'destructive' });
      return;
    }

    if (!selectedCategory) {
      toast({ title: 'Selecione uma categoria', variant: 'destructive' });
      return;
    }

    const baseTransaction = {
      description: description.trim(),
      amount: parseFloat(amount),
      type,
      categoryId: selectedCategory,
      date: new Date(date),
      accountType,
      paymentMethod,
    };

    // If credit card with installments > 1, create multiple transactions
    if (paymentMethod === 'credit_card' && installments > 1) {
      const installmentValue = parseFloat(amount) / installments;
      const groupId = Date.now().toString();
      
      for (let i = 1; i <= installments; i++) {
        const installmentDate = new Date(date);
        installmentDate.setMonth(installmentDate.getMonth() + (i - 1));
        
        addTransaction({
          ...baseTransaction,
          amount: installmentValue,
          description: `${description.trim()} (${i}/${installments})`,
          date: installmentDate,
          installments,
          currentInstallment: i,
          installmentGroupId: groupId,
        });
      }
    } else {
      addTransaction(baseTransaction);
    }

    const category = categories.find(c => c.id === selectedCategory);

    toast({
      title: 'Transação adicionada!',
      description: `${category?.icon} ${type === 'income' ? 'Receita' : 'Despesa'} de R$ ${parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${installments > 1 ? ` em ${installments}x` : ''} registrada.`,
    });

    navigate('/app');
  };

  const handleCategoryAdded = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex h-14 items-center justify-between px-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-sm">Nova Transação</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container px-3 py-4 max-w-lg mx-auto space-y-4 pb-28">
        {/* Type Toggle */}
        <div className="bg-secondary rounded-lg p-1 flex">
          <button
            onClick={() => { setType('expense'); setSelectedCategory(''); }}
            className={cn(
              "flex-1 py-2.5 rounded-md text-sm font-medium transition-all",
              type === 'expense' ? "bg-expense text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            💸 Despesa
          </button>
          <button
            onClick={() => { setType('income'); setSelectedCategory(''); }}
            className={cn(
              "flex-1 py-2.5 rounded-md text-sm font-medium transition-all",
              type === 'income' ? "bg-income text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            💰 Receita
          </button>
        </div>

        {/* Amount with Quick Values */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Valor</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">R$</span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="pl-10 h-14 text-2xl font-bold text-center"
            />
          </div>
          
          <div className="flex gap-1.5 flex-wrap">
            {[10, 20, 50, 100, 200, 500].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleQuickAmount(value)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                  parseFloat(amount) === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                R$ {value}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Descrição</label>
          <Input
            placeholder={type === 'expense' ? "Ex: Almoço no restaurante" : "Ex: Pagamento freelance"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-11"
          />
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Data</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11"
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Forma de Pagamento</label>
          <div className="grid grid-cols-3 gap-1.5">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => {
                  setPaymentMethod(method.id);
                  if (method.id !== 'credit_card') {
                    setInstallments(1);
                  }
                }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs",
                  paymentMethod === method.id
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-secondary/50 hover:bg-secondary"
                )}
              >
                {method.icon}
                <span className="font-medium truncate w-full text-center">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Credit Card - Installment Selection */}
        {paymentMethod === 'credit_card' && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs font-medium text-muted-foreground">Parcelas</label>
            <Select value={installments.toString()} onValueChange={(v) => setInstallments(parseInt(v))}>
              <SelectTrigger className="w-full h-11 bg-card">
                <SelectValue placeholder="Selecione as parcelas" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border max-h-64">
                {Array.from({ length: 18 }, (_, i) => i + 1).map((n) => {
                  const value = parseFloat(amount) || 0;
                  const installmentVal = value / n;
                  return (
                    <SelectItem key={n} value={n.toString()} className="cursor-pointer">
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-medium">{n}x {n === 1 ? '(à vista)' : ''}</span>
                        {value > 0 && (
                          <span className="text-muted-foreground text-xs">
                            R$ {installmentVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            
            {/* Installment Summary */}
            {parseFloat(amount) > 0 && (
              <div className="bg-secondary/50 rounded-lg p-3 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {installments === 1 ? 'À vista' : `${installments}x de`}
                  </span>
                  <span className="font-semibold text-primary">
                    R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {installments > 1 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Total: R$ {parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Categories with Search */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Categoria {selectedCategoryData && (
                <span className="text-primary">• {selectedCategoryData.icon} {selectedCategoryData.name}</span>
              )}
            </label>
            <Button variant="ghost" size="sm" onClick={() => setShowAddCategory(true)} className="text-primary h-7 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              Nova
            </Button>
          </div>
          
          {categories.length > 8 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categoria..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}
          
          <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto p-0.5">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all",
                  selectedCategory === category.id
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-secondary/50 hover:bg-secondary"
                )}
              >
                <span className="text-xl">{category.icon}</span>
                <span className="text-[9px] font-medium text-center leading-tight line-clamp-2">{category.name}</span>
              </button>
            ))}
            
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-all text-muted-foreground hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              <span className="text-[9px] font-medium">Criar</span>
            </button>
          </div>
        </div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t border-border safe-bottom">
        <div className="max-w-lg mx-auto">
          <Button 
            className="w-full h-12 text-sm"
            onClick={handleSubmit}
            disabled={!amount || !description || !selectedCategory}
          >
            <Check className="h-4 w-4 mr-2" />
            Salvar Transação
          </Button>
        </div>
      </div>

      <AddCategoryDialog
        open={showAddCategory}
        onOpenChange={setShowAddCategory}
        type={type}
        accountType={accountType}
        onCategoryAdded={handleCategoryAdded}
      />
    </div>
  );
}
