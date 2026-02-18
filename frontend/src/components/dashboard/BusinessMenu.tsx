import { useState, useMemo, useRef } from 'react';
import {
  Menu,
  Calculator,
  Users,
  Receipt,
  FileText,
  TrendingUp,
  Percent,
  Building2,
  ChevronRight,
  X,
  Download,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinance } from '@/contexts/FinanceContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

// Safe DOM helper: creates element with class and text
function el(tag: string, cls: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}

function row(label: string, value: string, cls?: string): HTMLElement {
  const div = el('div', 'row' + (cls ? ' ' + cls : ''));
  const s1 = el('span', '', label);
  const s2 = el('span', '', value);
  div.appendChild(s1);
  div.appendChild(s2);
  return div;
}

// ---- Invoice Generator Component ----
function InvoiceGenerator({ formatCurrency }: { formatCurrency: (v: number) => string }) {
  const [clientName, setClientName] = useState('');
  const [clientDoc, setClientDoc] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceValue, setServiceValue] = useState('');
  const [issRate, setIssRate] = useState('5');
  const [showPreview, setShowPreview] = useState(false);

  const value = parseFloat(serviceValue) || 0;
  const iss = value * (parseFloat(issRate) / 100);
  const netValue = value - iss;

  const handleGenerate = () => {
    if (!clientName || !serviceDesc || !serviceValue) {
      toast({ title: 'Preencha todos os campos obrigatorios', variant: 'destructive' });
      return;
    }
    setShowPreview(true);
  };

  const handlePrint = () => {
    const invoiceNumber = Date.now().toString().slice(-6);
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const doc = printWindow.document;
    const style = doc.createElement('style');
    style.textContent = `
      body{font-family:Arial,sans-serif;padding:40px;color:#333}
      .header{text-align:center;border-bottom:2px solid #333;padding-bottom:16px;margin-bottom:24px}
      .header h1{margin:0;font-size:22px}
      .header p{color:#666;margin:4px 0}
      .section{margin-bottom:20px}
      .section h3{font-size:14px;color:#666;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px}
      .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
      .row span:first-child{color:#666}
      .row span:last-child{font-weight:bold}
      .total{font-size:18px;border-top:2px solid #333;padding-top:12px;margin-top:12px}
      .footer{text-align:center;margin-top:40px;color:#999;font-size:12px}
    `;
    doc.head.appendChild(style);
    const title = doc.createElement('title');
    title.textContent = 'NF Simplificada - ' + clientName;
    doc.head.appendChild(title);

    // Build DOM safely
    const header = el('div', 'header');
    header.appendChild(el('h1', '', 'NOTA FISCAL DE SERVICO SIMPLIFICADA'));
    header.appendChild(el('p', '', 'Data: ' + dateStr));
    header.appendChild(el('p', '', 'N: ' + invoiceNumber));
    doc.body.appendChild(header);

    const clientSection = el('div', 'section');
    clientSection.appendChild(el('h3', '', 'Cliente'));
    clientSection.appendChild(row('Nome/Razao Social:', clientName));
    if (clientDoc) clientSection.appendChild(row('CNPJ/CPF:', clientDoc));
    doc.body.appendChild(clientSection);

    const serviceSection = el('div', 'section');
    serviceSection.appendChild(el('h3', '', 'Servico'));
    serviceSection.appendChild(row('Descricao:', serviceDesc));
    serviceSection.appendChild(row('Valor Bruto:', formatCurrency(value)));
    serviceSection.appendChild(row('ISS (' + issRate + '%):', '-' + formatCurrency(iss)));
    serviceSection.appendChild(row('Valor Liquido:', formatCurrency(netValue), 'total'));
    doc.body.appendChild(serviceSection);

    const footer = el('div', 'footer');
    footer.appendChild(el('p', '', 'Documento gerado via PixZen - Simulacao apenas'));
    doc.body.appendChild(footer);

    printWindow.print();
  };

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <div className="text-center border-b pb-3">
            <h3 className="font-bold text-sm">NF DE SERVICO SIMPLIFICADA</h3>
            <p className="text-xs text-muted-foreground">Data: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="font-medium text-sm">{clientName}</p>
            {clientDoc && <p className="text-xs text-muted-foreground">{clientDoc}</p>}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Servico</p>
            <p className="font-medium text-sm">{serviceDesc}</p>
          </div>
          <div className="space-y-1.5 border-t pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor Bruto:</span>
              <span className="font-medium">{formatCurrency(value)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ISS ({issRate}%):</span>
              <span className="text-destructive">-{formatCurrency(iss)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-2">
              <span>Valor Liquido:</span>
              <span className="text-primary">{formatCurrency(netValue)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setShowPreview(false)}>
            Voltar
          </Button>
          <Button className="flex-1" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir/PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nome do Cliente / Razao Social</Label>
        <Input placeholder="Ex: Empresa ABC Ltda" value={clientName} onChange={(e) => setClientName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>CNPJ/CPF (opcional)</Label>
        <Input placeholder="00.000.000/0000-00" value={clientDoc} onChange={(e) => setClientDoc(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Descricao do Servico</Label>
        <Input placeholder="Ex: Consultoria em TI" value={serviceDesc} onChange={(e) => setServiceDesc(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Valor do Servico (R$)</Label>
        <Input type="number" placeholder="0,00" value={serviceValue} onChange={(e) => setServiceValue(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Aliquota ISS (%)</Label>
        <Select value={issRate} onValueChange={setIssRate}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2%</SelectItem>
            <SelectItem value="3">3%</SelectItem>
            <SelectItem value="4">4%</SelectItem>
            <SelectItem value="5">5%</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {value > 0 && (
        <div className="bg-secondary rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ISS ({issRate}%):</span>
            <span className="text-destructive">-{formatCurrency(iss)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold">
            <span>Liquido:</span>
            <span className="text-primary">{formatCurrency(netValue)}</span>
          </div>
        </div>
      )}
      <Button onClick={handleGenerate} className="w-full">Gerar NF</Button>
    </div>
  );
}

// ---- Expense Report Component ----
function ExpenseReport({
  getFilteredTransactions,
  categories,
  formatCurrency,
}: {
  getFilteredTransactions: () => any[];
  categories: any[];
  formatCurrency: (v: number) => string;
}) {
  const transactions = getFilteredTransactions();
  const expenses = transactions.filter((t: any) => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum: number, t: any) => sum + t.amount, 0);

  const byCategory = useMemo(() => {
    const map: Record<string, { name: string; icon: string; total: number; count: number }> = {};
    expenses.forEach((t: any) => {
      if (!map[t.categoryId]) {
        const cat = categories.find((c: any) => c.id === t.categoryId);
        map[t.categoryId] = { name: cat?.name || t.categoryId, icon: cat?.icon || '📋', total: 0, count: 0 };
      }
      map[t.categoryId].total += t.amount;
      map[t.categoryId].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [expenses, categories]);

  const maxCategoryTotal = byCategory.length > 0 ? byCategory[0].total : 0;

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      toast({ title: 'Nenhuma despesa para exportar', variant: 'destructive' });
      return;
    }
    const header = 'Data,Descricao,Valor,Categoria,Metodo';
    const rows = expenses.map((t: any) => {
      const cat = categories.find((c: any) => c.id === t.categoryId);
      const desc = t.description.replace(/"/g, '""');
      const catName = (cat?.name || '').replace(/"/g, '""');
      return [
        new Date(t.date).toLocaleDateString('pt-BR'),
        '"' + desc + '"',
        t.amount.toFixed(2).replace('.', ','),
        '"' + catName + '"',
        t.paymentMethod || '',
      ].join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixzen-despesas-empresa-' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exportado!' });
  };

  return (
    <div className="space-y-4">
      <div className="bg-destructive/10 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Total em Despesas</p>
        <p className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
        <p className="text-xs text-muted-foreground">{expenses.length} transacao(oes) no periodo</p>
      </div>
      {byCategory.length > 0 ? (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Por Categoria</h4>
          {byCategory.map((cat, i) => {
            const pct = maxCategoryTotal > 0 ? (cat.total / maxCategoryTotal) * 100 : 0;
            const share = totalExpenses > 0 ? (cat.total / totalExpenses) * 100 : 0;
            return (
              <div key={i} className="bg-secondary rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="text-sm font-medium">{cat.name}</span>
                    <span className="text-xs text-muted-foreground">({cat.count})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm">{formatCurrency(cat.total)}</span>
                    <span className="text-xs text-muted-foreground ml-1">({share.toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: pct + '%' }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm text-center py-4">Nenhuma despesa registrada no periodo</p>
      )}
      <Button variant="outline" className="w-full" onClick={handleExportCSV}>
        <Download className="h-4 w-4 mr-2" />
        Exportar CSV
      </Button>
    </div>
  );
}

const businessFeatures = [
  {
    id: 'tax-calculator',
    name: 'Calculadora de Impostos',
    description: 'Simule DAS, IRPJ, ISS e outras tributações',
    icon: Calculator,
    color: 'bg-red-500/10 text-red-500',
  },
  {
    id: 'payroll-report',
    name: 'Relatório de Folha',
    description: 'Resumo de custos com funcionários',
    icon: Users,
    color: 'bg-blue-500/10 text-blue-500',
  },
  {
    id: 'fee-calculator',
    name: 'Calculadora de Taxas',
    description: 'Calcule taxas de cartão, PIX e boleto',
    icon: Percent,
    color: 'bg-amber-500/10 text-amber-500',
  },
  {
    id: 'invoice-generator',
    name: 'Gerador de NF',
    description: 'Simule valores de nota fiscal',
    icon: Receipt,
    color: 'bg-green-500/10 text-green-500',
  },
  {
    id: 'profit-margin',
    name: 'Margem de Lucro',
    description: 'Calcule markup e margem ideal',
    icon: TrendingUp,
    color: 'bg-purple-500/10 text-purple-500',
  },
  {
    id: 'expense-report',
    name: 'Relatório de Despesas',
    description: 'Análise detalhada por categoria',
    icon: FileText,
    color: 'bg-cyan-500/10 text-cyan-500',
  },
];

export function BusinessMenu() {
  const { accountType, getFilteredTransactions, categories } = useFinance();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  
  // Tax Calculator State
  const [taxRevenue, setTaxRevenue] = useState('');
  const [taxRegime, setTaxRegime] = useState('simples');
  const [taxResult, setTaxResult] = useState<{das: number; irpj: number; iss: number; total: number} | null>(null);
  
  // Fee Calculator State
  const [feeAmount, setFeeAmount] = useState('');
  const [feeType, setFeeType] = useState('credit');
  const [customFeePercentage, setCustomFeePercentage] = useState('');
  const [installments, setInstallments] = useState('1');
  const [installmentFeePerInstallment, setInstallmentFeePerInstallment] = useState('1.5');
  const [feeResult, setFeeResult] = useState<{
    fee: number; 
    net: number; 
    percentage: number;
    installmentDetails?: {
      installments: number;
      totalFee: number;
      feePerInstallment: number;
      valuePerInstallment: number;
    };
  } | null>(null);
  
  // Profit Margin State
  const [costValue, setCostValue] = useState('');
  const [marginPercentage, setMarginPercentage] = useState('30');
  const [marginResult, setMarginResult] = useState<{sellPrice: number; profit: number; markup: number} | null>(null);

  // Only show for business account
  if (accountType !== 'business') return null;

  const calculateTaxes = () => {
    const revenue = parseFloat(taxRevenue) || 0;
    let das = 0, irpj = 0, iss = 0;
    
    if (taxRegime === 'simples') {
      // Simples Nacional - Anexo III (Serviços)
      if (revenue <= 180000) das = revenue * 0.06;
      else if (revenue <= 360000) das = revenue * 0.112;
      else if (revenue <= 720000) das = revenue * 0.135;
      else das = revenue * 0.16;
    } else if (taxRegime === 'presumido') {
      irpj = revenue * 0.32 * 0.15; // Base 32% x 15%
      iss = revenue * 0.05; // ISS 5%
    } else {
      irpj = revenue * 0.15;
      iss = revenue * 0.05;
    }
    
    setTaxResult({
      das,
      irpj,
      iss,
      total: das + irpj + iss,
    });
  };

  const calculateFees = () => {
    const amount = parseFloat(feeAmount) || 0;
    const numInstallments = parseInt(installments) || 1;
    const feePerInstallment = parseFloat(installmentFeePerInstallment) || 0;
    let percentage = 0;
    
    if (feeType === 'custom') {
      percentage = parseFloat(customFeePercentage) || 0;
    } else if (feeType === 'installment') {
      // Taxa base + taxa adicional por parcela
      const baseFee = 3.5; // Taxa base do crédito
      const additionalFee = (numInstallments - 1) * feePerInstallment;
      percentage = baseFee + additionalFee;
    } else {
      switch (feeType) {
        case 'credit':
          percentage = 3.5;
          break;
        case 'debit':
          percentage = 1.99;
          break;
        case 'pix':
          percentage = 0.99;
          break;
        case 'boleto':
          percentage = 2.5;
          break;
      }
    }
    
    const fee = amount * (percentage / 100);
    const netAmount = amount - fee;
    
    if (feeType === 'installment' && numInstallments > 1) {
      setFeeResult({
        fee,
        net: netAmount,
        percentage,
        installmentDetails: {
          installments: numInstallments,
          totalFee: fee,
          feePerInstallment: fee / numInstallments,
          valuePerInstallment: amount / numInstallments,
        }
      });
    } else {
      setFeeResult({
        fee,
        net: netAmount,
        percentage,
      });
    }
  };

  const calculateMargin = () => {
    const cost = parseFloat(costValue) || 0;
    const margin = parseFloat(marginPercentage) || 0;
    
    const sellPrice = cost / (1 - margin / 100);
    const profit = sellPrice - cost;
    const markup = (profit / cost) * 100;
    
    setMarginResult({
      sellPrice,
      profit,
      markup,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Payroll report data
  const getPayrollData = () => {
    const transactions = getFilteredTransactions();
    const payrollCategories = ['salary_employees', 'prolabore', 'inss_patronal', 'fgts', 'thirteenth_salary', 'vacation_pay', 'severance', 'vale_transporte', 'vale_refeicao', 'vale_alimentacao', 'health_plan', 'dental_plan', 'life_insurance'];
    
    const payrollExpenses = transactions.filter(t => 
      t.type === 'expense' && payrollCategories.includes(t.categoryId)
    );
    
    const totalPayroll = payrollExpenses.reduce((sum, t) => sum + t.amount, 0);
    
    const byCategory = payrollCategories.map(catId => {
      const cat = categories.find(c => c.id === catId);
      const total = payrollExpenses
        .filter(t => t.categoryId === catId)
        .reduce((sum, t) => sum + t.amount, 0);
      return { name: cat?.name || catId, total, icon: cat?.icon || '📋' };
    }).filter(c => c.total > 0);
    
    return { totalPayroll, byCategory };
  };

  const renderFeatureContent = () => {
    switch (activeFeature) {
      case 'tax-calculator':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Faturamento Mensal</Label>
              <Input
                type="number"
                placeholder="R$ 0,00"
                value={taxRevenue}
                onChange={(e) => setTaxRevenue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Regime Tributário</Label>
              <Select value={taxRegime} onValueChange={setTaxRegime}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simples">Simples Nacional</SelectItem>
                  <SelectItem value="presumido">Lucro Presumido</SelectItem>
                  <SelectItem value="real">Lucro Real</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={calculateTaxes} className="w-full">Calcular</Button>
            {taxResult && (
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">Resultado:</h4>
                {taxRegime === 'simples' ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">DAS:</span>
                    <span className="font-medium">{formatCurrency(taxResult.das)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IRPJ:</span>
                      <span className="font-medium">{formatCurrency(taxResult.irpj)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ISS:</span>
                      <span className="font-medium">{formatCurrency(taxResult.iss)}</span>
                    </div>
                  </>
                )}
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-primary">{formatCurrency(taxResult.total)}</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'fee-calculator':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor da Venda</Label>
              <Input
                type="number"
                placeholder="R$ 0,00"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Pagamento</Label>
              <Select value={feeType} onValueChange={setFeeType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit">Cartão de Crédito (3.5%)</SelectItem>
                  <SelectItem value="debit">Cartão de Débito (1.99%)</SelectItem>
                  <SelectItem value="pix">PIX (0.99%)</SelectItem>
                  <SelectItem value="boleto">Boleto (2.5%)</SelectItem>
                  <SelectItem value="installment">Parcelado</SelectItem>
                  <SelectItem value="custom">Taxa Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {feeType === 'custom' && (
              <div className="space-y-2">
                <Label>Porcentagem da Taxa (%)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 2.5"
                  value={customFeePercentage}
                  onChange={(e) => setCustomFeePercentage(e.target.value)}
                  step="0.01"
                  min="0"
                  max="100"
                />
              </div>
            )}
            {feeType === 'installment' && (
              <div className="space-y-3 p-3 bg-secondary/50 rounded-lg border border-border">
                <div className="space-y-2">
                  <Label>Número de Parcelas</Label>
                  <Select value={installments} onValueChange={setInstallments}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                        <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Taxa adicional por parcela (%)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 1.5"
                    value={installmentFeePerInstallment}
                    onChange={(e) => setInstallmentFeePerInstallment(e.target.value)}
                    step="0.1"
                    min="0"
                    max="10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Taxa base: 3.5% + {installmentFeePerInstallment}% por parcela adicional
                  </p>
                </div>
              </div>
            )}
            <Button onClick={calculateFees} className="w-full">Calcular</Button>
            {feeResult && (
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa ({feeResult.percentage.toFixed(2)}%):</span>
                  <span className="font-medium text-destructive">-{formatCurrency(feeResult.fee)}</span>
                </div>
                {feeResult.installmentDetails && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Parcelas:</span>
                      <span className="font-medium">{feeResult.installmentDetails.installments}x de {formatCurrency(feeResult.installmentDetails.valuePerInstallment)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa por parcela:</span>
                      <span className="font-medium text-destructive">-{formatCurrency(feeResult.installmentDetails.feePerInstallment)}</span>
                    </div>
                  </>
                )}
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Valor Líquido:</span>
                  <span className="font-bold text-green-500">{formatCurrency(feeResult.net)}</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'profit-margin':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Custo do Produto/Serviço</Label>
              <Input
                type="number"
                placeholder="R$ 0,00"
                value={costValue}
                onChange={(e) => setCostValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Margem Desejada (%)</Label>
              <Input
                type="number"
                placeholder="30"
                value={marginPercentage}
                onChange={(e) => setMarginPercentage(e.target.value)}
              />
            </div>
            <Button onClick={calculateMargin} className="w-full">Calcular</Button>
            {marginResult && (
              <div className="bg-secondary rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço de Venda:</span>
                  <span className="font-bold text-primary">{formatCurrency(marginResult.sellPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lucro:</span>
                  <span className="font-medium text-green-500">{formatCurrency(marginResult.profit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Markup:</span>
                  <span className="font-medium">{marginResult.markup.toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'payroll-report':
        const { totalPayroll, byCategory } = getPayrollData();
        return (
          <div className="space-y-4">
            <div className="bg-primary/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Total em Folha de Pagamento</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalPayroll)}</p>
            </div>
            {byCategory.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Detalhamento:</h4>
                {byCategory.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                    <div className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span className="text-sm">{cat.name}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhuma despesa de folha registrada no período
              </p>
            )}
          </div>
        );

      case 'invoice-generator':
        return <InvoiceGenerator formatCurrency={formatCurrency} />;

      case 'expense-report':
        return <ExpenseReport getFilteredTransactions={getFilteredTransactions} categories={categories} formatCurrency={formatCurrency} />;

      default:
        return (
          <div className="text-center py-8 space-y-3">
            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <p className="font-medium text-foreground">Em Desenvolvimento</p>
            <p className="text-muted-foreground text-sm">
              Essa funcionalidade ainda está sendo desenvolvida e estará disponível em breve!
            </p>
          </div>
        );
    }
  };

  return (
    <>
      {/* Menu Button Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between transition-all duration-300 hover:border-primary/40 hover:shadow-md",
          isExpanded && "border-primary/40 shadow-md"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-sm">Ferramentas Empresariais</p>
            <p className="text-xs text-muted-foreground">Calculadoras, relatórios e mais</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Menu className="h-5 w-5 text-primary" />
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-300",
            isExpanded && "rotate-90"
          )} />
        </div>
      </button>

      {/* Expanded Menu */}
      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 animate-fade-in">
          {businessFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => setActiveFeature(feature.id)}
                className="bg-card border border-border rounded-xl p-3 text-left transition-all duration-300 hover:shadow-md hover:border-primary/30 hover:scale-[1.02]"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeFeature && (() => {
                const feature = businessFeatures.find(f => f.id === activeFeature);
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
    </>
  );
}
