import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { GraduationCap, Lock, Mail, ArrowLeft, Shield, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (roleData) {
        navigate('/admin/dashboard');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.session) {
        throw new Error('No session created');
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.session.user.id)
        .eq('role', 'admin')
        .single();

      if (roleError || !roleData) {
        await supabase.auth.signOut();
        throw new Error('Unauthorized: Admin access required');
      }

      toast({
        title: 'Login Successful',
        description: 'Welcome to the admin dashboard!',
      });

      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Gradient Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 animated-gradient" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />

        {/* Floating blobs */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/8 rounded-full blur-3xl float-delayed pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-accent/20 rounded-full blur-2xl animate-pulse-scale pointer-events-none" />

        {/* Top — Logo */}
        <div className="relative flex items-center gap-3 animate-fade-in-down">
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-white font-display font-bold text-xl leading-tight">CU Hostel Finder</p>
            <p className="text-white/70 text-sm">Central University Ghana</p>
          </div>
        </div>

        {/* Middle — Headline */}
        <div className="relative space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white/90 text-sm font-medium">
            <Shield className="h-4 w-4" />
            <span>Secure Admin Portal</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight">
            Manage Hostels
            <span className="block text-white/80">with confidence</span>
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Review, approve, and manage all hostel listings for Central University students.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-3 pt-2">
            {['Review Listings', 'Approve Hostels', 'Manage Rooms'].map((f) => (
              <div key={f} className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/85 text-sm font-medium">
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom text */}
        <p className="relative text-white/50 text-sm">
          © {new Date().getFullYear()} Central University Ghana
        </p>
      </div>

      {/* Right Panel — Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-background relative">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-glow">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground">CU Hostel Finder</p>
            <p className="text-xs text-muted-foreground">Central University Ghana</p>
          </div>
        </div>

        {/* Background mesh decoration */}
        <div className="absolute inset-0 gradient-mesh opacity-40 pointer-events-none" />

        <div className="relative w-full max-w-md mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 animate-fade-in-down">
            <Sparkles className="h-3.5 w-3.5" />
            Admin Access Only
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground mb-2 animate-fade-in-up">
            Welcome back
          </h1>
          <p className="text-muted-foreground mb-8 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            Sign in to your admin account to continue
          </p>

          <form onSubmit={handleLogin} className="space-y-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email Address
              </Label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 group-focus-within:bg-primary/20 transition-colors">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@centraluni.edu.gh"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-12 h-12 border-2 border-border focus:border-primary/60 rounded-xl transition-all duration-300 bg-card/50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </Label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 group-focus-within:bg-primary/20 transition-colors">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-12 pr-12 h-12 border-2 border-border focus:border-primary/60 rounded-xl transition-all duration-300 bg-card/50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl font-semibold text-base bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground shadow-glow hover:shadow-glow transition-all duration-300 shine-effect mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Sign In to Admin Panel
                </span>
              )}
            </Button>
          </form>

          {/* Back link */}
          <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Hostel Listings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;