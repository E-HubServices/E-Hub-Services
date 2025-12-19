import { Link, Navigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";
import { Upload, Download, ArrowRight, Shield, Zap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { isAuthenticated } = useConvexAuth();

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-20" />

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-24 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Logo/Brand */}
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-white rounded-full shadow-2xl border border-slate-100 animate-fade-up">
            <img src="/logo.png" alt="E-Hub Logo" className="w-12 h-12 object-contain" />
            <span className="font-heading text-3xl font-black text-slate-900 tracking-tighter">E-Hub Services</span>
          </div>

          {/* Main Headline */}
          <div className="space-y-8 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <h1 className="font-heading text-6xl md:text-8xl font-black text-slate-900 leading-[1.1] tracking-tight">
              <span className="text-primary">Upload</span> Docs.
              <br />
              <span className="text-green-600">Download</span> Joy.
            </h1>

            <p className="text-xl md:text-2xl text-slate-700 max-w-2xl mx-auto font-bold leading-relaxed">
              India's fastest, most secure document processing gateway.
              <br />
              Digital solutions for traditional governance.
            </p>
          </div>

          {/* Process Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center py-12 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-50 hover:shadow-2xl transition-all hover:-translate-y-2 group">
              <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">UPLOAD</h3>
              <p className="text-slate-500 font-bold">Securely stage your documents</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-50 hover:shadow-2xl transition-all hover:-translate-y-2 group">
              <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">PROCESS</h3>
              <p className="text-slate-500 font-bold">Expert verification & handling</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-50 hover:shadow-2xl transition-all hover:-translate-y-2 group">
              <div className="w-20 h-20 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Download className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">DOWNLOAD</h3>
              <p className="text-slate-500 font-bold">Get results in record time</p>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4 animate-fade-up" style={{ animationDelay: '300ms' }}>
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-slate-900 hover:bg-slate-800 text-white px-16 py-8 text-2xl font-black rounded-full shadow-2xl hover:shadow-primary/20 active:scale-95 transition-all uppercase tracking-tighter"
              >
                Get Started Now
                <ArrowRight className="ml-3 w-8 h-8 text-primary" />
              </Button>
            </Link>
          </div>

          {/* Trust Labels */}
          <div className="pt-16 flex flex-wrap justify-center gap-6 animate-fade-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-900 rounded-2xl shadow-xl text-white font-black uppercase tracking-widest text-[10px] border border-slate-800">
              <Shield className="w-5 h-5 text-india-green" /> Secure SSL
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-900 rounded-2xl shadow-xl text-white font-black uppercase tracking-widest text-[10px] border border-slate-800">
              <Zap className="w-5 h-5 text-primary" /> Zero Wait Time
            </div>
            <div className="flex items-center gap-3 px-6 py-3 bg-slate-900 rounded-2xl shadow-xl text-white font-black uppercase tracking-widest text-[10px] border border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-blue-400" /> Govt Verified
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
