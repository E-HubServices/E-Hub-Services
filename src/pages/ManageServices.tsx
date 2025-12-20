import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, useMutation, Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Plus,
    Trash2,
    Edit,
    ArrowLeft,
    Loader2,
    LayoutDashboard,
    Search,
    CheckCircle2,
    X,
    FileText,
    IndianRupee,
    Clock,
    Building2,
    ChevronDown,
    Database
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ManageServices = () => {
    const user = useQuery(api.users.getProfile);
    const categories = useQuery(api.services.getCategories);
    const services = useQuery(api.services.getManageableServices);

    const createService = useMutation(api.services.createService);
    const updateService = useMutation(api.services.updateService);
    const deleteService = useMutation(api.services.deleteService);
    const seedServices = useMutation(api.services.seedServices);

    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        categoryId: "" as Id<"service_categories">,
        department: "",
        serviceCode: "",
        price: 0,
        processingTime: "",
        requiredDocuments: [] as string[],
        isActive: true,
    });
    const [isSeeding, setIsSeeding] = useState(false);

    const [newDoc, setNewDoc] = useState("");

    if (user && user.role !== "shop_owner") {
        return <Navigate to="/dashboard" replace />;
    }

    const handleSeed = async () => {
        setIsSeeding(true);
        try {
            await seedServices();
            toast.success("Default services seeded successfully!");
        } catch (error) {
            toast.error("Failed to seed services");
        } finally {
            setIsSeeding(false);
        }
    };

    const handleOpenModal = (service: any = null) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                description: service.description,
                categoryId: service.categoryId,
                department: service.department,
                serviceCode: service.serviceCode,
                price: service.price,
                processingTime: service.processingTime,
                requiredDocuments: service.requiredDocuments,
                isActive: service.isActive ?? true,
            });
        } else {
            setEditingService(null);
            setFormData({
                name: "",
                description: "",
                // Default to first category if available, else empty string
                categoryId: categories && categories.length > 0 ? categories[0]._id : "" as Id<"service_categories">,
                department: "",
                serviceCode: "",
                price: 0,
                processingTime: "",
                requiredDocuments: [],
                isActive: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.categoryId || !formData.serviceCode) {
            toast.error("Please fill in all required fields (Name, Category, Code)");
            return;
        }

        try {
            if (editingService) {
                await updateService({
                    serviceId: editingService._id,
                    ...formData,
                });
                toast.success("Service updated successfully");
            } else {
                await createService(formData);
                toast.success("Service created successfully");
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to save service");
        }
    };

    const filteredServices = services?.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.serviceCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <Unauthenticated>
                <Navigate to="/auth" replace />
            </Unauthenticated>
            <Authenticated>
                <div className="min-h-screen bg-slate-50 flex flex-col">
                    {/* Header */}
                    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                        <div className="container flex items-center justify-between h-16">
                            <Link to="/shop-dashboard" className="flex items-center gap-2">
                                <img src="/logo.png" alt="E-Hub Logo" className="h-10 w-10 object-contain rounded-lg shadow-md bg-white border border-slate-100" />
                                <span className="font-heading text-lg font-bold text-slate-900 tracking-tight">Manage Services</span>
                            </Link>
                            <Link to="/shop-dashboard">
                                <Button variant="ghost" size="sm" className="font-bold text-slate-700">
                                    <LayoutDashboard className="h-4 w-4 mr-2" /> Back to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </header>

                    <main className="flex-1 py-8 container">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-white border-b border-slate-100 rounded-b-[40px] shadow-sm mb-10">
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Service Catalog</h1>
                                <p className="text-slate-500 font-bold flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-india-green" />
                                    Manage and optimize your government service offerings
                                </p>
                            </div>
                            <div className="flex gap-3">
                                {categories && categories.length === 0 && (
                                    <Button
                                        onClick={handleSeed}
                                        disabled={isSeeding}
                                        className="bg-orange-100 hover:bg-orange-200 text-orange-700 font-black uppercase text-xs tracking-widest px-6 h-14 rounded-2xl shadow-none hover:shadow-lg transition-all"
                                    >
                                        {isSeeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}
                                        Seed Defaults
                                    </Button>
                                )}
                                <Button onClick={() => handleOpenModal()} className="bg-primary hover:bg-primary text-white font-black uppercase text-xs tracking-widest px-8 h-14 rounded-2xl shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95 transition-all">
                                    <Plus className="h-5 w-5 mr-3" /> Add New Service
                                </Button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Search by name or service code..."
                                className="pl-12 h-14 bg-white border-slate-200 shadow-sm rounded-2xl font-bold"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Results */}
                        {!services ? (
                            <div className="flex justify-center p-12"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                        ) : filteredServices?.length === 0 ? (
                            <Card className="p-12 text-center border-dashed">
                                <p className="text-slate-400 font-bold text-lg">No services found matching your search.</p>
                            </Card>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredServices?.map(service => (
                                    <Card key={service._id} className="group overflow-hidden border-slate-200 hover:shadow-2xl transition-all hover:-translate-y-1">
                                        <CardHeader className="pb-3">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline" className={`font-mono text-[10px] ${service.isActive ? "text-slate-500" : "text-red-500 border-red-200 bg-red-50"}`}>
                                                    {service.serviceCode} {service.isActive === false && "(INACTIVE)"}
                                                </Badge>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => handleOpenModal(service)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteService({ serviceId: service._id })}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardTitle className="text-xl font-bold text-slate-900 mt-2">{service.name}</CardTitle>
                                            <CardDescription className="line-clamp-2 min-h-[2.5rem] font-medium text-slate-500">
                                                {service.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <IndianRupee className="h-4 w-4 text-green-700 font-bold" />
                                                    <span className="text-lg font-black text-slate-900">₹{service.price}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-600 text-xs font-black uppercase">
                                                    <Clock className="h-4 w-4 text-primary" />
                                                    {service.processingTime}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                                <span className="text-xs font-bold text-slate-700">{service.category}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </main>

                    {/* Create/Edit Modal */}
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogContent className="sm:max-w-[600px] bg-white rounded-3xl p-6">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-slate-900">
                                    {editingService ? "Edit Service" : "Create New Service"}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Service Name</label>
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Birth Certificate"
                                        className="font-bold border-slate-200"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Description</label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Short description of the service..."
                                        className="font-bold border-slate-200 resize-none h-20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Category</label>
                                    <Select
                                        value={formData.categoryId}
                                        onValueChange={val => setFormData({ ...formData, categoryId: val as any })}
                                    >
                                        <SelectTrigger className="font-bold border-slate-200">
                                            <SelectValue placeholder="Select Category" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white rounded-xl shadow-xl">
                                            {categories?.map(c => (
                                                <SelectItem key={c._id} value={c._id} className="font-bold cursor-pointer hover:bg-slate-50">
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Department</label>
                                    <Input
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="Revenue Dept"
                                        className="font-bold border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Service Code</label>
                                    <Input
                                        value={formData.serviceCode}
                                        onChange={e => setFormData({ ...formData, serviceCode: e.target.value })}
                                        placeholder="REV001"
                                        className="font-bold border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Price (₹)</label>
                                    <Input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="font-bold border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Proc. Time</label>
                                    <Input
                                        value={formData.processingTime}
                                        onChange={e => setFormData({ ...formData, processingTime: e.target.value })}
                                        placeholder="2-3 Days"
                                        className="font-bold border-slate-200"
                                    />
                                </div>

                                <div className="col-span-2 space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Required Documents</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newDoc}
                                            onChange={e => setNewDoc(e.target.value)}
                                            placeholder="Add a document name..."
                                            className="font-bold border-slate-200"
                                            onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), newDoc && setFormData({ ...formData, requiredDocuments: [...formData.requiredDocuments, newDoc] }), setNewDoc(""))}
                                        />
                                        <Button onClick={() => {
                                            if (newDoc) {
                                                setFormData({ ...formData, requiredDocuments: [...formData.requiredDocuments, newDoc] });
                                                setNewDoc("");
                                            }
                                        }} className="bg-primary hover:bg-primary font-bold">Add</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-slate-50 border border-slate-100 rounded-lg">
                                        {formData.requiredDocuments.map((doc, i) => (
                                            <Badge key={i} className="bg-white text-slate-900 border-slate-200 gap-2 font-bold px-3 py-1">
                                                {doc}
                                                <X className="h-3 w-3 cursor-pointer hover:text-red-600" onClick={() => setFormData({ ...formData, requiredDocuments: formData.requiredDocuments.filter((_, idx) => idx !== i) })} />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Active Status</label>
                                    <div className="flex items-center gap-2 h-10">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-5 h-5 accent-primary"
                                        />
                                        <span className="text-sm font-bold text-slate-700">{formData.isActive ? "Active (Visible to users)" : "Inactive (Hidden)"}</span>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="pt-4">
                                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold">Cancel</Button>
                                <Button onClick={handleSave} className="bg-primary hover:bg-primary font-black uppercase text-xs tracking-widest shadow-xl">
                                    {editingService ? "Update Service" : "Create Service"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </Authenticated>
        </>
    );
};

export default ManageServices;
