import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, User, Crown, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi } from '@/services/profileApi';
import { subscriptionApi } from '@/services/subscriptionApi';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';

interface ProfileData {
  nome: string | null;
  avatar_url: string | null;
}

interface SubscriptionData {
  status: string;
  data_expiracao: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, isDemoMode } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>({ nome: null, avatar_url: null });
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nome, setNome] = useState('');

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchSubscription();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    if (isDemoMode) {
      setProfile({ nome: 'Usuario Demo', avatar_url: null });
      setNome('Usuario Demo');
      setLoading(false);
      return;
    }

    try {
      const { data } = await profileApi.get();
      if (data) {
        const avatarUrl = data.avatar_url
          ? (data.avatar_url.startsWith('http') ? data.avatar_url : `${API_URL.replace('/api', '')}${data.avatar_url}`)
          : null;
        setProfile({ nome: data.nome || null, avatar_url: avatarUrl });
        setNome(data.nome || '');
      }
    } catch {
      // Profile may not exist yet
    }
    setLoading(false);
  };

  const fetchSubscription = async () => {
    if (!user) return;

    if (isDemoMode) {
      setSubscription({ status: 'trial', data_expiracao: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() });
      return;
    }

    try {
      const { data } = await subscriptionApi.getStatus();
      if (data) {
        const status = data.isActive ? 'active' : (data.isExpired ? 'expired' : 'trial');
        setSubscription({ status, data_expiracao: data.data_expiracao || null });
      }
    } catch {
      // Subscription may not exist yet
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    if (isDemoMode) {
      toast.success('Perfil atualizado com sucesso!');
      setProfile(prev => ({ ...prev, nome: nome.trim() || null }));
      return;
    }

    setSaving(true);
    try {
      await profileApi.update({ nome: nome.trim() || '' });
      toast.success('Perfil atualizado com sucesso!');
      setProfile(prev => ({ ...prev, nome: nome.trim() || null }));
    } catch {
      toast.error('Erro ao salvar perfil');
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    if (isDemoMode) {
      toast.success('Foto de perfil atualizada!');
      return;
    }

    const file = e.target.files[0];
    setUploading(true);

    try {
      const { data } = await profileApi.uploadAvatar(file);
      const avatarUrl = data.avatar_url
        ? (data.avatar_url.startsWith('http') ? data.avatar_url : `${API_URL.replace('/api', '')}${data.avatar_url}`)
        : null;
      toast.success('Foto de perfil atualizada!');
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
    } catch {
      toast.error('Erro ao fazer upload da foto');
    }

    setUploading(false);
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return { label: 'Carregando...', color: 'text-muted-foreground', icon: Clock };
    
    if (subscription.status === 'active') {
      return { label: 'Assinatura Ativa', color: 'text-emerald-500', icon: Crown, bg: 'bg-emerald-500/10' };
    }
    
    if (subscription.status === 'trial') {
      const expirationDate = subscription.data_expiracao ? new Date(subscription.data_expiracao) : null;
      const now = new Date();
      
      if (expirationDate && expirationDate > now) {
        const daysLeft = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { 
          label: `Período de Teste (${daysLeft} dias restantes)`, 
          color: 'text-amber-500', 
          icon: Clock,
          bg: 'bg-amber-500/10'
        };
      }
      
      return { label: 'Período de Teste Expirado', color: 'text-destructive', icon: Clock, bg: 'bg-destructive/10' };
    }
    
    return { label: 'Inativo', color: 'text-muted-foreground', icon: Clock, bg: 'bg-muted' };
  };

  const statusInfo = getSubscriptionStatus();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex h-16 items-center px-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="flex-1 text-center font-semibold">Perfil</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">
          <div className="container px-4 py-6 max-w-lg mx-auto space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Avatar Section */}
                <div className="flex flex-col items-center py-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {nome ? nome.charAt(0).toUpperCase() : <User className="h-10 w-10" />}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Toque para alterar a foto
                  </p>
                </div>

                {/* Subscription Status */}
                <div className="bg-card rounded-2xl border border-border p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">Status da Assinatura</h3>
                  <div className={`flex items-center gap-3 p-3 rounded-xl ${statusInfo.bg}`}>
                    <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
                    <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                  </div>
                  {subscription?.status !== 'active' && (
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => navigate('/')}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Assinar Agora
                    </Button>
                  )}
                </div>

                {/* Profile Info */}
                <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Informações Pessoais</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="bg-secondary/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSaveProfile} 
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}