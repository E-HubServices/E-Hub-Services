import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, Authenticated, AuthLoading } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Shield,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRight,
    Search,
    Plus,
    Loader2,
    User,
    LogOut,
    Download,
    Eye,
    AlertCircle,
    History,
    Smartphone
} from "lucide-react";
import { format } from "date-fns";
import { downloadFromUrl } from "@/lib/utils";
import { EsignRequestModal } from "@/components/esign/EsignRequestModal";
import { useClerk } from "@clerk/clerk-react";

const EsignDashboard = () => {
    const { signOut } = useClerk();
    const navigate = useNavigate();
    const user = useQuery(api.users.getProfile);
    const requests = useQuery(api.esign.getEsignRequests);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const handleLogout = async () => {
        await signOut({ redirectUrl: "/" });
    };

    const statusConfig = {
        pending: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
        accepted: { label: "Accepted", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2 },
        signed: { label: "Signed", color: "bg-green-100 text-green-700 border-green-200", icon: Shield },
        rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
        cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-700 border-slate-200", icon: XCircle },
    };

    const isAuthorized = user?.role === "authorized_signatory" || user?.role === "shop_owner";

    const filteredRequests = requests?.filter(req =>
        req.requesterDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.purpose.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                <div className="container flex items-center justify-between h-20">
                    <Link to="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-heading text-xl font-black text-slate-900 tracking-tight leading-none uppercase">E-Sign Hub</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Endorsement Gateway</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link to="/profile" className="flex items-center gap-2 pr-4 border-r border-slate-200 mr-2 hover:opacity-80 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900 leading-none">{user?.name || 'User'}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{user?.role?.replace('_', ' ')}</span>
                            </div>
                        </Link>
                        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-slate-500 hover:text-red-600 font-bold">
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex-1 py-10">
                <div className="container max-w-6xl">
                    {/* Hero Action - Different for User vs Owner */}
                    <div className="grid md:grid-cols-3 gap-6 mb-10">
                        {!isAuthorized ? (
                            <Card className="md:col-span-2 bg-slate-900 border-none shadow-2xl overflow-hidden relative group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
                                    <Shield className="h-40 w-40 text-white" />
                                </div>
                                <CardContent className="p-8 relative z-10">
                                    <div className="max-w-md space-y-4">
                                        <h1 className="text-4xl font-black text-white leading-tight">Authorized Endorsement System</h1>
                                        <p className="text-slate-400 font-medium leading-relaxed">
                                            Submit your documents for secure private signing and sealing by authorized Nalavariyam officials.
                                        </p>
                                        <div className="flex gap-4 pt-2">
                                            <Button
                                                onClick={() => setIsRequestModalOpen(true)}
                                                className="bg-primary hover:bg-primary shadow-xl shadow-orange-500/20 text-slate-950 font-black uppercase tracking-tight h-12 px-8 rounded-xl active:scale-95 transition-all"
                                            >
                                                <Plus className="h-5 w-5 mr-2" />
                                                Request New e-Sign
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="md:col-span-2 bg-slate-950 border-none shadow-2xl overflow-hidden relative group border-l-4 border-l-primary/50">
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform">
                                    <Shield className="h-40 w-40 text-primary" />
                                </div>
                                <CardContent className="p-8 relative z-10">
                                    <div className="max-w-md space-y-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20 mb-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Signatory Authority Panel</span>
                                        </div>
                                        <h1 className="text-4xl font-black text-white leading-tight uppercase">Incoming Endorsement Queue</h1>
                                        <p className="text-slate-500 font-bold leading-relaxed uppercase text-xs">
                                            Review identity, verify document legitimacy, and apply official endorsements with e-Sign & Seal.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="bg-white border-none shadow-xl border-t-4 border-t-primary">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400">System Status</CardTitle>
                                    <Shield className="h-4 w-4 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold text-slate-500">SIGNATURE</span>
                                        <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">ONLINE</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500">GATEWAY</span>
                                        <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">SECURE</span>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                                    <p className="text-[10px] text-amber-900 font-bold leading-tight">
                                        This is a private endorsement system. Not a government DSC or Aadhaar e-Sign.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Request List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 uppercase">Recent Requests</h2>
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Track your signing workflow</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search by name or purpose..."
                                        className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="icon" className="rounded-xl border-slate-200 shadow-sm">
                                    <History className="h-4 w-4 text-slate-500" />
                                </Button>
                            </div>
                        </div>

                        {!requests ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            </div>
                        ) : filteredRequests?.length === 0 ? (
                            <Card className="border-none shadow-xl bg-white/50 border-2 border-dashed border-slate-200">
                                <CardContent className="py-20 text-center flex flex-col items-center">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                        <FileText className="h-10 w-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">No Requests Found</h3>
                                    <p className="text-slate-400 font-bold max-w-sm mb-8 uppercase text-xs">
                                        {isAuthorized
                                            ? "There are no incoming e-Sign/e-Seal requests in the queue at the moment."
                                            : "You haven't submitted any documents for e-Sign yet. Get started by clicking the button below."
                                        }
                                    </p>
                                    {!isAuthorized && (
                                        <Button
                                            onClick={() => setIsRequestModalOpen(true)}
                                            variant="outline"
                                            className="rounded-xl border-slate-200 font-bold"
                                        >
                                            Start Your First Request
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {filteredRequests?.map((req) => {
                                    const Status = statusConfig[req.status as keyof typeof statusConfig];
                                    return (
                                        <EsignRequestItem key={req._id} req={req} Status={Status} isAuthorized={isAuthorized} navigate={navigate} />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main >

            <EsignRequestModal
                isOpen={isRequestModalOpen}
                onOpenChange={setIsRequestModalOpen}
            />
        </div >
    );
};

const EsignRequestItem = ({ req, Status, isAuthorized, navigate }: any) => {
    const unreadCount = useQuery(api.messages.getRequestUnreadCount, {
        esignRequestId: req._id
    });

    return (
        <Card key={req._id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <CardContent className="p-0">
                <div className="flex items-stretch flex-wrap sm:flex-nowrap">
                    <div className="w-1.5 bg-slate-900 group-hover:bg-primary transition-colors" />
                    <div className="p-6 flex-1 flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 shadow-inner group-hover:bg-white transition-colors relative">
                            <FileText className="h-7 w-7 text-slate-400 group-hover:text-primary transition-colors" />
                            {unreadCount && unreadCount > 0 ? (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                    {unreadCount}
                                </span>
                            ) : null}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-black text-slate-900 truncate uppercase text-lg">{req.requesterDetails.name}</h3>
                                <Badge variant="outline" className={`${Status.color} font-black uppercase text-[10px] tracking-widest px-2`}>
                                    <Status.icon className="h-3 w-3 mr-1" />
                                    {Status.label}
                                </Badge>
                            </div>
                            <p className="text-sm font-bold text-slate-400 truncate mb-2">{req.purpose}</p>
                            <div className="flex items-center gap-4 text-xs font-black text-slate-400 uppercase tracking-tighter">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {format(req.createdAt, "MMM d, yyyy")}</span>
                                <span className="flex items-center gap-1 text-primary"><Smartphone className="h-3 w-3" /> {req.requesterDetails.mobile}</span>
                                <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> ID: {req._id.slice(-6)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {req.status === "signed" ? (
                                <Button
                                    className="bg-india-green hover:bg-india-green text-white shadow-xl shadow-green-500/20 font-black uppercase text-xs px-6 rounded-xl"
                                    onClick={() => req.signedFileId && navigate(`/esign/view/${req._id}`)}
                                >
                                    <Download className="h-4 w-4 mr-2" /> Download Signed PDF
                                </Button>
                            ) : isAuthorized && req.status === "pending" ? (
                                <Button
                                    className="bg-primary hover:bg-primary text-slate-950 shadow-xl shadow-primary/20 font-black uppercase text-xs px-6 rounded-xl"
                                    onClick={() => navigate(`/esign/editor/${req._id}`)}
                                >
                                    <Shield className="h-4 w-4 mr-2" /> Verify & Accept
                                </Button>
                            ) : isAuthorized && req.status === "accepted" ? (
                                <Button
                                    className="bg-slate-900 hover:bg-slate-800 text-white shadow-xl font-black uppercase text-xs px-6 rounded-xl border-l-4 border-l-primary"
                                    onClick={() => navigate(`/esign/editor/${req._id}`)}
                                >
                                    <Shield className="h-4 w-4 mr-2 text-primary" /> Proceed to Sign
                                </Button>
                            ) : (
                                <Button
                                    variant="ghost"
                                    className="font-black uppercase text-xs text-slate-400 hover:text-slate-900 relative"
                                    onClick={() => navigate(`/esign/view/${req._id}`)}
                                >
                                    <Search className="h-4 w-4 mr-2" /> View Details
                                    {unreadCount && unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full" />
                                    )}
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="rounded-xl border border-slate-100" onClick={() => navigate(`/esign/view/${req._id}`)}>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default EsignDashboard;
