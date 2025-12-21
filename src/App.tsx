import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Services from "./pages/Services";
import CustomerDashboard from "./pages/CustomerDashboard";
import ShopOwnerDashboard from "./pages/ShopOwnerDashboard";
import ServiceDetail from "./pages/ServiceDetail";
import RequestDetail from "./pages/RequestDetail";
import ManageServices from "./pages/ManageServices";
import Analytics from "./pages/Analytics";
import EsignDashboard from "./pages/EsignDashboard";
import EsignEditor from "./pages/EsignEditor";
import EsignView from "./pages/EsignView";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import NotificationTracker from "./components/shared/NotificationTracker";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <NotificationTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/services" element={<Services />} />
          <Route path="/service/:serviceId" element={<ServiceDetail />} />
          <Route path="/request/:requestId" element={<RequestDetail />} />
          <Route path="/dashboard" element={<CustomerDashboard />} />
          <Route path="/dashboard/owner" element={<ShopOwnerDashboard />} />
          <Route path="/manage-services" element={<ManageServices />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/esign" element={<EsignDashboard />} />
          <Route path="/esign/editor/:requestId" element={<EsignEditor />} />
          <Route path="/esign/view/:requestId" element={<EsignView />} />
          <Route path="/profile" element={<Profile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
