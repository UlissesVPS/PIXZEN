import { toast as sonnerToast } from "sonner";

// Unified toast system - delegates to sonner for consistent rendering
// Maintains the same API as shadcn-ui use-toast for backward compatibility

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
  [key: string]: any;
}

function toast(options: ToastOptions | string) {
  if (typeof options === "string") {
    sonnerToast(options);
    return { id: "", dismiss: () => {}, update: () => {} };
  }

  const { title, description, variant, duration, ...rest } = options;
  const message = title || description || "";
  const desc = title && description ? description : undefined;

  if (variant === "destructive") {
    sonnerToast.error(message, { description: desc as string, duration });
  } else {
    sonnerToast(message, { description: desc as string, duration });
  }

  return {
    id: "",
    dismiss: () => sonnerToast.dismiss(),
    update: () => {},
  };
}

function useToast() {
  return {
    toast,
    toasts: [] as any[],
    dismiss: () => sonnerToast.dismiss(),
  };
}

export { useToast, toast };
