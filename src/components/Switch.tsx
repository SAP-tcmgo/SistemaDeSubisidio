import React from 'react';
import { Switch as ShadcnSwitch } from '@/components/ui/switch';

interface SwitchProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, label }) => {
  return (
    <div className="flex items-center space-x-2">
      <ShadcnSwitch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="tcmgo-switch"
      >
        <span className="tcmgo-switch-thumb" />
      </ShadcnSwitch>
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
};

export default Switch;
