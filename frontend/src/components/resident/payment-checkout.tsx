"use client";

import { useState, useEffect } from "react";
import { load } from "@cashfreepayments/cashfree-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { paymentsApi, PaymentRecord } from "@/lib/api/payments";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface PaymentCheckoutProps {
  orgId: string;
  payment: PaymentRecord;
}

export function PaymentCheckout({ orgId, payment }: PaymentCheckoutProps) {
  const queryClient = useQueryClient();
  const [cashfree, setCashfree] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [showInput, setShowInput] = useState(false);
  
  const pendingAmount = payment.amount - payment.amountPaid;
  const [amount, setAmount] = useState<string>(pendingAmount.toString());

  useEffect(() => {
    load({ mode: "sandbox" }).then((cf) => {
      setCashfree(cf);
    });
  }, []);

  const handlePay = async () => {
    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount < 1 || payAmount > pendingAmount) {
      toast.error(`Please enter an amount between ₹1 and ₹${pendingAmount}`);
      return;
    }

    if (!cashfree) {
      toast.error("Payment system is initializing, please wait");
      return;
    }

    setIsPaying(true);
    try {
      const { paymentSessionId, orderId } = await paymentsApi.checkout(orgId, payment.id, payAmount);
      
      const checkoutOptions = {
        paymentSessionId,
        redirectTarget: "_modal",
      };

      cashfree.checkout(checkoutOptions).then(async (result: any) => {
        if (result?.error) {
          toast.error("Payment failed or was cancelled");
          setIsPaying(false);
        } else {
          try {
            await paymentsApi.verifyPayment(orgId, payment.id, orderId);
            toast.success("Payment recorded successfully");
            await queryClient.invalidateQueries({ queryKey: ["dwellio", "payments"] });
            await queryClient.refetchQueries({ queryKey: ["dwellio", "payments"] });
          } catch (e: any) {
            toast.error("Payment completed, but verification failed. It will sync shortly.");
          } finally {
            setIsPaying(false);
            setShowInput(false);
          }
        }
      });
    } catch (e: any) {
      toast.error(e?.message || "Could not initiate checkout");
      setIsPaying(false);
    }
  };

  if (pendingAmount <= 0) return null;

  if (!showInput) {
    return (
      <Button size="sm" onClick={() => setShowInput(true)}>
        Pay Now
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2 mt-2">
      <Input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="1"
        max={pendingAmount}
        className="w-24 h-9"
      />
      <Button size="sm" onClick={handlePay} disabled={isPaying}>
        {isPaying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Proceed
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setShowInput(false)} disabled={isPaying}>
        Cancel
      </Button>
    </div>
  );
}
