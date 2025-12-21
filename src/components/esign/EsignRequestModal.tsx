import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Upload, Shield, AlertCircle } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { formatSafeFileName } from "@/lib/utils";

interface EsignRequestModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const EsignRequestModal = ({ isOpen, onOpenChange }: EsignRequestModalProps) => {
    const user = useQuery(api.users.getProfile);
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const saveFileMetadata = useMutation(api.files.saveFileMetadata);
    const createEsignRequest = useMutation(api.esign.createEsignRequest);

    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        address: "",
        shopNumber: "",
        purpose: "",
        requireSignature: true,
        requireSeal: true,
        acceptedDeclaration: false,
    });

    // Pre-fill user details
    useState(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                name: user.name || "",
                mobile: user.phone || "",
            }));
        }
    });

    const handleUpload = async () => {
        if (!file) {
            toast.error("Please select a PDF document");
            return;
        }

        if (file.type !== "application/pdf") {
            toast.error("Only PDF files are allowed for e-Sign");
            return;
        }

        if (!formData.acceptedDeclaration) {
            toast.error("Please accept the declaration to proceed");
            return;
        }

        setIsLoading(true);

        try {
            // 1. Get upload URL
            const postUrl = await generateUploadUrl();

            // 2. Upload file
            const result = await fetch(postUrl, {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
            });

            if (!result.ok) throw new Error("Upload failed");
            const { storageId } = await result.json();

            // Save Metadata
            const safeName = formatSafeFileName(formData.name || user?.name || "user", "Esign_Document", file.name);
            await saveFileMetadata({
                storageId,
                originalName: safeName,
                fileType: file.type,
                fileSize: file.size,
            });

            // 3. Create request
            await createEsignRequest({
                details: {
                    name: formData.name,
                    mobile: formData.mobile,
                    address: formData.address,
                    shopNumber: formData.shopNumber || undefined,
                },
                documentFileId: storageId as Id<"_storage">,
                purpose: formData.purpose,
                requireSignature: formData.requireSignature,
                requireSeal: formData.requireSeal,
            });

            toast.success("e-Sign request submitted successfully!");
            onOpenChange(false);
            // Reset form
            setFile(null);
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit request. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                <DialogHeader className="p-6 bg-slate-900 text-white">
                    <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30">
                        <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black">Request Authorized e-Sign / e-Seal</DialogTitle>
                    <DialogDescription className="text-slate-400 font-medium pt-1">
                        Nalavariyam Authorized Endorsement. Not a Government DSC.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 bg-white space-y-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Full Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="rounded-xl border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Mobile Number</Label>
                            <Input
                                value={formData.mobile}
                                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                className="rounded-xl border-slate-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-500">Full Address</Label>
                        <Input
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            className="rounded-xl border-slate-200"
                        />
                    </div>

                    {user?.role === "shop_owner" && (
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500">Shop / Center Number</Label>
                            <Input
                                value={formData.shopNumber}
                                onChange={e => setFormData({ ...formData, shopNumber: e.target.value })}
                                placeholder="e.g. TN-CH-001"
                                className="rounded-xl border-slate-200"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-500">Purpose of Signing</Label>
                        <Textarea
                            value={formData.purpose}
                            onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                            placeholder="Explain why you need this document signed..."
                            className="rounded-xl border-slate-200 min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <Label className="text-xs font-black uppercase text-slate-900 block mb-2">Requirements</Label>
                        <div className="flex items-center gap-6">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="sig"
                                    checked={formData.requireSignature}
                                    onCheckedChange={v => setFormData({ ...formData, requireSignature: !!v })}
                                />
                                <label htmlFor="sig" className="text-sm font-bold text-slate-700">Need Signature</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="seal"
                                    checked={formData.requireSeal}
                                    onCheckedChange={v => setFormData({ ...formData, requireSeal: !!v })}
                                />
                                <label htmlFor="seal" className="text-sm font-bold text-slate-700">Need Seal</label>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-black uppercase text-slate-500">Upload PDF Document</Label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept="application/pdf"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                            />
                            <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center group-hover:border-primary transition-colors bg-slate-50">
                                {file ? (
                                    <div className="flex items-center justify-center gap-2 text-primary font-bold">
                                        <Shield className="h-5 w-5" /> {file.name}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Upload className="h-8 w-8 text-slate-300 mx-auto" />
                                        <p className="text-sm font-bold text-slate-500">Click or drag PDF to upload</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <Checkbox
                            id="declaration"
                            checked={formData.acceptedDeclaration}
                            onCheckedChange={v => setFormData({ ...formData, acceptedDeclaration: !!v })}
                            className="mt-1"
                        />
                        <label htmlFor="declaration" className="text-[11px] font-bold text-orange-900 leading-tight">
                            I hereby declare that the uploaded document is legitimate and the information provided is true.
                            I understand this is a Private Endorsement and not a Government Digital Signature.
                        </label>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="font-bold text-slate-500"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={isLoading}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-8 font-black uppercase tracking-tight rounded-xl shadow-xl active:scale-95 transition-all"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2 text-primary" />}
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
