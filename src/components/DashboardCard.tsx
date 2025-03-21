import React from 'react';
import { motion } from 'framer-motion';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

const DashboardCard = ({ title, value, icon, color, delay = 0 }: DashboardCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="tribunal-card flex items-start gap-4"
    >
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
      <div>
        <h3 className="text-gray-500 font-medium">{title}</h3>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </motion.div>
  );
};

export default DashboardCard;