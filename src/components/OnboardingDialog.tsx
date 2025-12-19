import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Smartphone, User, Loader2, CheckCircle2 } from "lucide-react";

export const OnboardingDialog = () => {
    const user = useQuery(api.users.getProfile);
    const updateProfile = useMutation(api.users.updateProfile);

    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Show dialog if user is logged in but missing phone number
        if (user && !user.phone) {
            setIsOpen(true);
            setName(user.name || "");
        } else {
            setIsOpen(false);
        }
    }, [user]);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Please enter your full name");
            return;
        }
        if (!phone.trim() || phone.length < 10) {
            toast.error("Please enter a valid 10-digit mobile number");
            return;
        }

        setIsSaving(true);
        try {
            await updateProfile({
                name: name,
                phone: phone,
                role: user?.role as any || "customer"
            });
            toast.success("Welcome to E-Hub! Your profile is now ready.");
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save profile. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="p-8 bg-slate-900 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 border border-primary/30 shadow-lg shadow-primary/10">
                        <CheckCircle2 className="h-7 w-7 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Complete Your Profile</DialogTitle>
                    <DialogDescription className="text-slate-400 font-bold tracking-wide uppercase text-[10px] pt-1">
                        Final step to access Nalavariyam e-Sevai services
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 bg-white space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                                <User className="h-3 w-4" /> Full Name
                            </Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your full name"
                                className="h-12 rounded-xl border-slate-200 focus:ring-primary font-bold px-4"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                                <Smartphone className="h-3 w-4" /> Mobile Number
                            </Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">+91</span>
                                <Input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                    placeholder="9876543210"
                                    className="h-12 pl-12 rounded-xl border-slate-200 focus:ring-primary font-bold"
                                />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 pl-1 uppercase">For payment & service updates</p>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3">
                        <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold text-slate-600 leading-tight">
                            Your data is encrypted and used only for official service communication. We never share your contact details.
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white h-12 font-black uppercase tracking-tight rounded-xl shadow-xl shadow-slate-200 active:scale-[0.98] transition-all"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Complete Onboarding"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
