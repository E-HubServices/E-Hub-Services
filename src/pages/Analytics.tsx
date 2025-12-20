import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery, Authenticated } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    Download,
    TrendingUp,
    DollarSign,
    Users,
    FileText,
    Calendar,
    BarChart3,
    Loader2,
    Table as TableIcon,
    ChevronRight,
    CheckCircle2,
    Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Cell
} from "recharts";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { format } from "date-fns";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Analytics = () => {
    const user = useQuery(api.users.getProfile);
    const analytics = useQuery(api.analytics.getOwnerAnalytics);
    const [invoicePeriod, setInvoicePeriod] = useState<"weekly" | "monthly">("weekly");
    const invoiceData = useQuery(api.analytics.getInvoiceData, { period: invoicePeriod });

    if (user && user.role !== "shop_owner") {
        return <Navigate to="/dashboard" replace />;
    }

    const exportInvoice = () => {
        if (!invoiceData || invoiceData.length === 0) {
            toast.error("No data available to export");
            return;
        }

        const doc = new jsPDF();

        // Add PDF Header
        doc.setFontSize(22);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text("E-Hub Transaction Report", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Period: ${invoicePeriod.toUpperCase()}`, 14, 30);
        doc.text(`Generated on: ${format(new Date(), "PPpp")}`, 14, 35);

        const headers = [["Invoice ID", "Date", "Customer", "Service", "Amount (INR)"]];
        const data = invoiceData.map(inv => [
            inv.id.slice(-8).toUpperCase(),
            inv.date,
            inv.customer,
            inv.service,
            `Rs. ${inv.amount}`
        ]);

        autoTable(doc, {
            head: headers,
            body: data,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 45 },
            styles: { fontSize: 9, cellPadding: 5 }
        });

        // Add Footer
        const totalAmount = invoiceData.reduce((sum, inv) => sum + inv.amount, 0);
        const finalY = (doc as any).lastAutoTable.finalY + 10;

        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text(`Total Revenue: Rs. ${totalAmount.toLocaleString()}`, 14, finalY);

        doc.save(`EHUB_Invoice_${invoicePeriod}_${format(new Date(), "yyyyMMdd")}.pdf`);
        toast.success(`${invoicePeriod.charAt(0).toUpperCase() + invoicePeriod.slice(1)} invoice exported as PDF!`);
    };

    const statusColors = {
        pending: "#f59e0b",
        assigned: "#8b5cf6",
        in_progress: "#3b82f6",
        completed: "#10b981",
        cancelled: "#ef4444"
    };

    return (
        <Authenticated>
            <div className="min-h-screen bg-slate-50 flex flex-col">
                {/* Header */}
                <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
                    <div className="container flex items-center justify-between h-16">
                        <Link to="/dashboard/owner" className="flex items-center gap-2">
                            <img src="/logo.png" alt="E-Hub Logo" className="h-10 w-10 object-contain rounded-lg shadow-md bg-white border border-slate-100" />
                            <span className="font-heading text-lg font-bold text-slate-900 tracking-tight">Analytics & Insights</span>
                        </Link>
                        <Link to="/dashboard/owner">
                            <Button variant="ghost" size="sm" className="font-bold text-slate-700">
                                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                </header>

                <main className="flex-1 py-8 container">
                    {!analytics ? (
                        <div className="flex justify-center p-20"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
                    ) : (
                        <div className="space-y-8">
                            {/* Top Stats */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <Card className="border-none shadow-xl bg-white border-b-4 border-b-primary overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">
                                        <DollarSign className="h-24 w-24 text-primary" />
                                    </div>
                                    <CardContent className="pt-6">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Revenue</p>
                                        <h3 className="text-4xl font-black text-slate-900">₹{analytics.totalRevenue.toLocaleString()}</h3>
                                        <div className="mt-4 flex items-center gap-2 text-primary font-black text-sm">
                                            <TrendingUp className="h-4 w-4" />
                                            Recent: ₹{analytics.recentRevenue.toLocaleString()}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl bg-white overflow-hidden group">
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-blue-50 rounded-2xl">
                                                <FileText className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <Badge className="bg-blue-100 text-blue-700 border-none font-bold">LIFETIME</Badge>
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Requests</p>
                                        <h3 className="text-3xl font-black text-slate-900">{analytics.totalRequests}</h3>
                                        <p className="text-xs text-slate-500 font-bold mt-2">Services processed via Ehub</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl bg-white overflow-hidden group">
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-green-50 rounded-2xl">
                                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                            </div>
                                            <Badge className="bg-green-100 text-green-700 border-none font-bold">SUCCESS</Badge>
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Completed</p>
                                        <h3 className="text-3xl font-black text-slate-900">{analytics.statusCounts.completed}</h3>
                                        <p className="text-xs text-slate-500 font-bold mt-2">Successfully fulfilled services</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-xl bg-orange-600 text-white overflow-hidden group">
                                    <CardContent className="pt-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-white/10 rounded-2xl">
                                                <Clock className="h-6 w-6 text-white" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-orange-200 tracking-widest mb-1">Pending Action</p>
                                        <h3 className="text-3xl font-black">{analytics.statusCounts.pending + analytics.statusCounts.assigned}</h3>
                                        <p className="text-xs text-orange-100 font-bold mt-2">Requests awaiting fulfillment</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Charts Row */}
                            <div className="grid lg:grid-cols-3 gap-8">
                                {/* Request Performance (Line Chart) */}
                                <Card className="lg:col-span-2 border-slate-200 shadow-lg bg-white rounded-3xl overflow-hidden">
                                    <CardHeader className="bg-slate-50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-black text-slate-900">Request Performance</CardTitle>
                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-tighter">Daily volume for the last 7 days</p>
                                        </div>
                                        <BarChart3 className="h-6 w-6 text-primary" />
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="h-[300px] w-full mt-4">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={analytics.weeklyPerformance}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                    <XAxis
                                                        dataKey="date"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                                                        dy={10}
                                                    />
                                                    <YAxis
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                                                    />
                                                    <RechartsTooltip
                                                        cursor={{ fill: '#f8fafc' }}
                                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 900 }}
                                                    />
                                                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                                        {analytics.weeklyPerformance.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={index === analytics.weeklyPerformance.length - 1 ? "#F59E0B" : "#0F172A"}
                                                            />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Status Distribution (Vertical Bar Chart) */}
                                <Card className="border-slate-200 shadow-lg bg-white rounded-3xl overflow-hidden">
                                    <CardHeader className="bg-slate-50 border-b border-slate-100 p-6">
                                        <CardTitle className="text-xl font-black text-slate-900">Status Mix</CardTitle>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-tighter">Current workload distribution</p>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4 pt-4">
                                            {Object.entries(analytics.statusCounts).map(([status, count]) => (
                                                <div key={status} className="space-y-1.5">
                                                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                                                        <span>{status.replace('_', ' ')}</span>
                                                        <span>{count}</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000"
                                                            style={{
                                                                width: `${(count / analytics.totalRequests) * 100}%`,
                                                                backgroundColor: (statusColors as any)[status]
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Invoice Section */}
                            <Card className="border-slate-200 shadow-2xl bg-white rounded-3xl overflow-hidden">
                                <CardHeader className="bg-white border-b border-slate-100 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <CardTitle className="text-3xl font-black text-slate-900">Financial Invoices</CardTitle>
                                        <p className="text-slate-500 font-bold pt-1">Generate reports for your revenue tracking</p>
                                    </div>
                                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                                        <Button
                                            variant={invoicePeriod === "weekly" ? "default" : "ghost"}
                                            onClick={() => setInvoicePeriod("weekly")}
                                            className={cn("rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6 transition-all", invoicePeriod === "weekly" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:bg-white")}
                                        >
                                            Weekly
                                        </Button>
                                        <Button
                                            variant={invoicePeriod === "monthly" ? "default" : "ghost"}
                                            onClick={() => setInvoicePeriod("monthly")}
                                            className={cn("rounded-xl font-black uppercase text-[10px] tracking-widest h-10 px-6 transition-all", invoicePeriod === "monthly" ? "bg-primary text-white shadow-lg" : "text-slate-500 hover:bg-white")}
                                        >
                                            Monthly
                                        </Button>
                                        <div className="w-px h-6 bg-slate-200 mx-2" />
                                        <Button onClick={exportInvoice} className="bg-india-green hover:bg-india-green text-white font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl shadow-lg active:scale-95 transition-all">
                                            <Download className="h-4 w-4 mr-2" /> Export PDF
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow className="hover:bg-transparent border-slate-100">
                                                    <TableHead className="text-slate-900 font-black uppercase text-[10px] tracking-widest py-4">Transaction ID</TableHead>
                                                    <TableHead className="text-slate-900 font-black uppercase text-[10px] tracking-widest py-4">Date</TableHead>
                                                    <TableHead className="text-slate-900 font-black uppercase text-[10px] tracking-widest py-4">Customer</TableHead>
                                                    <TableHead className="text-slate-900 font-black uppercase text-[10px] tracking-widest py-4">Service</TableHead>
                                                    <TableHead className="text-right text-slate-900 font-black uppercase text-[10px] tracking-widest py-4">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {!invoiceData ? (
                                                    <TableRow><TableCell colSpan={5} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                                                ) : invoiceData.length === 0 ? (
                                                    <TableRow><TableCell colSpan={5} className="text-center py-12 font-bold text-slate-400">No transactions recorded for this period.</TableCell></TableRow>
                                                ) : (
                                                    invoiceData.map((inv) => (
                                                        <TableRow key={inv.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                            <TableCell className="font-mono text-[10px] font-bold text-slate-400">{inv.id}</TableCell>
                                                            <TableCell className="font-bold text-slate-700">{inv.date}</TableCell>
                                                            <TableCell className="font-black text-slate-900">{inv.customer}</TableCell>
                                                            <TableCell className="font-bold text-slate-600">{inv.service}</TableCell>
                                                            <TableCell className="text-right font-black text-slate-900">₹{inv.amount}</TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </main>
            </div>
        </Authenticated>
    );
};

export default Analytics;
