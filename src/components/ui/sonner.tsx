import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-200 group-[.toaster]:shadow-2xl rounded-2xl p-4 font-black border-2",
          description: "group-[.toast]:text-slate-500 font-bold",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-black",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-black",
          error: "group-[.toaster]:bg-red-50 group-[.toaster]:text-red-900 group-[.toaster]:border-red-200",
          success: "group-[.toaster]:bg-green-50 group-[.toaster]:text-green-900 group-[.toaster]:border-green-200",
          warning: "group-[.toaster]:bg-amber-50 group-[.toaster]:text-amber-900 group-[.toaster]:border-amber-200",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
