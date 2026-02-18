import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Check, Copy, RefreshCw, Smartphone, Unlink } from 'lucide-react';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { whatsappApi } from '@/services/whatsappApi';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';

interface WhatsAppLink {
  id: string;
  phone: string;
  name: string;
  is_linked: boolean;
  created_at: string;
}

export default function WhatsApp() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isDemoMode } = useAuth();
  const [linkCode, setLinkCode] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [linkedPhone, setLinkedPhone] = useState<WhatsAppLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && !isDemoMode) {
      checkLinkedPhone();
    } else {
      setIsLoading(false);
    }
  }, [user, isDemoMode]);

  const checkLinkedPhone = async () => {
    try {
      const { data } = await whatsappApi.getStatus();
      if (data && data.is_linked) {
        setLinkedPhone(data as WhatsAppLink);
      }
    } catch (error) {
      console.error('Error checking linked phone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkWhatsApp = async () => {
    if (!linkCode.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o codigo de vinculacao',
        variant: 'destructive'
      });
      return;
    }

    if (isDemoMode) {
      toast({
        title: 'Modo Demo',
        description: 'Vinculacao de WhatsApp nao disponivel no modo demo',
        variant: 'destructive'
      });
      return;
    }

    setIsLinking(true);

    try {
      const { data: result } = await whatsappApi.link(linkCode.toUpperCase());

      if (result.success !== false) {
        toast({
          title: 'WhatsApp vinculado!',
          description: 'Agora voce pode registrar transacoes pelo WhatsApp'
        });

        setLinkCode('');
        checkLinkedPhone();
      } else {
        toast({
          title: 'Erro na vinculacao',
          description: result.error || 'Nao foi possivel vincular o WhatsApp',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('Error linking WhatsApp:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Nao foi possivel vincular o WhatsApp',
        variant: 'destructive'
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!linkedPhone) return;

    try {
      await whatsappApi.unlink();

      toast({
        title: 'WhatsApp desvinculado',
        description: 'O numero foi removido da sua conta'
      });

      setLinkedPhone(null);
    } catch (error) {
      console.error('Error unlinking WhatsApp:', error);
      toast({
        title: 'Erro',
        description: 'Nao foi possivel desvincular o WhatsApp',
        variant: 'destructive'
      });
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 13) {
      return `+${phone.slice(0, 2)} (${phone.slice(2, 4)}) ${phone.slice(4, 9)}-${phone.slice(9)}`;
    }
    return phone;
  };

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
            <h1 className="flex-1 text-center md:text-left font-semibold">WhatsApp</h1>
            <div className="w-10 md:hidden" />
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">
          <div className="container px-4 py-6 max-w-lg mx-auto space-y-6">
            {/* Icon */}
            <div className="flex flex-col items-center py-8">
              <div className="h-20 w-20 rounded-2xl bg-green-500 flex items-center justify-center shadow-lg mb-4">
                <MessageCircle className="h-10 w-10 text-white" />
              </div>
              <h2 className="font-bold text-2xl tracking-tight">PixZen WhatsApp</h2>
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Registre suas transacoes enviando mensagens de texto, audio ou fotos
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : linkedPhone ? (
              /* Numero vinculado */
              <div className="space-y-4">
                <div className="bg-card rounded-2xl border border-border p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Numero vinculado</p>
                      <p className="text-sm text-muted-foreground">{formatPhone(linkedPhone.phone)}</p>
                    </div>
                  </div>

                  <div className="bg-secondary/50 rounded-xl p-3">
                    <p className="text-sm text-muted-foreground">
                      Nome no WhatsApp: <span className="font-medium text-foreground">{linkedPhone.name}</span>
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={handleUnlink}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Desvincular numero
                </Button>

                <div className="bg-card rounded-2xl border border-border p-4">
                  <h3 className="font-medium mb-3">Como usar</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">1.</span>
                      Envie uma mensagem descrevendo a transacao
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">2.</span>
                      Ex: "Gastei 50 reais no mercado"
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">3.</span>
                      Ou envie foto de comprovantes e notas
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">4.</span>
                      Digite /ajuda para ver todos os comandos
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Vincular numero */
              <div className="space-y-4">
                <div className="bg-card rounded-2xl border border-border p-4">
                  <h3 className="font-medium mb-4">Como vincular</h3>
                  
                  {/* Botao do WhatsApp */}
                  <a
                    href="https://wa.me/5586981751917?text=Oi!%20Quero%20vincular%20minha%20conta%20PixZen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 px-6 mb-6 rounded-xl bg-[#25D366] hover:bg-[#20BD5A] text-white font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Iniciar conversa no WhatsApp
                  </a>

                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Clique no botao acima para abrir o WhatsApp da PixZen
                  </p>

                  <div className="border-t border-border pt-4">
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">Passo a passo:</h4>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#25D366]">1</span>
                        </div>
                        <span>Clique no botao verde acima para abrir o WhatsApp</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#25D366]">2</span>
                        </div>
                        <span>Envie a mensagem para iniciar</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#25D366]">3</span>
                        </div>
                        <span>Voce recebera um <strong>codigo de 6 caracteres</strong></span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="h-6 w-6 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-[#25D366]">4</span>
                        </div>
                        <span>Digite o codigo no campo abaixo para completar</span>
                      </li>
                    </ol>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Codigo de vinculacao</label>
                    <Input
                      placeholder="Ex: ABC123"
                      value={linkCode}
                      onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                      maxLength={6}
                      className="text-center text-lg font-mono tracking-widest"
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleLinkWhatsApp}
                    disabled={isLinking || !linkCode.trim()}
                  >
                    {isLinking ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Vinculando...
                      </>
                    ) : (
                      <>
                        <Smartphone className="h-4 w-4 mr-2" />
                        Vincular WhatsApp
                      </>
                    )}
                  </Button>
                </div>

                {isDemoMode && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <p className="text-sm text-yellow-600 dark:text-yellow-400">
                      A vinculacao de WhatsApp nao esta disponivel no modo demo.
                      Crie uma conta para usar esta funcionalidade.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
