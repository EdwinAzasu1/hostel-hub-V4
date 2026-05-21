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
    <header className="fixed top-0 left-0 right-0 z-50 glass-light dark:glass border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-xl group-hover:bg-primary/30 transition-all duration-300" />
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-primary to-primary-hover">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                CU Hostel Finder
                <Sparkles className="h-4 w-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </h1>
              <p className="text-xs text-muted-foreground">Central University Ghana</p>
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
                  className="h-9 rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground shadow-glow/40 hover:shadow-glow transition-all duration-300 flex items-center gap-2 shine-effect"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline font-semibold">Owner Portal</span>
                </Button>

                {/* Admin — ghost/outline */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="h-9 rounded-xl border-border hover:border-primary/50 hover:text-primary hover:shadow-glow/30 transition-all duration-300 flex items-center gap-2"
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
                className="h-9 rounded-xl border-border hover:border-primary/50 hover:text-primary transition-all duration-300 flex items-center gap-2"
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
