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

// A blocked/never-resolving <script> load (ad blocker, a restrictive
// network, or an insecure non-localhost origin some browsers silently
// degrade payment UI on) used to hang openRazorpayCheckout's caller forever
// with zero feedback — the button just stayed disabled, no error, nothing
// visibly wrong. This timeout turns that into a real, catchable error.
const SCRIPT_LOAD_TIMEOUT_MS = 15_000;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay checkout is only available in the browser"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Razorpay checkout didn't load in time. Check your connection and try again."));
      }, SCRIPT_LOAD_TIMEOUT_MS);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        clearTimeout(timeoutId);
        resolve();
      };
      script.onerror = () => {
        clearTimeout(timeoutId);
        reject(new Error("Failed to load Razorpay checkout script"));
      };
      document.body.appendChild(script);
    });
    // Reset on failure so the next attempt retries the script load instead
    // of replaying this same rejected promise forever. A separate .catch
    // (rather than chaining) keeps scriptPromise's own type as the original
    // promise, so a caller's rejection isn't masked by this bookkeeping.
    scriptPromise.catch(() => {
      scriptPromise = null;
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
