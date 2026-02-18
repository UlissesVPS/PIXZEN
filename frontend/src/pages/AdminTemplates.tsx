import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, MessageSquare, Mail, RefreshCw, FileText,
  AlertCircle, Wifi, WifiOff, Zap, CheckCircle2, XCircle,
  Code, Eye, RotateCcw, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from '@/services/adminApi';

interface MessageTemplate {
  id: string;
  template_key: string;
  template_name: string;
  template_content: string;
  template_type: string;
  description: string;
  variables: string[];
  is_active: boolean;
  updated_at: string;
}

interface WhatsAppStatus {
  service: string;
  database: string;
  uazapi: any;
  cache_entries: number;
  error?: string;
}

interface TemplateUsage {
  template_key: string;
  used_in_code: boolean;
}

// Templates que sabemos estarem em uso no codigo
const TEMPLATES_IN_USE: Record<string, string> = {
  welcome_new: "Novo usuario sem conta vinculada",
  link_code: "Envio de codigo de vinculacao",
  welcome_link: "Apos vincular conta com sucesso",
  transaction_saved: "Confirmacao de transacao registrada",
  month_summary: "Comando /saldo - resumo mensal",
  trial_expired: "Quando trial do usuario expira",
  error_limit_reached: "Limite mensal de mensagens atingido",
  help: "Comando /ajuda",
  error_general: "Erro generico no processamento",
  not_understood: "IA nao identificou transacao",
};

