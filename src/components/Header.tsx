import { Building2, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isOwnerRoute = location.pathname.startsWith('/owner');

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-light border-b border-[var(--glass-border)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="relative">
              {/* Glow aura */}
              <div className="absolute inset-0 bg-primary/30 rounded-xl blur-xl group-hover:bg-primary/45 transition-all duration-400 scale-125" />
              <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-[0_4px_16px_hsl(var(--primary)/0.45)] group-hover:shadow-[0_6px_24px_hsl(var(--primary)/0.6)] transition-all duration-300 group-hover:-translate-y-0.5">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-display font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                CU Hostel Finder
                <Sparkles className="h-3.5 w-3.5 text-accent opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-12" />
              </h1>
              <p className="text-[11px] text-muted-foreground leading-none">Central University Ghana</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex items-center space-x-2 sm:space-x-3">
            <ThemeToggle />

            {!isAdminRoute && !isOwnerRoute && (
              <>
                {/* Owner Portal — gradient filled */}
                <Button
                  size="sm"
                  onClick={() => navigate('/owner')}
                  className="h-9 rounded-xl"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Owner Portal</span>
                </Button>

                {/* Admin — glass outline */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="h-9 rounded-xl"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              </>
            )}

            {(isAdminRoute || isOwnerRoute) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="h-9 rounded-xl"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline">View Listings</span>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
