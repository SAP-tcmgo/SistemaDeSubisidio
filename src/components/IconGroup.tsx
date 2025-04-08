import React from 'react';
import { cn } from "@/components/ui/lib/utils";
import GlowIcon from '@/components/GlowIcon';
import { LucideIcon } from 'lucide-react';

interface IconItem {
  icon: LucideIcon;
  label?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

interface IconGroupProps {
  icons: IconItem[];
  className?: string;
  size?: number;
}

const IconGroup: React.FC<IconGroupProps> = ({ icons, className, size }) => {
  return (
    <div className={cn("flex justify-end gap-4", className)}>
      {icons.map((item, index) => (
        <GlowIcon
          key={index}
          icon={item.icon}
          label={item.label}
          onClick={item.onClick}
          variant={item.variant || (index % 2 === 0 ? 'primary' : 'secondary')}
          size={size}
        />
      ))}
    </div>
  );
};

export default IconGroup;
