import React from 'react';
import { Check, X } from 'lucide-react';

interface VerificationIconProps {
  isValid: boolean;
}

const VerificationIcon: React.FC<VerificationIconProps> = ({ isValid }) => {
  if (isValid) {
    return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white"><Check size={16} /></div>;
  } else {
    return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"><X size={16} /></div>;
  }
};

export default VerificationIcon;