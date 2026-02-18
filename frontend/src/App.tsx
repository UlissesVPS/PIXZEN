import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Component, ReactNode } from "react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import AddTransaction from "./pages/AddTransaction";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Bills from "./pages/Bills";
import Receivables from "./pages/Receivables";
import CreditCards from "./pages/CreditCards";
import Profile from "./pages/Profile";
import Security from "./pages/Security";
import WhatsApp from "./pages/WhatsApp";
import NotFound from "./pages/NotFound";
import AIAdmin from "./pages/AIAdmin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTemplates from "./pages/AdminTemplates";
import Reminders from "./pages/Reminders";
import Goals from "./pages/Goals";
import Budgets from "./pages/Budgets";
import EmailConfirmed from "./pages/EmailConfirmed";
import HelpGuide from "./pages/HelpGuide";

const queryClient = new QueryClient();

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😵</div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Algo deu errado</h1>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted p-2 rounded">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/app';
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Admin Route Guard
const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <NotificationsProvider>
          <FinanceProvider>
            <TooltipProvider>
              <Sonner />
              <ErrorBoundary>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/app" element={<Index />} />
                    <Route path="/add" element={<AddTransaction />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/reminders" element={<Reminders />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/bills" element={<Bills />} />
                    <Route path="/receivables" element={<Receivables />} />
                    <Route path="/credit-cards" element={<CreditCards />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/security" element={<Security />} />
                    <Route path="/whatsapp" element={<WhatsApp />} />
                    <Route path="/admin/ai" element={<AdminRoute><AIAdmin /></AdminRoute>} />
                    <Route path="/admin/templates" element={<AdminRoute><AdminTemplates /></AdminRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                    <Route path="/help" element={<HelpGuide />} />
                    <Route path="/email-confirmed" element={<EmailConfirmed />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </ErrorBoundary>
            </TooltipProvider>
          </FinanceProvider>
        </NotificationsProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
