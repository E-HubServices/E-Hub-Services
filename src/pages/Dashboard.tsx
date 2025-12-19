import { useState, useEffect } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useConvexAuth, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useClerk } from "@clerk/clerk-react";
import { toast } from "sonner";
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  MessageSquare,
  Search,
  Bell,
  User,
  LogOut,
  ChevronRight,
  Fingerprint,
  CreditCard,
  Ban,
  Loader2,
  Briefcase,
  TrendingUp,
  Settings,
  ShieldCheck,
  CheckCircle
} from "lucide-react";

// Status configuration for style and icons
const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: AlertCircle
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: Ban
  },
  assigned: {
    label: "Assigned",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: User
  }
};

const Dashboard = () => {
  const { signOut } = useClerk();

  // Fetch profile first to determine role
  const user = useQuery(api.users.getProfile);

  // Conditional queries based on role
  const stats = useQuery(api.users.getUserStats, user ? {} : "skip");
  const customerRequests = useQuery(api.requests.getCustomerRequests, user?.role === "customer" ? {} : "skip");
  const shopOwnerRequests = useQuery(api.requests.getShopOwnerRequests, user?.role === "shop_owner" ? {} : "skip");
  const pendingRequests = useQuery(api.requests.getPendingRequests, user?.role === "shop_owner" ? {} : "skip");

  const handleLogout = async () => {
    await signOut({ redirectUrl: "/" });
  };

  return (
    <>
      <Authenticated>
        <DashboardLayout
          user={user}
          stats={stats}
          customerRequests={customerRequests}
          shopOwnerRequests={shopOwnerRequests}
          pendingRequests={pendingRequests}
          handleLogout={handleLogout}
        />
      </Authenticated>

      <Unauthenticated>
        <Navigate to="/auth" replace />
      </Unauthenticated>

      <AuthLoading>
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-primary/20 rounded-full mb-4 flex items-center justify-center">
              <div className="h-6 w-6 bg-primary/40 rounded-full animate-ping"></div>
            </div>
            <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
            <p className="text-sm text-muted-foreground animate-pulse">Preparing your dashboard...</p>
          </div>
        </div>
      </AuthLoading>
    </>
  );
};

const DashboardLayout = ({
  user,
  stats,
  customerRequests,
  shopOwnerRequests,
  pendingRequests,
  handleLogout
}: any) => {
  // If user query is still loading (undefined), show loading
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center text-center p-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading your profile...</h2>
          <p className="text-muted-foreground">Please wait while we fetch your information</p>
        </div>
      </div>
    );
  }

  // If user is null, it means they're authenticated with Clerk but not yet synced to Convex
  // This is a temporary state that should resolve within a few seconds
  if (user === null) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center text-center p-6">
          <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
          <h2 className="text-xl font-semibold mb-2">Setting up your account...</h2>
          <p className="text-muted-foreground mb-4">This will only take a moment</p>
          <div className="text-xs text-muted-foreground/70 max-w-md">
            <p>We're syncing your profile with our database. If this takes more than 10 seconds, please refresh the page.</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine if all necessary data for the current role is loaded
  const isLoading = stats === undefined ||
    (user.role === "customer" && customerRequests === undefined) ||
    (user.role === "shop_owner" && (shopOwnerRequests === undefined || pendingRequests === undefined));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center text-center p-6">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-saffron shadow-md">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">E-Hub Services</span>
            {user.role === "shop_owner" && (
              <Badge variant="hero" className="ml-2 uppercase text-[10px] py-0">Partner</Badge>
            )}
          </Link>

          <div className="flex items-center gap-4">
            <RoleSwitcher currentRole={user.role} />
            <div className="h-8 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-medium hidden sm:block">{user.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {user.role === "customer" ? (
          <CustomerDashboard
            user={user}
            stats={stats}
            requests={customerRequests}
          />
        ) : (
          <ShopOwnerDashboard
            user={user}
            stats={stats}
            assignedRequests={shopOwnerRequests}
            pendingRequests={pendingRequests}
          />
        )}
      </main>
    </div>
  );
};

