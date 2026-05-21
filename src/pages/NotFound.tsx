import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Building2, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 animated-gradient opacity-90" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />

      {/* Floating blobs */}
      <div className="absolute top-20 left-16 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-20 right-16 w-96 h-96 bg-white/8 rounded-full blur-3xl float-delayed pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-2xl animate-pulse-scale pointer-events-none" />

      {/* Content */}
      <div className="relative text-center px-6 animate-fade-in-up max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
            <Building2 className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* 404 */}
        <h1 className="text-[10rem] md:text-[12rem] font-display font-bold text-white/20 leading-none select-none mb-0 -mt-4">
          404
        </h1>

        <div className="-mt-8 mb-6">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
            Page Not Found
          </h2>
          <p className="text-white/70 text-lg leading-relaxed max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => navigate('/')}
            className="h-12 px-6 rounded-xl font-semibold bg-white text-primary hover:bg-white/90 shadow-lg transition-all duration-300 flex items-center gap-2 shine-effect"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="h-12 px-6 rounded-xl font-semibold text-white border border-white/30 hover:bg-white/10 backdrop-blur-sm transition-all duration-300 flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
