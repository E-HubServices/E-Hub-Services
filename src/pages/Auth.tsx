import { Navigate } from "react-router-dom";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Upload, Download } from "lucide-react";
import { useConvexAuth, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useConvexAuth();

  const mode = searchParams.get("mode");
  const isSignUp = mode === "signup";

  return (
    <>
      <Unauthenticated>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md space-y-8 animate-fade-up">
            {/* Logo/Brand */}
            <div className="text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-md mb-6 transition-transform hover:scale-105">
                <img src="/logo.png" alt="E-Hub Logo" className="h-10 w-auto object-contain" />
                <span className="font-heading text-2xl font-bold text-slate-900 font-bold">E-Hub Services</span>
              </div>

              <h1 className="font-heading text-3xl font-bold text-slate-900 mb-2">
                {isSignUp ? "Create Your Account" : "Welcome Back"}
              </h1>
              <p className="text-slate-600 font-medium">
                {isSignUp ? "Start processing documents today" : "Sign in to continue to your dashboard"}
              </p>
            </div>

            {/* Auth Component Container */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
              <div className="p-1 sm:p-4">
                {isSignUp ? (
                  <SignUp
                    routing="hash"
                    signInUrl="/auth?mode=login"
                    forceRedirectUrl="/dashboard"
                    appearance={{
                      variables: {
                        colorPrimary: '#FF8000',
                        colorText: '#0f172a',
                        colorTextSecondary: '#475569',
                      },
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none w-full border-none m-0 p-2 sm:p-4",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                        socialButtonsBlockButton: "border-slate-200 hover:bg-slate-50",
                        formButtonPrimary: "bg-primary hover:bg-primary shadow-lg",
                      }
                    }}
                  />
                ) : (
                  <SignIn
                    routing="hash"
                    signUpUrl="/auth?mode=signup"
                    forceRedirectUrl="/dashboard"
                    appearance={{
                      variables: {
                        colorPrimary: '#FF8000',
                        colorText: '#0f172a',
                        colorTextSecondary: '#475569',
                      },
                      elements: {
                        rootBox: "w-full",
                        card: "shadow-none w-full border-none m-0 p-2 sm:p-4",
                        headerTitle: "hidden",
                        headerSubtitle: "hidden",
                        socialButtonsBlockButton: "border-slate-200 hover:bg-slate-50 uppercase text-xs font-bold tracking-wider",
                        formButtonPrimary: "bg-primary hover:bg-primary shadow-lg uppercase font-bold",
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center">
              <a href="/" className="text-sm font-bold text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2">
                ← Back to Homepage
              </a>
            </div>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <Navigate to="/dashboard" replace />
      </Authenticated>

      <AuthLoading>
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthLoading>
    </>
  );
};

export default Auth;
