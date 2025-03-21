import React from 'react';
import DashboardCard from './DashboardCard';
import { FileText, BarChart2, Users, Clock } from 'lucide-react';

const StatsSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardCard
        title="Análises"
        value="125"
        icon={<FileText className="text-white" size={24} />}
        color="bg-tribunal-blue"
        delay={0.1}
      />
      <DashboardCard
        title="Projetos"
        value="42"
        icon={<BarChart2 className="text-white" size={24} />}
        color="bg-tribunal-gold"
        delay={0.2}
      />
      <DashboardCard
        title="Usuários"
        value="18"
        icon={<Users className="text-white" size={24} />}
        color="bg-tribunal-blue"
        delay={0.3}
      />
      <DashboardCard
        title="Pendentes"
        value="7"
        icon={<Clock className="text-white" size={24} />}
        color="bg-tribunal-gold"
        delay={0.4}
      />
    </div>
  );
};

export default StatsSection;
