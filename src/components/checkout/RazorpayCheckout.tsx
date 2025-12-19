import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Service } from "@/data/services";
import {
  Smartphone,
  CreditCard,
  Building2,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Shield,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RazorpayCheckoutProps {
  service: Service;
  onSuccess: (data: { orderId: string; paymentId: string }) => void;
  onFailure: (error: string) => void;
  onCancel: () => void;
  apiPaymentAction?: () => Promise<any>;
}

type PaymentMethod = "upi" | "card" | "netbanking";

const RazorpayCheckout = ({ service, onSuccess, onFailure, onCancel, apiPaymentAction }: RazorpayCheckoutProps) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const banks = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Canara Bank",
  ];

  const handlePayment = async () => {
    // Validation
    if (paymentMethod === "upi" && !upiId) {
      toast.error("Please enter your UPI ID");
      return;
    }
    if (paymentMethod === "card" && (!cardNumber || !cardExpiry || !cardCvv || !cardName)) {
      toast.error("Please fill all card details");
      return;
    }
    if (paymentMethod === "netbanking" && !selectedBank) {
      toast.error("Please select a bank");
      return;
    }

    setIsProcessing(true);

    try {
      if (apiPaymentAction) {
        const result = await apiPaymentAction();
        // Assuming result matches expectation or just pass it
        toast.success("Payment successful!");
        onSuccess({
          orderId: result.requestId || `order_${Date.now()}`,
          paymentId: result.paymentId || `pay_${Date.now()}`
        });
      } else {
        // Fallback simulation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockPaymentData = {
          orderId: `order_${Date.now()}`,
          paymentId: `pay_${Date.now()}`,
        };
        toast.success("Payment successful!");
        onSuccess(mockPaymentData);
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || error.toString() || "Payment failed. Please try again.";
      toast.error(errorMessage);
      onFailure(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </button>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Secure Checkout
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: "upi" as const, icon: Smartphone, label: "UPI" },
          { id: "card" as const, icon: CreditCard, label: "Card" },
          { id: "netbanking" as const, icon: Building2, label: "NetBanking" },
        ].map((method) => (
          <button
            key={method.id}
            onClick={() => setPaymentMethod(method.id)}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-lg border-2",
              paymentMethod === method.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary"
            )}
          >
            <method.icon className={cn(
              "h-5 w-5",
              paymentMethod === method.id ? "text-primary" : "text-muted-foreground"
            )} />
            <span className={cn(
              "text-xs font-medium",
              paymentMethod === method.id ? "text-primary" : "text-muted-foreground"
            )}>
              {method.label}
            </span>
          </button>
        ))}
      </div>

      <Separator />

      {/* Payment Forms */}
      <div className="min-h-[180px]">
        {paymentMethod === "upi" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="upi-id">UPI ID</Label>
              <Input
                id="upi-id"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Example: name@paytm, name@ybl, 9876543210@upi
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["@paytm", "@ybl", "@oksbi", "@okaxis"].map((suffix) => (
                <button
                  key={suffix}
                  onClick={() => setUpiId(upiId.split("@")[0] + suffix)}
                  className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted-foreground/20"
                >
                  {suffix}
                </button>
              ))}
            </div>
          </div>
        )}

        {paymentMethod === "card" && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                maxLength={19}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="card-name">Name on Card</Label>
              <Input
                id="card-name"
                placeholder="John Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="card-expiry">Expiry</Label>
                <Input
                  id="card-expiry"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  maxLength={5}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="card-cvv">CVV</Label>
                <Input
                  id="card-cvv"
                  type="password"
                  placeholder="•••"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  maxLength={4}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}

        {paymentMethod === "netbanking" && (
          <div className="space-y-3">
            <Label>Select Bank</Label>
            <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto">
              {banks.map((bank) => (
                <button
                  key={bank}
                  onClick={() => setSelectedBank(bank)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border text-left text-sm",
                    selectedBank === bank
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary"
                  )}
                >
                  {selectedBank === bank && (
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                  <span className="truncate">{bank}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Pay Button */}
      <Button
        variant="hero"
        size="lg"
        className="w-full"
        onClick={handlePayment}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>Pay ₹{service.price}</>
        )}
      </Button>

      {/* Security Note */}
      <div className="flex items-center justify-center gap-3 py-3 px-4 bg-slate-900 rounded-xl shadow-inner mb-2">
        <Shield className="h-4 w-4 text-india-green animate-pulse" />
        <span className="text-[10px] font-black text-white uppercase tracking-widest">
          256-bit SSL Encrypted Secure Gateway
        </span>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-center text-muted-foreground">
        By proceeding, you agree to our Terms of Service. This is a demo checkout -
        no real payment will be processed.
      </p>
    </div>
  );
};

export default RazorpayCheckout;
