import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable';
import { Leaf, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AuthPage = () => {
  const { enterGuestMode } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await lovable.auth.signInWithOAuth('google');
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Leaf className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">Zenith</h1>
          <p className="text-muted-foreground text-sm">Your mindful habit companion</p>
        </div>

        <div className="glass rounded-2xl p-8 space-y-4">
          <Button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card/70 px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            onClick={enterGuestMode}
            variant="outline"
            className="w-full h-12 rounded-xl border-border hover:bg-accent font-medium"
          >
            <User className="w-4 h-4 mr-2" />
            Continue as Guest
          </Button>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Guest data is stored locally and won't sync across devices
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
