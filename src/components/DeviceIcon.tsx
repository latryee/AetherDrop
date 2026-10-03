import React from 'react';
import type { DeviceType } from '../types/transfer';
import { Tablet, Smartphone, Laptop, Monitor, Terminal, HardDrive } from 'lucide-react';

interface DeviceIconProps {
  type: DeviceType;
  className?: string;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({ type, className = 'w-6 h-6' }) => {
  switch (type) {
    case 'ipad':
      return <Tablet className={`${className} text-indigo-400`} />;
    case 'iphone':
      return <Smartphone className={`${className} text-purple-400`} />;
    case 'android':
      return <Smartphone className={`${className} text-emerald-400`} />;
    case 'mac':
      return <Laptop className={`${className} text-sky-400`} />;
    case 'windows':
      return <Monitor className={`${className} text-blue-400`} />;
    case 'linux':
      return <Terminal className={`${className} text-amber-400`} />;
    case 'mobile':
      return <Smartphone className={`${className} text-teal-400`} />;
    case 'desktop':
    default:
      return <HardDrive className={`${className} text-slate-400`} />;
  }
};
