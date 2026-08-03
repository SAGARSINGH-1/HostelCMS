import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster(props) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme}
      position="top-right"
      expand
      richColors
      closeButton
      toastOptions={{
        // Common styling for all toasts
        classNames: {
          toast:
            "group pointer-events-auto rounded-md border bg-popover text-popover-foreground shadow-lg " +
            "data-[type=success]:border-green-500/50 data-[type=success]:bg-green-500/10 " +
            "data-[type=error]:border-red-500/50 data-[type=error]:bg-red-500/10 " +
            "data-[type=warning]:border-yellow-500/50 data-[type=warning]:bg-yellow-500/10 " +
            "data-[type=info]:border-blue-500/50 data-[type=info]:bg-blue-500/10 " +
            "backdrop-blur supports-[backdrop-filter]:bg-opacity-90 " +
            "transition-all duration-300",
          title: "font-medium tracking-tight",
          description: "text-sm text-muted-foreground mt-0.5",
          actionButton:
            "inline-flex items-center rounded-md bg-primary text-primary-foreground px-2.5 py-1.5 text-xs " +
            "hover:opacity-90 transition",
          cancelButton:
            "inline-flex items-center rounded-md border px-2.5 py-1.5 text-xs hover:bg-accent transition",
          closeButton:
            "opacity-70 hover:opacity-100 transition focus-visible:outline-none",
        },
        duration: 3500,
      }}
      className="toaster group"
      style={{
        // Map shadcn CSS variables to Sonner shades
        "--normal-bg": "var(--popover)",
        "--normal-border": "var(--border)",
        "--normal-text": "var(--popover-foreground)",
        "--success-bg": "rgba(34,197,94,0.1)", // green-500/10
        "--error-bg": "rgba(239,68,68,0.1)",   // red-500/10
        "--warning-bg": "rgba(234,179,8,0.1)", // amber-500/10
        "--info-bg": "rgba(59,130,246,0.1)",   // blue-500/10
      }}
      {...props}
    />
  );
}
