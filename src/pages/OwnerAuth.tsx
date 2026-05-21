import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, LogIn, UserPlus, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Sparkles, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const OwnerAuth = () => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupName, setSignupName] = useState('');
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
        .eq('role', 'hostel_owner')
        .single();

      if (roleData) {
        navigate('/owner/dashboard');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;

      if (!data.session) throw new Error('No session created');

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.session.user.id)
        .eq('role', 'hostel_owner')
        .single();

      if (!roleData) {
        const { error: roleError } = await supabase.functions.invoke('assign-owner-role');
        if (roleError) {
          await supabase.auth.signOut();
          throw new Error('Could not verify owner account. Please contact support.');
        }
      }

      toast({
        title: 'Welcome back!',
        description: 'You have been logged in successfully.',
      });

      navigate('/owner/dashboard');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (signupPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          data: { full_name: signupName },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error('Signup failed');

      // If no session (email confirmation enabled), sign in immediately to bypass it
      let session = data.session;
      if (!session) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: signupEmail,
          password: signupPassword,
        });
        if (signInError) throw signInError;
        session = signInData.session;
      }

      if (session) {
        const { error: roleError } = await supabase.functions.invoke('assign-owner-role');
        if (roleError) {
          console.error('Role assignment error:', roleError);
        }
        toast({
          title: 'Account Created!',
          description: 'Welcome! You can now add your hostels.',
        });
        navigate('/owner/dashboard');
        return;
      }

      // Fallback — should rarely hit this path
      toast({
        title: 'Account Created!',
        description: 'Your account is ready. Please sign in.',
      });

      setSignupEmail('');
      setSignupPassword('');
      setSignupName('');
    } catch (error: any) {
      toast({
        title: 'Signup Failed',
        description: error.message || 'Could not create account',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "pl-12 h-12 border-2 border-border focus:border-primary/60 rounded-xl transition-all duration-300 bg-card/50";

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Gradient Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 animated-gradient" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />

        <div className="absolute top-20 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-float pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-white/8 rounded-full blur-3xl float-delayed pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-accent/20 rounded-full blur-2xl animate-pulse-scale pointer-events-none" />

        {/* Top — Logo */}
        <div className="relative flex items-center gap-3 animate-fade-in-down">
          <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="text-white font-display font-bold text-xl leading-tight">CU Hostel Finder</p>
            <p className="text-white/70 text-sm">Owner Portal</p>
          </div>
        </div>

        {/* Middle */}
        <div className="relative space-y-6 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white/90 text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>Hostel Owner Platform</span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight">
            List your hostel,
            <span className="block text-white/80">reach students</span>
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm">
            Join hundreds of hostel owners who trust CU Hostel Finder to connect them with students.
          </p>

          {/* Benefits */}
          <div className="space-y-3 pt-2">
            {[
              'Get discovered by 1000+ students',
              'Manage rooms & availability',
              'Dedicated admin support',
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3 text-white/85 text-sm">
                <div className="p-1 rounded-full bg-white/20 flex-shrink-0">
                  <CheckCircle className="h-4 w-4" />
                </div>
                {benefit}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/50 text-sm">
          © {new Date().getFullYear()} Central University Ghana
        </p>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-background relative">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-glow">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-bold text-foreground">CU Hostel Finder</p>
            <p className="text-xs text-muted-foreground">Owner Portal</p>
          </div>
        </div>

        <div className="absolute inset-0 gradient-mesh opacity-40 pointer-events-none" />

        <div className="relative w-full max-w-md mx-auto">
          <div className="mb-8 animate-fade-in-down">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Owner Portal</h1>
            <p className="text-muted-foreground">Sign in to manage your hostel listings</p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="login" className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <TabsList className="w-full h-12 rounded-xl bg-muted/60 p-1 mb-6">
              <TabsTrigger
                value="login"
                className="flex-1 h-10 rounded-lg text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="flex-1 h-10 rounded-lg text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary-glow data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </TabsTrigger>
            </TabsList>

            {/* LOGIN TAB */}
            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-sm font-semibold">Email Address</Label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 group-focus-within:bg-primary/20 transition-colors">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="owner@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-sm font-semibold">Password</Label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 group-focus-within:bg-primary/20 transition-colors">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl font-semibold text-base bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground shadow-glow hover:shadow-glow transition-all duration-300 shine-effect"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* SIGNUP TAB */}
            <TabsContent value="signup" className="mt-0">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name" className="text-sm font-semibold">Full Name</Label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 group-focus-within:bg-primary/20 transition-colors">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <Input
                      id="signup-name"
                      placeholder="Your full name"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-semibold">Email Address</Label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 group-focus-within:bg-primary/20 transition-colors">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="owner@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-semibold">Password</Label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-primary/10 group-focus-within:bg-primary/20 transition-colors">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl font-semibold text-base bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 text-primary-foreground shadow-glow hover:shadow-glow transition-all duration-300 shine-effect"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                      Creating account...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Create Account
                    </span>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center px-4 py-3 rounded-xl bg-muted/40 border border-border">
                  Your hostels will be reviewed by an admin before being published to students.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          {/* Back link */}
          <div className="mt-8 text-center">
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

export default OwnerAuth;