// --- CUSTOMER DASHBOARD ---
const CustomerDashboard = ({ user, stats, requests }: any) => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredRequests = activeTab === "all"
    ? requests
    : (requests || []).filter((r: any) => {
      if (activeTab === "pending") return r.status === "pending" || r.status === "assigned";
      return r.status === activeTab;
    });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
          Welcome back, {user.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted-foreground">Track your document requests and manage your services.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={stats?.totalRequests} icon={FileText} color="bg-primary/10" iconColor="text-primary" />
        <StatCard title="Pending" value={stats?.pendingRequests} icon={Clock} color="bg-amber-100" iconColor="text-amber-600" />
        <StatCard title="In Progress" value={stats?.inProgressRequests} icon={AlertCircle} color="bg-blue-100" iconColor="text-blue-600" />
        <StatCard title="Completed" value={stats?.completedRequests} icon={CheckCircle2} color="bg-green-100" iconColor="text-india-green" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="font-heading text-xl">My Requests</CardTitle>
              <Link to="/services">
                <Button variant="hero" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Request
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                <TabsContent value={activeTab} className="space-y-4">
                  {filteredRequests.length === 0 ? (
                    <EmptyState message="No requests found" />
                  ) : (
                    filteredRequests.map((r: any) => <RequestItem key={r._id} request={r} role="customer" />)
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-80 space-y-6">
          <QuickActions />
          <HelpCard />
        </div>
      </div>
    </div>
  );
};

// --- SHOP OWNER DASHBOARD ---
const ShopOwnerDashboard = ({ user, stats, assignedRequests, pendingRequests }: any) => {
  const [activeTab, setActiveTab] = useState("assigned");
  const assignRequest = useMutation(api.requests.assignRequest);

  const handleAssign = async (requestId: any) => {
    try {
      await assignRequest({ requestId });
      toast.success("Request assigned to you!");
    } catch (err: any) {
      toast.error(err.message || "Failed to assign request");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
          Partner Dashboard 🧑‍💼
        </h1>
        <p className="text-muted-foreground">Manage and process government service requests assigned to you.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="My Active Work" value={stats?.inProgressRequests + (stats?.assignedRequests || 0)} icon={Briefcase} color="bg-purple-100" iconColor="text-purple-600" />
        <StatCard title="Completed Today" value={stats?.completedRequests} icon={TrendingUp} color="bg-green-100" iconColor="text-india-green" />
        <StatCard title="Available to Accept" value={pendingRequests?.length} icon={Plus} color="bg-amber-100" iconColor="text-amber-600" />
        <StatCard title="Total Earnings" value={`₹${stats?.totalEarnings || 0}`} icon={CreditCard} color="bg-primary/10" iconColor="text-primary" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="font-heading text-xl">Service Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="assigned">My Assigned ({assignedRequests?.length || 0})</TabsTrigger>
                  <TabsTrigger value="pending">Available Requests ({pendingRequests?.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="assigned" className="space-y-4">
                  {assignedRequests.length === 0 ? (
                    <EmptyState message="No requests currently assigned to you." />
                  ) : (
                    assignedRequests.map((r: any) => <RequestItem key={r._id} request={r} role="shop_owner" />)
                  )}
                </TabsContent>

                <TabsContent value="pending" className="space-y-4">
                  {pendingRequests.length === 0 ? (
                    <EmptyState message="No unassigned requests available. Check back soon!" />
                  ) : (
                    pendingRequests.map((r: any) => (
                      <div key={r._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-card transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{r.service?.name}</p>
                            <p className="text-xs text-muted-foreground">From: {r.customer?.name} • Ref: {r._id.slice(-6)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Link to={`/request/${r._id}`}>
                            <Button variant="ghost" size="sm">View Details</Button>
                          </Link>
                          <Button
                            onClick={() => handleAssign(r._id)}
                            className="bg-india-green hover:bg-india-green/90 text-white gap-2"
                          >
                            <Plus className="h-4 w-4" /> Accept
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-80 space-y-6">
          <Card className="border-border/50">
            <CardHeader><CardTitle className="text-lg">Partner Metrics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Response Time</span>
                <span className="font-semibold">Fast (&lt; 2h)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Completion Rate</span>
                <span className="font-semibold text-green-600">98%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Member Since</span>
                <span className="font-semibold">Dec 2025</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// --- SHARED COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, color, iconColor }: any) => (
  <Card className="border-border/50">
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground">{title}</p>
          <p className="text-xl sm:text-2xl font-bold font-heading">{value || 0}</p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const RequestItem = ({ request, role }: any) => {
  const status = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-card transition-all group">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <FileText className="h-6 w-6 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-foreground truncate">
            {request?.service?.name || "Unknown Service"}
          </span>
          <Badge variant="outline" className={status.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{role === "customer" ? `Ref: ${request._id.slice(-6)}` : `Customer: ${request.customer?.name}`}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">{new Date(request._creationTime).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {request.outputFile && (
          <Button variant="success" size="sm" className="gap-1 hidden sm:flex">
            <Download className="h-4 w-4" /> Download
          </Button>
        )}
        <Link to={`/request/${request._id}`}>
          <Button variant="ghost" size="sm" className="gap-1 text-primary">
            <span className="hidden sm:inline">Details</span>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
};

const EmptyState = ({ message }: any) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
      <FileText className="h-8 w-8 text-muted-foreground/30" />
    </div>
    <p className="text-muted-foreground">{message}</p>
  </div>
);

const QuickActions = () => (
  <Card className="border-border/50">
    <CardHeader className="pb-3"><CardTitle className="font-heading text-lg">Quick Actions</CardTitle></CardHeader>
    <CardContent className="space-y-2">
      <Link to="/services" className="block"><Button variant="outline" className="w-full justify-start gap-2"><Plus className="h-4 w-4" /> New Document Request</Button></Link>
      <Button variant="outline" className="w-full justify-start gap-2"><Search className="h-4 w-4" /> Track Existing Request</Button>
      <Button variant="outline" className="w-full justify-start gap-2"><MessageSquare className="h-4 w-4" /> Contact Support</Button>
    </CardContent>
  </Card>
);

const HelpCard = () => (
  <Card className="border-border/50 bg-gradient-saffron text-primary-foreground">
    <CardContent className="pt-6">
      <h3 className="font-heading font-semibold mb-2">Need Help?</h3>
      <p className="text-sm text-primary-foreground/80 mb-4">Our support team is available 24/7 to assist you with your document needs.</p>
      <Button size="sm" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">Get Support</Button>
    </CardContent>
  </Card>
);

// --- FOR TESTING: ROLE SWITCHER ---
const RoleSwitcher = ({ currentRole }: { currentRole: string }) => {
  const updateProfile = useMutation(api.users.updateProfile);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleRole = async () => {
    setIsUpdating(true);
    const newRole = currentRole === "customer" ? "shop_owner" : "customer";
    try {
      await updateProfile({
        name: "Test User", // In real app, keep current name
        role: newRole as any,
      });
      toast.info(`Switched to ${newRole} mode`);
    } catch (err) {
      toast.error("Role switch failed");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleRole}
      disabled={isUpdating}
      className="gap-2 border-primary/20 hover:border-primary/50 text-xs"
    >
      {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3 text-primary" />}
      {currentRole === "customer" ? "Switch to Partner View" : "Return to Customer View"}
    </Button>
  );
};

export default Dashboard;
