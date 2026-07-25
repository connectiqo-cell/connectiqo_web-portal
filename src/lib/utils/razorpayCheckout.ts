// Web equivalent of connectfront/src/utils/razorpayCheckout.js — loads
// Razorpay's Checkout.js and opens the Standard Checkout modal, instead of
// the react-native-razorpay native module.

interface RazorpaySuccessResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailureResponse {
  error?: { code?: string; description?: string };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailureResponse) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is only available in the browser"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

export interface OpenRazorpayCheckoutOptions {
  keyId: string;
  amount: number;
  orderId: string;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string };
}

export async function openRazorpayCheckout(
  options: OpenRazorpayCheckoutOptions,
): Promise<RazorpaySuccessResponse> {
  await loadRazorpayScript();

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: options.keyId,
      amount: options.amount,
      currency: options.currency || "INR",
      name: options.name || "Connectiqo",
      description: options.description,
      order_id: options.orderId,
      prefill: options.prefill,
      theme: { color: "#5eead4" },
      handler: (response: RazorpaySuccessResponse) => resolve(response),
      modal: {
        ondismiss: () => {
          const cancelErr = Object.assign(new Error("Payment cancelled"), {
            code: "PAYMENT_CANCELLED",
          });
          reject(cancelErr);
        },
      },
    });

    rzp.on("payment.failed", (response) => {
      reject(
        Object.assign(
          new Error(response?.error?.description || "Payment failed. Please try again."),
          { code: response?.error?.code },
        ),
      );
    });

    rzp.open();
  });
}
