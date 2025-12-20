import { UserProfile } from "@clerk/clerk-react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Shield, User, Smartphone, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, Authenticated, Unauthenticated } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

const ProfilePage = () => {
    const user = useQuery(api.users.getProfile);
    const updateProfile = useMutation(api.users.updateProfile);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<"customer" | "shop_owner" | "authorized_signatory">("customer");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setPhone(user.phone || "");
            setRole(user.role as any || "customer");
        }
    }, [user]);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsSaving(true);
        try {
            await updateProfile({
                name: name,
                phone: phone,
                role: role
            });
            toast.success("Profile updated successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Unauthenticated>
                <Navigate to="/auth" replace />
            </Unauthenticated>

            <Authenticated>
                <div className="min-h-screen bg-slate-50 flex flex-col">
                    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                        <div className="container flex items-center justify-between h-20">
                            <div className="flex items-center gap-4">
                                <Link to="/dashboard">
                                    <Button variant="ghost" size="icon" className="rounded-xl">
                                        <ArrowLeft className="h-5 w-5 text-slate-600" />
                                    </Button>
                                </Link>
                                <div className="flex flex-col">
                                    <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">Manage Account</h1>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Profile & Security Settings</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                                    <Shield className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 py-10">
                        <div className="container max-w-5xl">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Sidebar Info */}
                                <aside className="w-full md:w-80 space-y-6">
                                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden group">
                                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                                        <div className="relative z-10 flex flex-col items-center text-center">
                                            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 mb-4 overflow-hidden">
                                                {user?.role === "shop_owner" ? (
                                                    <Shield className="h-10 w-10 text-primary" />
                                                ) : user?.role === "authorized_signatory" ? (
                                                    <Shield className="h-10 w-10 text-primary" />
                                                ) : (
                                                    <User className="h-10 w-10 text-primary" />
                                                )}
                                            </div>
                                            <h3 className="text-xl font-black text-slate-900 uppercase leading-none mb-1">{user?.name}</h3>
                                            <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-4">{user?.role?.replace('_', ' ')}</p>

                                            <div className="w-full h-px bg-slate-100 mb-6" />

                                            <div className="w-full space-y-4">
                                                <div className="flex flex-col gap-1 text-left">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Public Name</span>
                                                    {isEditing ? (
                                                        <Input
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            className="h-9 text-sm font-bold rounded-lg border-slate-200"
                                                        />
                                                    ) : (
                                                        <p className="text-sm font-bold text-slate-700">{user?.name}</p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-1 text-left">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Role</span>
                                                    {isEditing ? (
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {[
                                                                { id: 'customer', label: 'Customer' },
                                                                { id: 'shop_owner', label: 'Partner / Shop' },
                                                                { id: 'authorized_signatory', label: 'Official Signatory' }
                                                            ].map((r) => (
                                                                <button
                                                                    key={r.id}
                                                                    onClick={() => setRole(r.id as any)}
                                                                    className={`text-left px-3 py-2 rounded-lg border text-xs font-black uppercase transition-all ${role === r.id
                                                                        ? 'bg-slate-900 text-white border-slate-900'
                                                                        : 'bg-white text-slate-500 border-slate-200 hover:border-primary'
                                                                        }`}
                                                                >
                                                                    {r.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Shield className="h-4 w-4 text-primary" />
                                                            <p className="text-sm font-bold text-slate-700 uppercase">{user?.role?.replace('_', ' ')}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-1 text-left">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-Hub Contact</span>
                                                    {isEditing ? (
                                                        <div className="relative">
                                                            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                            <Input
                                                                value={phone}
                                                                onChange={(e) => setPhone(e.target.value)}
                                                                placeholder="Enter Mobile Number"
                                                                className="h-9 pl-9 text-sm font-bold rounded-lg border-slate-200"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <Smartphone className="h-4 w-4 text-slate-400" />
                                                            <p className="text-sm font-bold text-slate-700">{user?.phone || 'No mobile set'}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-2">
                                                    {isEditing ? (
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={handleSave}
                                                                disabled={isSaving}
                                                                className="flex-1 bg-primary hover:bg-primary text-slate-950 font-black uppercase text-[10px] h-9 rounded-lg"
                                                            >
                                                                {isSaving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                                                                Save
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setIsEditing(false)}
                                                                className="flex-1 border-slate-200 text-slate-500 font-black uppercase text-[10px] h-9 rounded-lg"
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            onClick={() => setIsEditing(true)}
                                                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] h-9 rounded-lg"
                                                        >
                                                            Update Profile Info
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="w-full h-px bg-slate-100 my-4" />

                                            <div className="w-full space-y-3">
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest">Account Status</span>
                                                    <span className="text-green-600 font-black uppercase">Active</span>
                                                </div>
                                                <div className="flex justify-between items-center text-[10px]">
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest">Verification</span>
                                                    <span className="text-primary font-black uppercase">Level 1</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </aside>

                                {/* Clerk Profile */}
                                <div className="flex-1 overflow-hidden">
                                    <div className="clerk-profile-wrapper bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
                                        <UserProfile
                                            appearance={{
                                                variables: {
                                                    colorPrimary: '#FF8000',
                                                    colorText: '#0f172a',
                                                    colorTextSecondary: '#475569',
                                                    borderRadius: '1rem',
                                                },
                                                elements: {
                                                    card: "shadow-none w-full border-none m-0 p-0",
                                                    navbar: "hidden", // We use our own header
                                                    headerTitle: "hidden",
                                                    headerSubtitle: "hidden",
                                                    scrollBox: "p-8",
                                                    pageScrollBox: "p-0",
                                                    profileSectionTitle: "text-xs font-black uppercase text-slate-900 mb-4",
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </Authenticated>
        </>
    );
};

export default ProfilePage;
