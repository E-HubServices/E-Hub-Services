import { useState, useMemo, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useConvexAuth, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useClerk } from "@clerk/clerk-react";
import ServiceCard from "@/components/services/ServiceCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  FileText,
  Award,
  Wallet,
  Briefcase,
  GraduationCap,
  X,
  Loader2,
  LogOut,
  User,
  Upload,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationBell from "@/components/shared/NotificationBell";

// Icon mapping for categories
const getCategoryIcon = (categoryName: string) => {
  const normalized = categoryName.toLowerCase();
  if (normalized.includes("revenue")) return FileText;
  if (normalized.includes("certificate")) return Award;
  if (normalized.includes("pension")) return Wallet;
  if (normalized.includes("license")) return Briefcase;
  if (normalized.includes("education")) return GraduationCap;
  return FileText;
};

const Services = () => {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useClerk();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearchQuery(q);
  }, [searchParams]);

  const user = useQuery(api.users.getProfile);
  const categories = useQuery(api.services.getCategories);
  const allServices = useQuery(api.services.getAllServices);

  const filteredServices = useMemo(() => {
    if (!allServices) return [];

    let result = allServices;

    // Filter by search query first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.serviceCode.toLowerCase().includes(query) ||
        s.department.toLowerCase().includes(query)
      );
    }

    // Then filter by category
    if (activeCategory !== "all") {
      result = result.filter(s => s.categoryId === activeCategory);
    }

    return result;
  }, [activeCategory, searchQuery, allServices]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleLogout = async () => {
    await signOut({ redirectUrl: "/" });
  };

  const activeCategoryName = categories?.find(c => c._id === activeCategory)?.name;

  return (
    <>
      <Unauthenticated>
        <Navigate to="/auth" replace />
      </Unauthenticated>

      <AuthLoading>
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </AuthLoading>

      <Authenticated>
        {categories === undefined || allServices === undefined ? (
          <div className="min-h-screen bg-cream flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-muted-foreground">Loading services...</p>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-cream">
            {/* Simple Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
              <div className="container flex items-center justify-between h-16">
                <Link to="/dashboard" className="flex items-center gap-2">
                  <img src="/logo.png" alt="E-Hub Logo" className="h-10 w-10 object-contain rounded-lg shadow-md bg-white" />
                  <span className="font-heading text-lg font-bold text-foreground">E-Hub Services</span>
                </Link>

                <div className="flex items-center gap-4">
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">
                      My Dashboard
                    </Button>
                  </Link>
                  <div className="h-8 w-px bg-border hidden sm:block" />
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium hidden sm:block">{user?.name || 'User'}</span>
                  </div>
                  <div className="h-8 w-px bg-border hidden sm:block" />
                  <NotificationBell />
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              </div>
            </header>

            <main>
              {/* Hero Section */}
              <section className="bg-gradient-to-br from-primary/5 to-saffron/5 py-12 border-b border-border">
                <div className="container">
                  <div className="max-w-3xl">
                    <Badge className="mb-4 bg-saffron/20 text-saffron border-saffron/30">
                      {allServices.length}+ Services Available
                    </Badge>
                    <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4 text-foreground">
                      Choose a Service
                    </h1>
                    <p className="text-slate-700 font-medium mb-6">
                      Select a government document service to get started. Upload your documents and we'll process them for you.
                    </p>

                    {/* Search Bar */}
                    <div className="relative max-w-xl">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-12 h-12 bg-white border-border"
                      />
                      {searchQuery && (
                        <button
                          onClick={clearSearch}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Category Selection */}
              <section className="py-6 bg-white border-b border-border shadow-sm sticky top-16 z-40">
                <div className="container">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <span className="text-sm font-bold text-slate-900 uppercase tracking-wider min-w-fit">Filter by Category:</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-[280px] justify-between border-2 border-slate-100 rounded-2xl h-12 font-black text-slate-900 shadow-sm hover:border-primary/30 active:scale-95 transition-all">
                          <div className="flex items-center gap-3">
                            {activeCategory === "all" ? (
                              <FileText className="h-5 w-5 text-primary" />
                            ) : (
                              (() => {
                                const cat = categories.find(c => c._id === activeCategory);
                                const Icon = getCategoryIcon(cat?.name || "");
                                return <Icon className="h-5 w-5 text-primary" />;
                              })()
                            )}
                            <span>
                              {activeCategory === "all"
                                ? "All Services"
                                : categories.find(c => c._id === activeCategory)?.name}
                            </span>
                          </div>
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[280px] bg-white rounded-2xl shadow-2xl border-slate-100 p-2">
                        <DropdownMenuItem
                          onClick={() => setActiveCategory("all")}
                          className={cn(
                            "rounded-xl p-3 font-bold cursor-pointer transition-colors mb-1",
                            activeCategory === "all" ? "bg-primary/5 text-primary" : "text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          <FileText className="h-4 w-4 mr-3" />
                          All Services
                        </DropdownMenuItem>
                        {categories.map((category) => {
                          const Icon = getCategoryIcon(category.name);
                          return (
                            <DropdownMenuItem
                              key={category._id}
                              onClick={() => setActiveCategory(category._id)}
                              className={cn(
                                "rounded-xl p-3 font-bold cursor-pointer transition-colors mb-1",
                                activeCategory === category._id ? "bg-primary/5 text-primary" : "text-slate-600 hover:bg-slate-50"
                              )}
                            >
                              <Icon className="h-4 w-4 mr-3" />
                              {category.name}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </section>

              {/* Services Grid */}
              <section className="py-8">
                <div className="container">
                  {/* Results Header */}
                  <div className="mb-6">
                    <h2 className="font-heading text-xl font-semibold text-foreground">
                      {searchQuery
                        ? `Search Results for "${searchQuery}"`
                        : activeCategory === "all"
                          ? "All Services"
                          : activeCategoryName || "Services"
                      }
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} available
                    </p>
                  </div>

                  {/* Grid */}
                  {filteredServices.length > 0 ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredServices.map((service) => (
                        <ServiceCard key={service._id} service={{
                          id: service._id,
                          code: service.serviceCode,
                          name: service.name,
                          categoryId: service.categoryId,
                          department: service.department,
                          description: service.description,
                          price: service.price,
                          processingTime: service.processingTime,
                          requiredDocuments: service.requiredDocuments,
                          popular: false
                        }} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                        No services found
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your search or browse a different category
                      </p>
                      <Button variant="outline" onClick={() => { clearSearch(); setActiveCategory("all"); }}>
                        View All Services
                      </Button>
                    </div>
                  )}
                </div>
              </section>
            </main>
          </div>
        )}
      </Authenticated>
    </>
  );
};

export default Services;
