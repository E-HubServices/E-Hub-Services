import { useState } from "react";
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
  IndianRupee,
  FileText,
  CheckCircle2,
  Shield,
  Upload,
  CreditCard,
  Smartphone,
  Building2,
  ChevronRight,
  AlertCircle,
  Loader2,
  X,
  User,
  LogOut,
  Lock,
  Info,
  AlertTriangle
} from "lucide-react";
import RazorpayCheckout from "@/components/checkout/RazorpayCheckout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const ServiceDetail = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { signOut } = useClerk();
  const [showCheckout, setShowCheckout] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState<Record<string, Id<"_storage">>>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  const user = useQuery(api.users.getProfile);
  const service = useQuery(api.services.getServiceById, { serviceId: serviceId as Id<"services"> });

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const saveFileMetadata = useMutation(api.files.saveFileMetadata);
  const createAndVerifyPayment = useMutation((api.payments as any).mockCreateAndVerifyPayment);

  const handleLogout = async () => {
    await signOut({ redirectUrl: "/" });
  };

  const handleFileUpload = async (docName: string, file: File) => {
    // Basic validation (1MB limit as requested)
    if (file.size > 1024 * 1024) {
      toast.error("File size must be less than 1MB");
      return;
    }

    try {
      setUploadingFiles(prev => ({ ...prev, [docName]: true }));
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error(`Upload failed: ${result.statusText}`);

      const { storageId } = await result.json();

      await saveFileMetadata({
        storageId,
        originalName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      setUploadedFiles(prev => ({ ...prev, [docName]: storageId }));
      toast.success(`${docName} uploaded successfully`);

    } catch (error) {
      console.error("File upload error:", error);
      toast.error(`Failed to upload ${docName}`);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [docName]: false }));
    }
  };

  const handlePayment = async () => {
    const fileIds = Object.values(uploadedFiles);
    if (!service) return;

    const result = await createAndVerifyPayment({
      serviceId: service._id,
      inputFiles: fileIds,
    });

    return result;
  };

  const onPaymentSuccess = () => {
    navigate("/dashboard");
    toast.success("Request created successfully!");
  };

  const onPaymentFailure = (error: string) => {
    toast.error(error);
  };

  const allDocsUploaded = service?.requiredDocuments.every(doc => !!uploadedFiles[doc]);
  const missingDocsCount = service?.requiredDocuments.filter(doc => !uploadedFiles[doc]).length || 0;

  return (
    <>
      <Unauthenticated>
        <Navigate to="/auth" replace />
      </Unauthenticated>

      <AuthLoading>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
        </div>
      </AuthLoading>

      <Authenticated>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
            <div className="container flex items-center justify-between h-16">
              <Link to="/dashboard" className="flex items-center gap-2">
                <img src="/logo.png" alt="E-Hub Logo" className="h-10 w-10 object-contain rounded-lg shadow-md bg-white border border-slate-100" />
                <span className="font-heading text-lg font-bold text-slate-900 tracking-tight">E-Hub Services</span>
              </Link>

              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="hidden md:block">
                  <Button variant="ghost" size="sm" className="font-bold text-slate-700">
                    My Dashboard
                  </Button>
                </Link>
                <div className="h-8 w-px bg-slate-200 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-slate-900 hidden sm:block">{user?.name || 'User'}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-slate-500 hover:text-red-600 font-bold transition-colors">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 py-8">
            <div className="container">
              {!service ? (
                <div className="text-center py-12">
                  <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                  <p className="mt-4 text-slate-900 font-bold">Loading service details...</p>
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Left Column - Details */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <Link to="/services" className="inline-flex items-center text-sm font-bold text-primary hover:underline mb-4">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Services
                      </Link>
                      <div className="flex items-center gap-3 mb-4">
                        <Badge variant="outline" className="border-slate-300 text-slate-700 font-bold">{service.serviceCode}</Badge>
                        <Badge className="bg-slate-100 text-slate-800 border-none font-bold hover:bg-slate-200">{service.department}</Badge>
                      </div>
                      <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-900 mb-4">{service.name}</h1>
                      <p className="text-slate-700 text-lg leading-relaxed">{service.description}</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid sm:grid-cols-3 gap-4">
                      <Card className="bg-green-50 border-green-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white border border-green-200 flex items-center justify-center shadow-sm">
                            <IndianRupee className="h-6 w-6 text-green-700" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Service Fee</p>
                            <p className="font-bold text-2xl text-green-900">₹{service.price}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-orange-50 border-orange-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white border border-orange-200 flex items-center justify-center shadow-sm">
                            <Clock className="h-6 w-6 text-orange-700" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-orange-800 uppercase tracking-wider">Processing Time</p>
                            <p className="font-bold text-xl text-orange-900">{service.processingTime}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-blue-50 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white border border-blue-200 flex items-center justify-center shadow-sm">
                            <Building2 className="h-6 w-6 text-blue-700" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Department</p>
                            <p className="font-bold text-sm text-blue-900 truncate">{service.department}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Documents */}
                    <Card className="border-slate-200 shadow-lg overflow-hidden">
                      <CardHeader className="bg-slate-50 border-b border-slate-200 py-4">
                        <CardTitle className="flex items-center gap-2 text-slate-900 font-bold">
                          <FileText className="h-5 w-5 text-primary" /> Required Documents (Mandatory)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="p-4 bg-orange-100/50 border-b border-orange-200 flex items-start gap-4">
                          <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-black text-orange-900">CRITICAL UPLOAD INSTRUCTIONS:</p>
                            <ul className="text-xs text-orange-950 mt-1 list-disc list-inside space-y-1 font-bold">
                              <li>Format: PDF, JPEG, or PNG only</li>
                              <li>File size must be strictly less than 1MB</li>
                              <li>Use clear, bright lighting for photos - blurred documents will be rejected</li>
                              <li>Ensure all text is readable and corners are not cut off</li>
                            </ul>
                          </div>
                        </div>
                        <ul className="divide-y divide-slate-100">
                          {service.requiredDocuments.map((doc, i) => {
                            const isUploaded = !!uploadedFiles[doc];
                            return (
                              <li key={i} className="flex justify-between items-center p-5 bg-white group hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                  {isUploaded ? (
                                    <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center shadow-sm">
                                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    </div>
                                  ) : (
                                    <div className="h-6 w-6 rounded-full border-2 border-slate-300 group-hover:border-primary transition-colors" />
                                  )}
                                  <span className={cn("font-bold text-lg", isUploaded ? "text-slate-900" : "text-slate-500")}>{doc}</span>
                                </div>
                                {isUploaded ? (
                                  <Button variant="outline" size="sm" className="bg-slate-50 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => {
                                    const newFiles = { ...uploadedFiles };
                                    delete newFiles[doc];
                                    setUploadedFiles(newFiles);
                                  }}>
                                    <X className="h-4 w-4 mr-2" /> Remove
                                  </Button>
                                ) : (
                                  <div className="relative">
                                    <input
                                      type="file"
                                      className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                      onChange={(e) => e.target.files?.[0] && handleFileUpload(doc, e.target.files[0])}
                                      disabled={uploadingFiles[doc]}
                                      accept=".pdf,.jpg,.jpeg,.png"
                                    />
                                    <Button size="sm" variant="default" className="bg-primary hover:bg-primary font-bold shadow-md" disabled={uploadingFiles[doc]}>
                                      {uploadingFiles[doc] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                                      Upload Document
                                    </Button>
                                  </div>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Payment Sidebar */}
                  <div className="lg:col-span-1">
                    <Card className="sticky top-24 border-none shadow-2xl overflow-hidden rounded-2xl">
                      <div className="bg-slate-900 p-6 text-white text-center">
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-2">Total Amount</p>
                        <h2 className="text-5xl font-extrabold flex items-center justify-center gap-1">
                          <IndianRupee className="h-10 w-10 text-primary" />{service.price}
                        </h2>
                      </div>
                      <CardContent className="p-6 bg-white space-y-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-slate-600 font-bold">Service Fee</span>
                            <span className="text-slate-900 font-bold text-lg">₹{service.price}</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border border-green-100">
                            <span className="text-green-800 font-bold">Platform Handling</span>
                            <span className="text-green-700 font-extrabold text-sm border-2 border-green-200 px-2 py-0.5 rounded-lg">FREE</span>
                          </div>
                          <Separator className="bg-slate-100" />
                          <div className="flex justify-between text-2xl font-black text-slate-900 p-2">
                            <span>TOTAL</span>
                            <span>₹{service.price}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Liability Disclaimer</h4>
                            <div className="flex gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                              <p className="text-[10px] leading-tight text-slate-600 font-bold">
                                E-Hub is a service facilitator. We are NOT responsible if your application is rejected by the government department. Fees paid are for processing and are non-refundable in case of govt rejection.
                              </p>
                            </div>
                          </div>

                          {!allDocsUploaded && (
                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-xs font-bold text-orange-900 uppercase">Action Required</p>
                                <p className="text-xs text-orange-800 mt-0.5">Please upload the remaining <strong>{missingDocsCount} document(s)</strong> to proceed with payment.</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          className={cn(
                            "w-full h-14 text-xl font-black uppercase tracking-tight shadow-xl transition-all active:scale-95",
                            allDocsUploaded ? "bg-primary hover:bg-primary shadow-orange-200" : "bg-slate-200 text-slate-400 cursor-not-allowed"
                          )}
                          onClick={() => allDocsUploaded ? setShowCheckout(true) : toast.error("Please upload all documents first")}
                          disabled={!allDocsUploaded}
                        >
                          {allDocsUploaded ? "Pay & Submit Request" : "Upload Docs to Pay"}
                        </Button>

                        <div className="bg-slate-900 rounded-2xl p-6 space-y-4 shadow-xl">
                          <div className="flex items-center justify-center gap-3 text-sm font-black text-white uppercase tracking-widest">
                            <Shield className="h-5 w-5 text-india-green animate-pulse" />
                            AES-256 Bit Secure Connection
                          </div>
                          <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-800">
                            <Smartphone className="h-6 w-6 text-slate-400 hover:text-primary transition-colors" />
                            <CreditCard className="h-6 w-6 text-slate-400 hover:text-primary transition-colors" />
                            <Building2 className="h-6 w-6 text-slate-400 hover:text-primary transition-colors" />
                          </div>
                          <p className="text-[10px] text-center text-slate-500 font-bold leading-tight">
                            Your documents are encrypted and processed through govt-authorized gateways only.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </main>

          {/* Payment Modal */}
          <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
              <DialogHeader className="p-6 bg-slate-900 text-white">
                <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <DialogTitle className="text-2xl font-black">Secure Payment</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium pt-1">
                  Complete your payment for <strong>{service?.name}</strong>. Your documents are securely staged. By paying, you acknowledge that government processing fees are non-refundable even if the application is rejected.
                </DialogDescription>
              </DialogHeader>
              <div className="p-6 bg-white">
                {service && (
                  <RazorpayCheckout
                    service={{ ...service, id: service._id, code: service.serviceCode } as any}
                    onSuccess={onPaymentSuccess}
                    onFailure={onPaymentFailure}
                    onCancel={() => setShowCheckout(false)}
                    apiPaymentAction={handlePayment}
                  />
                )}
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
                <Shield className="h-4 w-4 text-india-green" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Trusted by e-Sevai Governance</span>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Authenticated>
    </>
  );
};

export default ServiceDetail;
