import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/services/authApi';
import { toast } from 'sonner';
import { DesktopSidebar } from '@/components/layout/DesktopSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { z } from 'zod';

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirmação deve ter pelo menos 6 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export default function Security() {
  const navigate = useNavigate();
  const { user, isDemoMode } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChangePassword = async () => {
    if (isDemoMode) {
      toast.info('No modo demonstracao, a senha nao pode ser alterada.');
      return;
    }

    setErrors({});

    const validation = passwordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    if (!user?.email) {
      toast.error('Usuario nao encontrado');
      return;
    }

    setChangingPassword(true);

    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Erro ao alterar senha';
      if (msg.toLowerCase().includes('atual') || msg.toLowerCase().includes('current') || msg.toLowerCase().includes('incorrect')) {
        setErrors({ currentPassword: 'Senha atual incorreta' });
      } else {
        toast.error('Erro ao alterar senha: ' + msg);
      }
    }

    setChangingPassword(false);
  };

  const handleForgotPassword = async () => {
    toast.info('Para redefinir sua senha, entre em contato com suporte.');
  };

  return (
    <div className="min-h-screen bg-background flex">
      <DesktopSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex h-16 items-center px-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="flex-1 text-center font-semibold">Segurança</h1>
            <div className="w-10" />
          </div>
        </header>

        <main className="flex-1 pb-24 md:pb-8">
          <div className="container px-4 py-6 max-w-lg mx-auto space-y-6">
            {/* Change Password Section */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Alterar Senha</h3>
                  <p className="text-sm text-muted-foreground">Digite sua senha atual e a nova senha</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual"
                    className={errors.currentPassword ? 'border-destructive' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-destructive">{errors.currentPassword}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className={errors.newPassword ? 'border-destructive' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-destructive">{errors.newPassword}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua nova senha"
                    className={errors.confirmPassword ? 'border-destructive' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
              
              <Button 
                onClick={handleChangePassword} 
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Alterando...
                  </>
                ) : (
                  'Alterar Senha'
                )}
              </Button>
            </div>

            {/* Forgot Password Section */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-medium">Esqueceu a Senha?</h3>
                  <p className="text-sm text-muted-foreground">Enviaremos um link para redefinir sua senha</p>
                </div>
              </div>
              
              <div className="bg-secondary/50 rounded-xl p-3">
                <p className="text-sm text-muted-foreground">
                  O link será enviado para: <span className="font-medium text-foreground">{user?.email}</span>
                </p>
              </div>
              
              <Button 
                variant="outline"
                onClick={handleForgotPassword} 
                disabled={sendingReset}
                className="w-full"
              >
                {sendingReset ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Email de Redefinição
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}