export default function AdminTemplates() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedName, setEditedName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filter, setFilter] = useState<"all" | "whatsapp" | "email">("all");
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [templateUsage, setTemplateUsage] = useState<TemplateUsage[]>([]);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.getTemplates();
      setTemplates(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar templates",
        description: error.response?.data?.error || error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadWhatsAppStatus = useCallback(async () => {
    try {
      const { data } = await adminApi.getWhatsAppStatus();
      setWhatsappStatus(data);
    } catch {
      setWhatsappStatus({ service: 'offline', database: 'unknown', uazapi: { connected: false }, cache_entries: 0 });
    }
  }, []);

  const loadTemplateUsage = useCallback(async () => {
    try {
      const { data } = await adminApi.getTemplatesUsage();
      setTemplateUsage(data || []);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadWhatsAppStatus();
    loadTemplateUsage();
  }, [loadTemplates, loadWhatsAppStatus, loadTemplateUsage]);

  const selectTemplate = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setEditedContent(template.template_content);
    setEditedName(template.template_name);
  };

  const saveTemplate = async () => {
    if (!selectedTemplate) return;

    setIsSaving(true);
    try {
      await adminApi.updateTemplate(selectedTemplate.id, {
        template_content: editedContent,
        template_name: editedName,
      });

      // Limpar cache do WhatsApp service automaticamente
      try {
        await adminApi.clearTemplateCache();
      } catch {
        // Se falhar limpar cache, nao e critico - expira em 5 min
      }

      toast({
        title: "Template salvo!",
        description: "Alteracoes salvas e cache do WhatsApp sincronizado."
      });

      setTemplates(prev => prev.map(t =>
        t.id === selectedTemplate.id
          ? { ...t, template_content: editedContent, template_name: editedName }
          : t
      ));
      setSelectedTemplate(prev => prev ? { ...prev, template_content: editedContent, template_name: editedName } : null);

      // Recarregar status
      loadWhatsAppStatus();

    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.response?.data?.error || error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (template: MessageTemplate) => {
    try {
      await adminApi.updateTemplate(template.id, { is_active: !template.is_active });

      // Limpar cache
      try { await adminApi.clearTemplateCache(); } catch {}

      setTemplates(prev => prev.map(t =>
        t.id === template.id ? { ...t, is_active: !t.is_active } : t
      ));

      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
      }

      toast({
        title: template.is_active ? "Template desativado" : "Template ativado",
        description: template.is_active
          ? "O WhatsApp nao usara mais este template."
          : "O WhatsApp voltara a usar este template."
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.error || error.message,
        variant: "destructive"
      });
    }
  };

  const syncCache = async () => {
    setIsSyncing(true);
    try {
      await adminApi.clearTemplateCache();
      await loadWhatsAppStatus();
      toast({
        title: "Cache sincronizado!",
        description: "O WhatsApp service carregara os templates atualizados."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar",
        description: error.response?.data?.error || "WhatsApp service pode estar offline",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredTemplates = templates.filter(t =>
    filter === "all" || t.template_type === filter
  );

  const hasChanges = selectedTemplate && (
    editedContent !== selectedTemplate.template_content ||
    editedName !== selectedTemplate.template_name
  );

  const getUsageInfo = (key: string) => TEMPLATES_IN_USE[key] || null;

  const isUazapiConnected = whatsappStatus?.uazapi?.connected === true ||
    (typeof whatsappStatus?.uazapi === 'object' && whatsappStatus?.uazapi?.status?.connected === true);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="container flex h-16 items-center px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="flex-1 text-center font-semibold">Templates de Mensagens</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => { loadTemplates(); loadWhatsAppStatus(); }} disabled={isLoading}>
              <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-4">

        {/* ── Status Bar ── */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* WhatsApp Service Status */}
            <div className="flex items-center gap-2">
              {whatsappStatus?.service === 'running' ? (
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">WhatsApp Service Ativo</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">WhatsApp Service Offline</span>
                </div>
              )}
            </div>

            <Separator orientation="vertical" className="h-4" />

            {/* UAZAPI Connection */}
            <div className="flex items-center gap-1.5">
              {isUazapiConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">UAZAPI Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs text-amber-600 dark:text-amber-400">UAZAPI Desconectado</span>
                </>
              )}
            </div>

            <Separator orientation="vertical" className="h-4" />

            {/* Cache Status */}
            <div className="flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {whatsappStatus?.cache_entries ?? '?'} templates em cache
              </span>
            </div>

            {/* Templates count */}
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {templates.length} templates · {templates.filter(t => t.is_active).length} ativos
              </span>
            </div>

            {/* Sync Button */}
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={syncCache}
                disabled={isSyncing}
                className="h-8 text-xs gap-1.5"
              >
                {isSyncing ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Sincronizar Cache
              </Button>
            </div>
          </div>

          {!isUazapiConnected && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  WhatsApp desconectado
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Os templates estao salvos no banco mas as mensagens nao estao sendo enviadas.
                  Conecte o WhatsApp no painel UAZAPI para que as mensagens voltem a funcionar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Main Content ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Template List (Left Panel) ── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
                className="flex-1"
              >
                Todos ({templates.length})
              </Button>
              <Button
                variant={filter === "whatsapp" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("whatsapp")}
                className="flex-1"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                WhatsApp
              </Button>
              <Button
                variant={filter === "email" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("email")}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
            </div>

            <div className="space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum template encontrado
                </div>
              ) : (
                filteredTemplates.map(template => {
                  const usageInfo = getUsageInfo(template.template_key);
                  return (
                    <div
                      key={template.id}
                      onClick={() => selectTemplate(template)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedTemplate?.id === template.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/50 hover:bg-secondary/50"
                      } ${!template.is_active ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          template.template_type === "whatsapp"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-blue-500/10 text-blue-500"
                        }`}>
                          {template.template_type === "whatsapp"
                            ? <MessageSquare className="h-5 w-5" />
                            : <Mail className="h-5 w-5" />
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate text-sm">{template.template_name}</p>
                            {!template.is_active && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                Inativo
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
                            {template.template_key}
                          </p>
                          {usageInfo && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Zap className="h-3 w-3 text-primary/60" />
                              <span className="text-[10px] text-muted-foreground">{usageInfo}</span>
                            </div>
                          )}
                          {template.variables && template.variables.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {template.variables.slice(0, 3).map((v: string) => (
                                <span key={v} className="text-[9px] px-1.5 py-0.5 bg-primary/8 text-primary/70 rounded font-mono">
                                  {`{{${v}}}`}
                                </span>
                              ))}
                              {template.variables.length > 3 && (
                                <span className="text-[9px] text-muted-foreground">
                                  +{template.variables.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Editor (Right Panel) ── */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <h2 className="text-lg font-semibold">{selectedTemplate.template_name}</h2>
                      {selectedTemplate.is_active ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 text-[10px]">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </div>
                    {getUsageInfo(selectedTemplate.template_key) && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-primary/60" />
                        {getUsageInfo(selectedTemplate.template_key)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant={selectedTemplate.is_active ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleActive(selectedTemplate)}
                  >
                    {selectedTemplate.is_active ? "Desativar" : "Ativar"}
                  </Button>
                </div>

                {/* Name + Key */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Nome do Template
                    </label>
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      placeholder="Nome do template"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Chave (readonly)
                    </label>
                    <Input
                      value={selectedTemplate.template_key}
                      disabled
                      className="bg-secondary/50 font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Variables */}
                {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                  <div className="bg-secondary/30 rounded-xl p-4">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Variaveis disponiveis
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables.map((v: string) => (
                        <code key={v} className="px-2.5 py-1 bg-primary/10 text-primary rounded-md text-xs font-mono cursor-pointer hover:bg-primary/20 transition-colors"
                          onClick={() => {
                            setEditedContent(prev => prev + `{{${v}}}`);
                          }}
                          title="Clique para inserir"
                        >
                          {"{{" + v + "}}"}
                        </code>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Clique em uma variavel para inseri-la no conteudo
                    </p>
                  </div>
                )}

                {/* Content Editor */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Conteudo da Mensagem
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 text-[10px] gap-1 ${!showPreview ? 'bg-secondary' : ''}`}
                        onClick={() => setShowPreview(false)}
                      >
                        <Code className="h-3 w-3" />
                        Codigo
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-7 text-[10px] gap-1 ${showPreview ? 'bg-secondary' : ''}`}
                        onClick={() => setShowPreview(true)}
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    placeholder="Conteudo do template..."
                    className="min-h-[250px] font-mono text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    Use *texto* para negrito no WhatsApp · _texto_ para italico · ~texto~ para tachado · {"{{variavel}}"} para valores dinamicos
                  </p>
                </div>

                {/* Preview */}
                {showPreview && (
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
                      Preview WhatsApp
                    </label>
                    <div className="bg-[#0b141a] rounded-xl p-4 text-white/90 font-sans text-sm whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
                      {editedContent
                        .replace(/\*([^*]+)\*/g, '𝗕$1𝗕')
                        .replace(/𝗕/g, '')
                        || <span className="text-white/30 italic">Conteudo vazio</span>
                      }
                    </div>
                  </div>
                )}

                {/* Save Actions */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <Button
                    onClick={saveTemplate}
                    disabled={!hasChanges || isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar e Sincronizar
                      </>
                    )}
                  </Button>
                  {hasChanges && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditedContent(selectedTemplate.template_content);
                        setEditedName(selectedTemplate.template_name);
                      }}
                    >
                      Descartar
                    </Button>
                  )}
                </div>

                {hasChanges && (
                  <div className="flex items-center gap-2 text-yellow-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    Voce tem alteracoes nao salvas
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Selecione um template</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Clique em um template na lista para editar seu conteudo.
                  As alteracoes sao sincronizadas automaticamente com o WhatsApp service.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
