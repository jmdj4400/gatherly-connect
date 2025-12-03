import * as React from "react"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "./button"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  showBack?: boolean;
  backTo?: string;
  actions?: React.ReactNode;
  sticky?: boolean;
}

export function PageHeader({
  title,
  description,
  showBack = false,
  backTo,
  actions,
  sticky = true,
  className,
  ...props
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={cn(
        "bg-card/95 backdrop-blur-xl border-b border-border/30 z-40",
        sticky && "sticky top-0",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleBack}
              className="shrink-0 -ml-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="text-xs text-muted-foreground truncate">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
