import { Home, PieChart, Plus, List, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Início', path: '/app' },
  { icon: PieChart, label: 'Análise', path: '/analytics' },
  { icon: Plus, label: 'Adicionar', path: '/add', isMain: true },
  { icon: List, label: 'Transações', path: '/transactions' },
  { icon: Settings, label: 'Config', path: '/settings' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-bottom md:hidden">
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/app' && location.pathname === '/app');
          const Icon = item.icon;

          if (item.isMain) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center justify-center -mt-5"
              >
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-glow transition-all flex items-center justify-center active:scale-95">
                  <Icon className="h-5 w-5" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-1.5 px-2 rounded-lg transition-all min-w-0",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-[9px] font-medium truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
