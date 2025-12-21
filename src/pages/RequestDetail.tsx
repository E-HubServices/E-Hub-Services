import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, Authenticated, Unauthenticated, AuthLoading, useConvexAuth } from "convex/react";
import { useClerk } from "@clerk/clerk-react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import {
    ArrowLeft,
    Clock,
    CheckCircle2,
    AlertCircle,
    Download,
    MessageSquare,
    User,
    Shield,
    Upload,
    Loader2,
    FileText,
    ExternalLink,
    Send,
    Building2,
    Calendar,
    LogOut,
    Eye,
    Image as ImageIcon,
    X,
    AlertTriangle
} from "lucide-react";
import { downloadFromUrl, cn } from "@/lib/utils";
import ChatBox from "@/components/chat/ChatBox";
import PdfSignatureEditor from "@/components/esign/PdfSignatureEditor";
import { embedSignaturesInPdf, SignaturePlacement } from "@/lib/esign-utils";

const RequestDetail = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const navigate = useNavigate();
    const { signOut } = useClerk();

    // Use Convex auth
    const { isAuthenticated } = useConvexAuth();

    const user = useQuery(api.users.getProfile);
    const request = useQuery(api.requests.getRequestById, {
        requestId: requestId as Id<"service_requests">
    });
    const requestFiles = useQuery(api.files.getRequestFiles,
        requestId ? { requestId: requestId as Id<"service_requests"> } : "skip"
    );

    const updateStatus = useMutation(api.requests.updateRequestStatus);
    const setOutputFile = useMutation(api.requests.setOutputFile);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveFileMetadata = useMutation(api.files.saveFileMetadata);
    const requestCustomerSignature = useMutation(api.requests.requestCustomerSignature);
    const submitSelfDeclaration = useMutation(api.requests.submitSelfDeclaration);

    const [isWorking, setIsWorking] = useState(false);
    const [uploadingResult, setUploadingResult] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isSigninOpen, setIsSigninOpen] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [requestingSignature, setRequestingSignature] = useState(false);

    const unreadCount = useQuery(api.messages.getRequestUnreadCount,
        requestId ? { serviceRequestId: requestId as Id<"service_requests"> } : "skip"
    );

    const unsignedFileUrl = useQuery(api.files.getFileUrl,
        request?.unsignedFileId ? { storageId: request.unsignedFileId, requestId: request._id as any } : "skip"
    );
    const signedFileUrl = useQuery(api.files.getFileUrl,
        request?.signedFileId ? { storageId: request.signedFileId, requestId: request._id as any } : "skip"
    );

    const handleLogout = async () => {
        await signOut({ redirectUrl: "/" });
    };

    const handleRequestSignature = async (file: File) => {
        if (!request) return;
        setRequestingSignature(true);
        try {
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();
            await saveFileMetadata({
                storageId,
                originalName: file.name,
                fileType: file.type,
                fileSize: file.size,
            });
            await requestCustomerSignature({
                requestId: request._id,
                fileId: storageId,
            });
            toast.success("Signature requested from customer");
        } catch (error) {
            console.error(error);
            toast.error("Failed to request signature");
        } finally {
            setRequestingSignature(false);
        }
    };

    const handleSignComplete = async (signatures: SignaturePlacement[]) => {
        if (!request || !unsignedFileUrl) return;
        setIsSigning(true);
        try {
            // 1. Embed all signatures into PDF
            const signedPdfBlob = await embedSignaturesInPdf(unsignedFileUrl, signatures);
            const signedFile = new File([signedPdfBlob], "Signed_Declaration.pdf", { type: "application/pdf" });

            // 2. Upload signed PDF
            const postUrl = await generateUploadUrl();
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": "application/pdf" },
                body: signedFile,
            });
            const { storageId } = await result.json();

            // 3. Save Metadata
            await saveFileMetadata({
                storageId,
                originalName: "Signed_Declaration.pdf",
                fileType: "application/pdf",
                fileSize: signedFile.size,
            });

            // 4. Submit declaration
            await submitSelfDeclaration({
                serviceRequestId: request._id,
                signatureStorageId: storageId,
                signedPdfStorageId: storageId,
            });

            toast.success("Document signed successfully!");
            setIsSigninOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Signing failed");
        } finally {
            setIsSigning(false);
        }
    };


    if (request === undefined && isAuthenticated) {
        // Loading state handled below or inside Authenticated
    }

    const isOwner = user && request ? user._id === request.shopOwnerId : false;
    const isCustomer = user && request ? user._id === request.customerId : false;


    const handleStartProcessing = async () => {
        if (!request) return;
        setIsWorking(true);
        try {
            await updateStatus({
                requestId: request._id,
                status: "in_progress",
                notes: "Work has started on your document."
            });
            toast.success("Status updated to In Progress");
        } catch (err) {
            toast.error("Failed to update status");
        } finally {
            setIsWorking(false);
        }
    };

    const handleUploadResult = async (file: File) => {
        if (!request) return;
        setUploadingResult(true);
        try {
            // 1. Get upload URL
            const postUrl = await generateUploadUrl();
            // 2. Upload
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });
            const { storageId } = await result.json();
            // 3. Save Metadata
            await saveFileMetadata({
                storageId,
                originalName: file.name,
                fileType: file.type,
                fileSize: file.size,
            });
            // 4. Set as output file
            await setOutputFile({
                requestId: request._id,
                fileId: storageId,
            });
            // 5. Mark as completed
            await updateStatus({
                requestId: request._id,
                status: "completed",
                notes: "Your document is ready for download."
            });
            toast.success("Final document uploaded and request completed!");
        } catch (err) {
            toast.error("Failed to upload result");
        } finally {
            setUploadingResult(false);
        }
    };

    const statusColors: any = {
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        assigned: "bg-purple-100 text-purple-700 border-purple-200",
        in_progress: "bg-blue-100 text-blue-700 border-blue-200",
        completed: "bg-green-100 text-green-700 border-green-200",
        cancelled: "bg-red-100 text-red-700 border-red-200",
    };

    return (
        <>
            <Unauthenticated>
                <Navigate to="/auth" replace />
            </Unauthenticated>

            <AuthLoading>
                <div className="min-h-screen bg-cream flex items-center justify-center">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                </div>
            </AuthLoading>

            <Authenticated>
                <div className="min-h-screen flex flex-col bg-cream">
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
                                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
                                    <LogOut className="h-4 w-4" />
                                    <span className="hidden sm:inline">Logout</span>
                                </Button>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 container py-8">
                        {(request === undefined || user === undefined) ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : !request ? (
                            <div className="flex items-center justify-center py-12 flex-col text-center">
                                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                                <h1 className="text-2xl font-bold mb-2">Request Not Found</h1>
                                <p className="text-muted-foreground mb-6">This request doesn't exist or you don't have access.</p>
                                <Link to="/dashboard"><Button>Back to Dashboard</Button></Link>
                            </div>
                        ) : (
                            <div className="max-w-5xl mx-auto">
                                {/* Top Bar */}
                                <div className="flex items-center justify-between mb-6">
                                    <Link to="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
                                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                                    </Link>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-mono">ID: {request._id}</span>
                                        <Badge className={statusColors[request.status]}>{request.status.replace('_', ' ')}</Badge>
                                    </div>
                                </div>

                                <div className="grid lg:grid-cols-3 gap-8">
                                    {/* Left Column: Logic & Details */}
                                    <div className="lg:col-span-2 space-y-6">
                                        <Card>
                                            <CardHeader>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <CardTitle className="text-2xl font-bold">{request.service?.name}</CardTitle>
                                                        <p className="text-muted-foreground">{request.service?.department}</p>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-6">
                                                {/* Progress Tracker */}
                                                <div className="relative pt-4 pb-8">
                                                    <div className="flex justify-between">
                                                        {['pending', 'assigned', 'in_progress', 'completed'].map((s, i) => {
                                                            const statuses = ['pending', 'assigned', 'in_progress', 'completed'];
                                                            const currentIndex = statuses.indexOf(request.status);
                                                            const stepIndex = i;
                                                            const isDone = stepIndex <= currentIndex;
                                                            const isCurrent = stepIndex === currentIndex;

                                                            return (
                                                                <div key={s} className="flex flex-col items-center relative z-10 w-1/4">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 transition-colors ${isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                                                        }`}>
                                                                        {isDone && !isCurrent ? <CheckCircle2 className="h-5 w-5" /> : <span>{i + 1}</span>}
                                                                    </div>
                                                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDone ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                        {s.replace('_', ' ')}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {/* Progress Bar Line */}
                                                    <div className="absolute top-[30px] left-[12.5%] right-[12.5%] h-0.5 bg-muted -z-0">
                                                        <div
                                                            className="h-full bg-primary transition-all duration-500"
                                                            style={{ width: `${(Math.max(0, ['pending', 'assigned', 'in_progress', 'completed'].indexOf(request.status))) / 3 * 100}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <Separator />

                                                {/* Customer Documents */}
                                                <div>
                                                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2 pl-1">
                                                        <FileText className="h-4 w-4 text-primary" /> Submitted Documents
                                                    </h3>
                                                    <div className="grid sm:grid-cols-2 gap-4">
                                                        {requestFiles?.inputFiles.map((file, i) => (
                                                            <div key={file.storageId} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                                                {/* Action Icons on the left */}
                                                                <div className="flex flex-col gap-1.5 shrink-0 opacity-100 sm:opacity-40 group-hover:opacity-100 transition-opacity pr-1 border-r border-slate-50">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-xl bg-slate-50 hover:bg-primary hover:text-white transition-all shadow-sm"
                                                                        disabled={!file.url}
                                                                        onClick={() => window.open(file.url!, '_blank')}
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 rounded-xl bg-slate-50 hover:bg-india-green hover:text-white transition-all shadow-sm"
                                                                        disabled={!file.url}
                                                                        onClick={() => downloadFromUrl(file.url!, file.originalName || `Document_${i + 1}`)}
                                                                    >
                                                                        <Download className="h-4 w-4" />
                                                                    </Button>
                                                                </div>

                                                                {/* Thumbnail/Preview */}
                                                                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-inner">
                                                                    {file.fileType?.startsWith('image/') ? (
                                                                        <img src={file.url} alt={file.originalName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center">
                                                                            <FileText className="h-6 w-6 text-slate-400" />
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-black text-slate-900 truncate mb-1">{file.originalName || `Document ${i + 1}`}</p>
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge className="h-4 px-1 text-[8px] bg-slate-100 text-slate-500 border-none font-black uppercase">{(file.fileType?.split('/')[1] || 'FILE').toUpperCase()}</Badge>
                                                                        <span className="text-[9px] text-slate-400 font-bold">{(file.fileSize / 1024).toFixed(0)} KB</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <Separator />

                                                {/* Final Output (If completed) */}
                                                {request.status === "completed" && request.outputFile && (
                                                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-12 h-12 rounded-xl bg-india-green/10 flex items-center justify-center">
                                                                    <Shield className="h-6 w-6 text-india-green" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-foreground font-heading">Final Document Ready</p>
                                                                    <p className="text-xs text-muted-foreground">Certified & Verified by E-Hub Services</p>
                                                                </div>
                                                            </div>
                                                            {/* Direct link using backend generated URL */}
                                                            <Button
                                                                className="bg-india-green hover:bg-india-green text-white shadow-md"
                                                                disabled={!requestFiles?.outputFile?.url}
                                                                onClick={() => downloadFromUrl(requestFiles.outputFile!.url!, requestFiles.outputFile!.originalName || "Result.pdf")}
                                                            >
                                                                <Download className="h-4 w-4 mr-2" /> Download Result
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Customer Action: Sign Document */}
                                                {isCustomer && request.signatureStatus === "requested" && unsignedFileUrl && (
                                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3 animate-in fade-in slide-in-from-top-4">
                                                        <div className="flex items-center gap-2 text-amber-700">
                                                            <AlertCircle className="h-5 w-5" />
                                                            <h3 className="font-bold">Action Required</h3>
                                                        </div>
                                                        <p className="text-sm text-slate-600">
                                                            Your partner has requested a signature on a document. Please review and sign to proceed.
                                                        </p>
                                                        <Button
                                                            onClick={() => setIsSigninOpen(true)}
                                                            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold"
                                                        >
                                                            Sign Document Now
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Shop Owner Controls */}
                                                {isOwner && request.status !== "completed" && (
                                                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-4">
                                                        <div className="flex items-center gap-2 text-primary">
                                                            <Shield className="h-5 w-5" />
                                                            <h3 className="font-bold">Partner Controls</h3>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {/* Signature Workflow */}
                                                            <div className="p-3 bg-white rounded-lg border border-primary/10 space-y-3">
                                                                <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Self-Declaration / Signature</h4>

                                                                {(!request.signatureStatus || request.signatureStatus === 'none') ? (
                                                                    <div className="space-y-2">
                                                                        <p className="text-xs text-slate-500 font-medium">Need the customer to sign a document?</p>
                                                                        <div className="relative">
                                                                            <input
                                                                                type="file"
                                                                                accept=".pdf"
                                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                                                onChange={(e) => {
                                                                                    if (e.target.files?.[0]) handleRequestSignature(e.target.files[0]);
                                                                                }}
                                                                                disabled={requestingSignature}
                                                                            />
                                                                            <Button variant="outline" className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5" disabled={requestingSignature}>
                                                                                {requestingSignature ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                                                                Upload & Request Signature
                                                                            </Button>
                                                                        </div>
                                                                        <p className="text-[10px] text-slate-400 italic">Upload a PDF document for the customer to sign</p>
                                                                    </div>
                                                                ) : request.signatureStatus === 'requested' ? (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2 text-amber-600 text-sm font-bold bg-amber-50 p-2 rounded-lg border border-amber-100">
                                                                            <Clock className="h-4 w-4 animate-pulse" />
                                                                            Waiting for customer signature...
                                                                        </div>
                                                                        {unsignedFileUrl && (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="w-full text-xs"
                                                                                onClick={() => window.open(unsignedFileUrl, '_blank')}
                                                                            >
                                                                                <Eye className="h-3 w-3 mr-2" /> View Sent Document
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                ) : request.signatureStatus === 'signed' ? (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-2 text-green-600 text-sm font-bold bg-green-50 p-2 rounded-lg border border-green-100">
                                                                            <CheckCircle2 className="h-4 w-4" />
                                                                            Signature Received
                                                                        </div>
                                                                        {signedFileUrl && (
                                                                            <Button
                                                                                variant="secondary"
                                                                                size="sm"
                                                                                className="w-full text-xs"
                                                                                onClick={() => downloadFromUrl(signedFileUrl!, "Signed_Declaration.pdf")}
                                                                            >
                                                                                <Download className="h-3 w-3 mr-2" /> Download Signed PDF
                                                                            </Button>
                                                                        )}
                                                                        <p className="text-[10px] text-green-600 italic">✓ You can now process and upload the final result below</p>
                                                                    </div>
                                                                ) : null}
                                                            </div>

                                                            <Separator className="bg-primary/10" />

                                                            {/* Status Management */}
                                                            <div className="grid sm:grid-cols-2 gap-3">
                                                                <Button
                                                                    onClick={handleStartProcessing}
                                                                    disabled={isWorking || request.status === "in_progress"}
                                                                    className={cn(
                                                                        "w-full",
                                                                        request.status === "in_progress"
                                                                            ? "bg-slate-100 text-slate-400 border border-slate-200 pointer-events-none"
                                                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                                                    )}
                                                                >
                                                                    {isWorking ? <Loader2 className="h-4 w-4 animate-spin" /> : request.status === "in_progress" ? "Processing..." : "Start Processing"}
                                                                </Button>

                                                                <div className="relative w-full">
                                                                    <input
                                                                        type="file"
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                                                        onChange={(e) => {
                                                                            if (e.target.files?.[0]) handleUploadResult(e.target.files[0]);
                                                                        }}
                                                                        disabled={uploadingResult}
                                                                    />
                                                                    <Button
                                                                        disabled={uploadingResult}
                                                                        className="w-full bg-india-green hover:bg-india-green text-white"
                                                                    >
                                                                        {uploadingResult ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                                                                        Upload Final Result
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Removed inline ChatBox */}
                                    </div>

                                    {/* Right Column: Info & Status */}
                                    <div className="space-y-6">
                                        <Card>
                                            <CardContent className="pt-6 space-y-4">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" /> Created</span>
                                                    <span className="font-medium font-mono">{new Date(request._creationTime).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground flex items-center gap-2"><Building2 className="h-4 w-4" /> Department</span>
                                                    <span className="font-medium text-right">{request.service?.department}</span>
                                                </div>
                                                <Separator />
                                                <div className="space-y-2">
                                                    <p className="text-xs font-bold uppercase text-muted-foreground">Customer</p>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                                                            {request.customer?.name?.[0]}
                                                        </div>
                                                        <div className="text-sm">
                                                            <p className="font-semibold">{request.customer?.name}</p>
                                                            <p className="text-muted-foreground text-xs">{request.customer?.phone || request.customer?.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {request.shopOwner && (
                                                    <div className="space-y-2 mt-4">
                                                        <p className="text-xs font-bold uppercase text-muted-foreground">Assigned Partner</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                                {request.shopOwner?.name?.[0]}
                                                            </div>
                                                            <div className="text-sm">
                                                                <p className="font-semibold">{request.shopOwner?.name}</p>
                                                                <p className="text-muted-foreground text-xs">{request.shopOwner?.email}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Help & Safety */}
                                        <div className="space-y-4">
                                            <Card className="bg-red-50 border-red-200">
                                                <CardContent className="pt-6">
                                                    <div className="flex gap-3">
                                                        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                                                        <div>
                                                            <h4 className="text-xs font-black uppercase text-red-900 tracking-widest mb-1">Service Disclaimer</h4>
                                                            <p className="text-[10px] leading-relaxed text-red-800 font-bold italic">
                                                                Applications are processed and submitted to the government. E-Hub is NOT responsible for rejection by govt authorities. In case of rejection, the service fee is non-refundable as it covers the processing work.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-slate-900 text-white border-none shadow-2xl overflow-hidden relative group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform pointer-events-none">
                                                    <Shield className="h-20 w-20" />
                                                </div>
                                                <CardContent className="pt-8 pb-8 relative z-10">
                                                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 border border-primary/30">
                                                        <Shield className="h-6 w-6 text-primary animate-pulse" />
                                                    </div>
                                                    <h3 className="text-xl font-black mb-3">Secure Processing</h3>
                                                    <p className="text-sm text-slate-400 font-bold leading-relaxed">
                                                        E-Hub Services ensures your sensitive documents are handled with military-grade encryption and only accessible by verified partners.
                                                    </p>
                                                </CardContent>
                                            </Card>

                                            <Card className="bg-white border-slate-200 group">
                                                <CardContent className="pt-6">
                                                    <h3 className="font-heading text-lg font-bold mb-2">Need Help?</h3>
                                                    <p className="text-slate-500 text-sm mb-4 font-medium">Our support team is available from 9 AM to 6 PM for any clarifications.</p>
                                                    <Button variant="outline" className="w-full border-slate-200 hover:bg-slate-50 font-bold">
                                                        Contact Support
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                    {/* Floating Chat UI */}
                    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
                        {isChatOpen && (
                            <div className="w-[350px] shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
                                <ChatBox
                                    serviceRequestId={request._id}
                                    currentUserRole={user.role as "customer" | "shop_owner"}
                                />
                            </div>
                        )}

                        <Button
                            size="icon"
                            className={cn(
                                "h-14 w-14 rounded-full shadow-2xl transition-all active:scale-90 relative",
                                isChatOpen ? "bg-slate-900 hover:bg-slate-800" : "bg-primary hover:bg-primary/90"
                            )}
                            onClick={() => setIsChatOpen(!isChatOpen)}
                        >
                            {isChatOpen ? (
                                <X className="h-6 w-6 text-white" />
                            ) : (
                                <MessageSquare className="h-6 w-6 text-white" />
                            )}

                            {/* Unread Dot */}
                            {!isChatOpen && unreadCount && unreadCount > 0 ? (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-bounce">
                                    {unreadCount}
                                </span>
                            ) : null}
                        </Button>
                    </div>

                    {/* Signing Modal */}
                    <PdfSignatureEditor
                        open={isSigninOpen}
                        onOpenChange={setIsSigninOpen}
                        pdfUrl={unsignedFileUrl || ""}
                        onSignComplete={handleSignComplete}
                        isSubmitting={isSigning}
                    />
                </div>
            </Authenticated>
        </>
    );
};

export default RequestDetail;
