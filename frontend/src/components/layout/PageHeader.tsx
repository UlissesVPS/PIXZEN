import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MobileSidebar } from './MobileSidebar';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  backPath?: string;
  rightContent?: ReactNode;
}

export function PageHeader({ title, showBack = false, backPath, rightContent }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/50">
      <div className="container flex h-16 items-center px-4">
        {/* Mobile: hamburger menu or back button */}
        <div className="md:hidden">
          {showBack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => backPath ? navigate(backPath) : navigate(-1 as any)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <MobileSidebar />
          )}
        </div>
        <h1 className="flex-1 text-center md:text-left font-semibold">{title}</h1>
        <div className="flex items-center gap-2">
          {rightContent}
        </div>
      </div>
    </header>
  );
}
