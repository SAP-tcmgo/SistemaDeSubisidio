import React from 'react';
import { cn } from "@/components/ui/lib/utils";
import { LucideIcon } from 'lucide-react';

interface GlowIconProps {
  icon: LucideIcon;
  label?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: number;
}

const GlowIcon: React.FC<GlowIconProps> = ({
  icon: Icon,
  label,
  onClick,
  className,
  variant = 'primary',
  size = 20
}) => {
  const variantClasses = {
    primary: "text-[#004B8D] hover:text-[#004B8D]/80",
    secondary: "text-[#C9991F] hover:text-[#C9991F]/80"
  };

  return (
    <div
      className="flex flex-col items-center gap-2 hover-pulse transition-all duration-300"
      onClick={onClick}
    >
      <div
        className={cn(
          "glass-icon icon-glow flex items-center justify-center p-3 w-12 h-12",
          variantClasses[variant],
          className
        )}
      >
        <Icon size={size} className="mr-[-15px] transition-transform duration-300 ease-in-out" />
      </div>
      {label && (
        <span className="mt-[-15px] mr-[-15px] text-xs font-medium text-muted-foreground">{label}</span>
      )}
    </div>
  );
};

export default GlowIcon;
