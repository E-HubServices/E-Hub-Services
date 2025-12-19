import { useState } from "react";
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
    User,
    LogOut,
    ChevronRight,
    Ban,
    Loader2,
    Briefcase,
    TrendingUp,
    CreditCard,
    MessageSquare,
    Shield,
} from "lucide-react";
import { downloadFromUrl } from "@/lib/utils";

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

const ShopOwnerDashboard = () => {
    const { signOut } = useClerk();
    const navigate = useNavigate();

    // Fetch profile first to determine role
    const user = useQuery(api.users.getProfile);
    const unreadCount = useQuery(api.messages.getUnreadCount);
    const stats = useQuery(api.users.getUserStats, user ? {} : "skip");
    const shopOwnerRequests = useQuery(api.requests.getShopOwnerRequests, user?.role === "shop_owner" ? {} : "skip");
    const pendingRequests = useQuery(api.requests.getPendingRequests, user?.role === "shop_owner" ? {} : "skip");

    const [activeTab, setActiveTab] = useState("assigned");
    const assignRequest = useMutation(api.requests.assignRequest);

    const handleLogout = async () => {
        await signOut({ redirectUrl: "/" });
    };

    const handleAssign = async (requestId: any) => {
        try {
            await assignRequest({ requestId });
            toast.success("Request assigned to you!");
        } catch (err: any) {
            toast.error(err.message || "Failed to assign request");
        }
    };

    // Redirect if user is customer
    if (user && user.role === "customer") {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <>
            <Authenticated>
                {user === undefined ? (
                    <div className="min-h-screen bg-cream flex items-center justify-center">
                        <div className="flex flex-col items-center text-center p-6">
                            <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Loading your profile...</h2>
                            <p className="text-muted-foreground">Please wait while we fetch your information</p>
                        </div>
                    </div>
                ) : user === null ? (
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
                ) : stats === undefined || shopOwnerRequests === undefined || pendingRequests === undefined ? (
                    <div className="min-h-screen bg-cream flex items-center justify-center">
                        <div className="flex flex-col items-center text-center p-6">
                            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                            <p className="text-muted-foreground">Loading dashboard data...</p>
                        </div>
                    </div>
                ) : (
                    <div className="min-h-screen bg-cream">
                        {/* Header */}
                        <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
                            <div className="container flex items-center justify-between h-16">
                                <Link to="/" className="flex items-center gap-2">
                                    <img src="/logo.png" alt="E-Hub Logo" className="h-10 w-10 object-contain rounded-lg shadow-md bg-white" />
                                    <span className="font-heading text-lg font-bold text-foreground">E-Hub Services</span>
                                    <Badge variant="hero" className="ml-2 uppercase text-[10px] py-0">Partner</Badge>
                                </Link>

                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-px bg-border hidden sm:block" />
                                    <div className="flex items-center gap-2">
                                        <div className="relative mr-2">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                                                <MessageSquare className="h-5 w-5 text-slate-400" />
                                            </div>
                                            {unreadCount && unreadCount > 0 ? (
                                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-pulse">
                                                    {unreadCount}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="h-4 w-4 text-primary" />
                                        </div>
                                        <span className="text-sm font-black text-slate-900 hidden sm:block">{user.name || 'Partner'}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
                                        <LogOut className="h-4 w-4" />
                                        <span className="hidden sm:inline">Logout</span>
                                    </Button>
                                </div>
                            </div>
                        </header>

                        <main className="container py-8">
                            <div className="space-y-8">
                                <div>
                                    <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                                        Partner Dashboard 🧑‍💼
                                    </h1>
                                    <p className="text-slate-600 font-bold">Manage and process government service requests assigned to you.</p>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard title="My Active Work" value={stats?.inProgressRequests + (stats?.assignedRequests || 0)} icon={Briefcase} color="bg-purple-100" iconColor="text-purple-600" />
                                    <StatCard title="Completed Today" value={stats?.completedRequests} icon={TrendingUp} color="bg-green-100" iconColor="text-india-green" />
                                    <StatCard title="Available to Accept" value={pendingRequests?.length} icon={Plus} color="bg-amber-100" iconColor="text-amber-600" />
                                    <StatCard title="Total Earnings" value={`₹${stats?.totalEarnings || 0}`} icon={CreditCard} color="bg-primary/10" iconColor="text-primary" />
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <Link to="/manage-services" className="group">
                                        <div className="p-6 bg-white border-2 border-slate-100 rounded-3xl shadow-xl hover:shadow-2xl hover:border-primary/20 transition-all flex items-center justify-between overflow-hidden relative group">
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Infrastructure</p>
                                                <h3 className="text-2xl font-black text-slate-900">Manage Catalog</h3>
                                                <p className="text-sm text-slate-500 font-bold mt-1">Add or edit services offered</p>
                                            </div>
                                            <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all text-primary border border-primary/10">
                                                <Plus className="h-7 w-7" />
                                            </div>
                                        </div>
                                    </Link>
                                    <Link to="/esign" className="group">
                                        <div className="p-6 bg-slate-900 border-none rounded-3xl shadow-xl hover:-translate-y-1 transition-all flex items-center justify-between overflow-hidden relative group">
                                            <div className="relative z-10 text-white">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Official Feature</p>
                                                <h3 className="text-2xl font-black">e-Sign / e-Seal</h3>
                                                <p className="text-sm text-slate-400 font-bold mt-1">Request or manage endorsements</p>
                                            </div>
                                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-slate-950 transition-all text-primary border border-white/5">
                                                <Shield className="h-7 w-7" />
                                            </div>
                                        </div>
                                    </Link>
                                    <Link to="/analytics" className="group">
                                        <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xl hover:-translate-y-1 transition-all flex items-center justify-between overflow-hidden relative">
                                            <div className="relative z-10">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Performance</p>
                                                <h3 className="text-2xl font-black text-slate-900">Revenue & Trends</h3>
                                                <p className="text-sm text-slate-500 font-bold mt-1">View insights and download invoices</p>
                                            </div>
                                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600">
                                                <TrendingUp className="h-7 w-7" />
                                            </div>
                                        </div>
                                    </Link>
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
                                                        <TabsTrigger value="assigned">My Assigned ({shopOwnerRequests?.length || 0})</TabsTrigger>
                                                        <TabsTrigger value="pending">Available Requests ({pendingRequests?.length || 0})</TabsTrigger>
                                                    </TabsList>

                                                    <TabsContent value="assigned" className="space-y-4">
                                                        {shopOwnerRequests.length === 0 ? (
                                                            <EmptyState message="No requests currently assigned to you." />
                                                        ) : (
                                                            shopOwnerRequests.map((r: any) => <RequestItem key={r._id} request={r} role="shop_owner" />)
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
                                                                            className="bg-india-green hover:bg-india-green text-white gap-2"
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
                        </main>
                    </div>
                )}
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

// Shared Components
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
    const getFileUrl = useQuery(api.files.getFileUrl,
        request.outputFile ? { storageId: request.outputFile, requestId: request._id } : "skip"
    );

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
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 hidden sm:flex text-india-green border-india-green hover:bg-india-green hover:text-white"
                        onClick={() => downloadFromUrl(getFileUrl!, `${request?.service?.name || "Service"}_Result.pdf`)}
                        disabled={!getFileUrl}
                    >
                        <Download className="h-4 w-4" /> Download
                    </Button>
                )}
                <Link to={`/request/${request._id}`}>
                    <Button variant="outline" size="sm" className="gap-1 text-primary border-primary/20 hover:bg-primary/5">
                        <span className="hidden sm:inline">Details</span>
                        <ChevronRight className="h-4 w-4" />
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

export default ShopOwnerDashboard;
