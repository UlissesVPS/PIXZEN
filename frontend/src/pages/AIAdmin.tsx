import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Save, RefreshCw, DollarSign, Zap, Settings2, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/services/adminApi';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';

interface AIConfig {
  id: string;
  config_key: string;
  config_value: string;
  description: string;
}

interface UsageStats {
  total_requests: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
  by_model: {
    model: string;
    requests: number;
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  }[];
}

const MODEL_PRICING = {
  'gpt-4o-mini': { input: 0.15, output: 0.60, description: 'Mais economico, otimo custo-beneficio' },
  'gpt-4o': { input: 2.50, output: 10.00, description: 'Alta precisao, ideal para imagens' },
  'gpt-4-turbo': { input: 10.00, output: 30.00, description: 'Muito preciso, custo elevado' },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50, description: 'Mais rapido, menos preciso' },
  'whisper-1': { input: 0.006, output: 0, description: 'Transcricao de audio (por minuto)' },
};

export default function AIAdmin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Check is_admin from user metadata or stored user data
    const isUserAdmin = (user as any).is_admin || user.user_metadata?.is_admin;
    if (isUserAdmin) {
      setIsAdmin(true);
      await loadConfigs();
      await loadUsageStats();
    }
    setIsLoading(false);
  };

  const loadConfigs = async () => {
    try {
      const { data } = await adminApi.getAIConfig();
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading configs:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel carregar as configuracoes',
        variant: 'destructive'
      });
    }
  };

  const loadUsageStats = async () => {
    try {
      const { data } = await adminApi.getAIUsage();

      if (data) {
        // If the backend returns pre-aggregated stats, use directly
        if (data.total_requests !== undefined) {
          setUsageStats(data);
        } else if (Array.isArray(data) && data.length > 0) {
          // If raw logs, aggregate client-side
          const byModel: Record<string, { requests: number; input_tokens: number; output_tokens: number; cost_usd: number }> = {};

          data.forEach((row: any) => {
            if (!byModel[row.model]) {
              byModel[row.model] = { requests: 0, input_tokens: 0, output_tokens: 0, cost_usd: 0 };
            }
            byModel[row.model].requests++;
            byModel[row.model].input_tokens += row.input_tokens || 0;
            byModel[row.model].output_tokens += row.output_tokens || 0;
            byModel[row.model].cost_usd += parseFloat(row.cost_usd as any) || 0;
          });

          setUsageStats({
            total_requests: data.length,
            total_input_tokens: data.reduce((sum: number, r: any) => sum + (r.input_tokens || 0), 0),
            total_output_tokens: data.reduce((sum: number, r: any) => sum + (r.output_tokens || 0), 0),
            total_cost_usd: data.reduce((sum: number, r: any) => sum + (parseFloat(r.cost_usd as any) || 0), 0),
            by_model: Object.entries(byModel).map(([model, stats]) => ({ model, ...stats }))
          });
        }
      }
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const updateConfig = (key: string, value: string) => {
    setConfigs(prev => prev.map(c =>
      c.config_key === key ? { ...c, config_value: value } : c
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const config of configs) {
        await adminApi.updateAIConfig(config.id, { config_value: config.config_value });
      }

      toast({
        title: 'Configuracoes salvas!',
        description: 'As alteracoes serao aplicadas nas proximas requisicoes'
      });
    } catch (error) {
      console.error('Error saving configs:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel salvar as configuracoes',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getConfigValue = (key: string) => {
    return configs.find(c => c.config_key === key)?.config_value || '';
  };

  const formatCurrency = (value: number, currency: 'USD' | 'BRL' = 'USD') => {
    if (currency === 'BRL') {
      return `R$ ${(value * 5.5).toFixed(2)}`;
    }
    return `$ ${value.toFixed(4)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex">
        <DesktopSidebar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground text-center mb-4">
            Esta pagina e exclusiva para administradores do sistema.
          </p>
          <Button onClick={() => navigate('/settings')}>
            Voltar para Configuracoes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex h-16 items-center px-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="flex-1 text-center md:text-left font-semibold">Admin - Configuracoes de IA</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={handleSave} disabled={isSaving} size="sm">
                {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span className="ml-2 hidden sm:inline">Salvar</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">
          <div className="container px-4 py-6 max-w-4xl mx-auto space-y-6">

            {/* Icon */}
            <div className="flex flex-col items-center py-4">
              <div className="h-16 w-16 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg mb-3">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h2 className="font-bold text-xl">Painel de IA</h2>
              <p className="text-sm text-muted-foreground">Gerencie modelos, prompts e custos</p>
            </div>

            {/* Cost Overview */}
            {usageStats && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Estatisticas de Uso
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Total Requisicoes</p>
                    <p className="text-2xl font-bold">{usageStats.total_requests}</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Tokens Input</p>
                    <p className="text-2xl font-bold">{(usageStats.total_input_tokens / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Tokens Output</p>
                    <p className="text-2xl font-bold">{(usageStats.total_output_tokens / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="bg-card rounded-xl border border-border p-4">
                    <p className="text-xs text-muted-foreground">Custo Total</p>
                    <p className="text-2xl font-bold text-green-500">{formatCurrency(usageStats.total_cost_usd)}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(usageStats.total_cost_usd, 'BRL')}</p>
                  </div>
                </div>

                {usageStats.by_model.length > 0 && (
                  <div className="bg-card rounded-xl border border-border p-4 mt-3">
                    <p className="text-sm font-medium mb-3">Uso por Modelo</p>
                    <div className="space-y-2">
                      {usageStats.by_model.map(m => (
                        <div key={m.model} className="flex items-center justify-between text-sm">
                          <span className="font-mono">{m.model}</span>
                          <span className="text-muted-foreground">
                            {m.requests} req | {formatCurrency(m.cost_usd)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Model Selection */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Modelos de IA
              </h3>
              <div className="bg-card rounded-2xl border border-border p-4 space-y-4">

                {/* Text Model */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Modelo para Texto</label>
                  <Select
                    value={getConfigValue('text_model')}
                    onValueChange={(v) => updateConfig('text_model', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">gpt-4o-mini (Recomendado)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">gpt-3.5-turbo</SelectItem>
                      <SelectItem value="gpt-4o">gpt-4o</SelectItem>
                      <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usado para analisar mensagens de texto e extrair transacoes
                  </p>
                </div>

                {/* Image Model */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Modelo para Imagens</label>
                  <Select
                    value={getConfigValue('image_model')}
                    onValueChange={(v) => updateConfig('image_model', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">gpt-4o (Recomendado)</SelectItem>
                      <SelectItem value="gpt-4o-mini">gpt-4o-mini</SelectItem>
                      <SelectItem value="gpt-4-turbo">gpt-4-turbo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usado para analisar comprovantes e notas fiscais
                  </p>
                </div>

                {/* Audio Model */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Modelo para Audio</label>
                  <Select
                    value={getConfigValue('audio_model')}
                    onValueChange={(v) => updateConfig('audio_model', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whisper-1">whisper-1 (Unico disponivel)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usado para transcrever mensagens de audio
                  </p>
                </div>

                {/* Temperature */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Temperatura (Criatividade)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={getConfigValue('text_temperature')}
                    onChange={(e) => updateConfig('text_temperature', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    0.0 = Mais preciso e consistente | 1.0+ = Mais criativo e variado
                  </p>
                </div>

                {/* Max Tokens */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Max Tokens (Texto)</label>
                  <Input
                    type="number"
                    min="100"
                    max="4000"
                    value={getConfigValue('text_max_tokens')}
                    onChange={(e) => updateConfig('text_max_tokens', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Limite de tokens na resposta (300-500 recomendado para economia)
                  </p>
                </div>
              </div>
            </div>

            {/* Prompt */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Prompt do Sistema
              </h3>
              <div className="bg-card rounded-2xl border border-border p-4">
                <label className="text-sm font-medium mb-2 block">Prompt para Extracao Financeira</label>
                <Textarea
                  value={getConfigValue('finance_prompt')}
                  onChange={(e) => updateConfig('finance_prompt', e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Este prompt e usado para extrair dados financeiros das mensagens do usuario
                </p>
              </div>
            </div>

            {/* Pricing Reference */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-1 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Referencia de Precos (por 1M tokens)
              </h3>
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Modelo</th>
                      <th className="text-right p-3 font-medium">Input</th>
                      <th className="text-right p-3 font-medium">Output</th>
                      <th className="text-left p-3 font-medium hidden sm:table-cell">Observacao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(MODEL_PRICING).map(([model, pricing]) => (
                      <tr key={model} className="border-t border-border">
                        <td className="p-3 font-mono text-xs">{model}</td>
                        <td className="p-3 text-right">${pricing.input.toFixed(2)}</td>
                        <td className="p-3 text-right">${pricing.output.toFixed(2)}</td>
                        <td className="p-3 text-muted-foreground text-xs hidden sm:table-cell">{pricing.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Cost Simulation */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground px-1">Simulacao de Custos</h3>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 p-4">
                <p className="font-medium mb-3">Estimativa para 1.000 usuarios ativos/mes</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Mensagens de texto (5/dia/usuario)</span>
                    <span>~150.000 req/mes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tokens estimados (300 input + 100 output)</span>
                    <span>~60M tokens</span>
                  </div>
                  <div className="flex justify-between border-t border-green-500/20 pt-2 mt-2">
                    <span className="font-medium">Custo com gpt-4o-mini</span>
                    <span className="font-bold text-green-500">~$45/mes (~R$250)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Custo com gpt-4o</span>
                    <span className="text-yellow-500">~$750/mes (~R$4.125)</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  * O gpt-4o-mini oferece o melhor custo-beneficio para processamento de texto
                </p>
              </div>
            </div>

            {/* Save Button Mobile */}
            <Button onClick={handleSave} disabled={isSaving} className="w-full md:hidden">
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configuracoes
                </>
              )}
            </Button>

          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
