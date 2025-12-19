import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useConvexAuth, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useClerk } from "@clerk/clerk-react";
import {
    FileText,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    Download,
    MessageSquare,
    Search,
    User,
    LogOut,
    ChevronRight,
    Ban,
    Loader2,
    Users,
    IndianRupee,
    Shield
} from "lucide-react";
import { downloadFromUrl } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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

const CustomerDashboard = () => {
    const { signOut } = useClerk();
    const navigate = useNavigate();

    // Fetch profile first to determine role
    const user = useQuery(api.users.getProfile);
    const unreadCount = useQuery(api.messages.getUnreadCount);
    const stats = useQuery(api.users.getUserStats, user ? {} : "skip");
    const customerRequests = useQuery(api.requests.getCustomerRequests, user?.role === "customer" ? {} : "skip");

    const [activeTab, setActiveTab] = useState("all");
    const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
    const [trackId, setTrackId] = useState("");

    const handleTrack = () => {
        if (!trackId.trim()) {
            toast.error("Please enter a Request ID");
            return;
        }
        // Often IDs are longer, but let's assume they might enter a partial or full ID
        // The detailed page expects the full ID.
        // If it's not a valid ID format, Convex will throw an error, so we should try-catch or just navigate.
        navigate(`/request/${trackId.trim()}`);
    };

    const handleLogout = async () => {
        await signOut({ redirectUrl: "/" });
    };

    // Redirect if user is shop owner
    if (user && user.role === "shop_owner") {
        return <Navigate to="/dashboard/owner" replace />;
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
                ) : stats === undefined || customerRequests === undefined ? (
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
                                        <span className="text-sm font-black text-slate-900 hidden sm:block">{user.name || 'User'}</span>
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
                                        Welcome back, {user.name?.split(' ')[0] || 'User'}! 👋
                                    </h1>
                                    <p className="text-slate-600 font-bold">Track your document requests and manage your services.</p>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <StatCard title="Total Requests" value={stats?.totalRequests} icon={FileText} color="bg-primary/10" iconColor="text-primary" />
                                    <StatCard title="Pending" value={stats?.pendingRequests} icon={Clock} color="bg-amber-100" iconColor="text-amber-600" />
                                    <StatCard title="In Progress" value={stats?.inProgressRequests} icon={AlertCircle} color="bg-blue-100" iconColor="text-blue-600" />
                                    <StatCard title="Completed" value={stats?.completedRequests} icon={CheckCircle2} color="bg-green-100" iconColor="text-india-green" />
                                </div>

                                {/* Useful Features: Popular Services */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Quick Services</h2>
                                        <Link to="/services" className="text-xs font-black text-primary uppercase hover:underline">View All</Link>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { name: "Birth Certificate", icon: FileText, desc: "Apply in 2 minutes", search: "Birth" },
                                            { name: "Income Certificate", icon: IndianRupee, desc: "Revenue Dept service", search: "Income" },
                                            { name: "Caste Certificate", icon: Shield, desc: "Govt verification", search: "Caste" },
                                            { name: "Community", icon: Users, desc: "Connect with others", search: "Community" }
                                        ].map((s, i) => (
                                            <Card
                                                key={i}
                                                className="hover:shadow-lg transition-all cursor-pointer border-slate-100 border-2 group hover:border-primary/20 active:scale-95"
                                                onClick={() => navigate(`/services?search=${s.search}`)}
                                            >
                                                <CardContent className="p-4 flex flex-col items-center text-center">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-3 group-hover:bg-primary transition-colors">
                                                        <s.icon className="h-5 w-5 text-slate-400 group-hover:text-white" />
                                                    </div>
                                                    <p className="text-xs font-black text-slate-900 mb-1">{s.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold">{s.desc}</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col lg:flex-row gap-8">
                                    <div className="flex-1">
                                        <Card className="border-border/50">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                                                <CardTitle className="font-heading text-xl">My Requests</CardTitle>
                                                <Link to="/services">
                                                    <Button variant="default" size="sm" className="gap-2">
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
                                                        {(() => {
                                                            const filteredRequests = activeTab === "all"
                                                                ? customerRequests
                                                                : (customerRequests || []).filter((r: any) => {
                                                                    if (activeTab === "pending") return r.status === "pending" || r.status === "assigned";
                                                                    return r.status === activeTab;
                                                                });

                                                            return filteredRequests.length === 0 ? (
                                                                <EmptyState message="No requests found" />
                                                            ) : (
                                                                filteredRequests.map((r: any) => <RequestItem key={r._id} request={r} role="customer" />)
                                                            );
                                                        })()}
                                                    </TabsContent>
                                                </Tabs>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="w-full lg:w-80 space-y-6">
                                        <QuickActions onTrack={() => setIsTrackModalOpen(true)} />
                                        <HelpCard />
                                    </div>
                                </div>
                            </div>
                        </main>

                        {/* Tracking Dialog */}
                        <Dialog open={isTrackModalOpen} onOpenChange={setIsTrackModalOpen}>
                            <DialogContent className="sm:max-w-[425px] bg-white rounded-3xl p-8 border-t-4 border-t-primary">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black text-slate-900">Track Request</DialogTitle>
                                    <p className="text-slate-500 font-bold pt-1">Enter your Request ID to check current status</p>
                                </DialogHeader>
                                <div className="py-6">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Reference ID</label>
                                    <Input
                                        placeholder="e.g. jd790... (from your email/SMS)"
                                        className="h-14 font-bold border-2 border-slate-100 rounded-2xl focus:border-primary/30"
                                        value={trackId}
                                        onChange={(e) => setTrackId(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={handleTrack}
                                        className="w-full h-14 bg-primary hover:bg-primary text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all"
                                    >
                                        Track Now
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
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

const QuickActions = ({ onTrack }: { onTrack: () => void }) => (
    <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-50"><CardTitle className="font-black text-slate-900 uppercase text-xs tracking-widest">Quick Actions</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-4">
            <Link to="/services" className="block">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 font-bold border-slate-100 hover:bg-slate-50 hover:border-primary/20 transition-all rounded-xl group text-slate-700">
                    <Plus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    New Document Request
                </Button>
            </Link>
            <Button
                variant="outline"
                onClick={onTrack}
                className="w-full justify-start gap-3 h-12 font-bold border-slate-100 hover:bg-slate-50 hover:border-primary/20 transition-all rounded-xl group text-slate-700"
            >
                <Search className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                Track Existing Request
            </Button>
            <Button variant="outline" className="w-full justify-start gap-3 h-12 font-bold border-slate-100 hover:bg-slate-50 hover:border-primary/20 transition-all rounded-xl group text-slate-700">
                <MessageSquare className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                Contact Support
            </Button>
            <div className="h-px bg-slate-50 my-2" />
            <Link to="/esign" className="block">
                <Button className="w-full justify-start gap-3 h-12 font-black border-none bg-slate-900 hover:bg-slate-800 text-white shadow-lg transition-all rounded-xl group">
                    <Shield className="h-4 w-4 text-primary group-hover:animate-pulse" />
                    e-Sign / e-Seal
                </Button>
            </Link>
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

export default CustomerDashboard;
