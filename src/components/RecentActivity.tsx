import React from 'react';
import { motion } from 'framer-motion';

interface Activity {
  id: number;
  title: string;
  description: string;
  date: string;
  type: 'analise' | 'projeto' | 'configuracao';
}

const activities: Activity[] = [
  {
    id: 1,
    title: 'Nova análise criada',
    description: 'Análise de Contas Municipais 2023',
    date: 'Hoje, 10:30',
    type: 'analise',
  },
  {
    id: 2,
    title: 'Projeto atualizado',
    description: 'Auditoria Operacional',
    date: 'Ontem, 14:25',
    type: 'projeto',
  },
  {
    id: 3,
    title: 'Configuração alterada',
    description: 'Parâmetros de sistema',
    date: '23/06/2023, 09:15',
    type: 'configuracao',
  },
];

const getTypeColor = (type: Activity['type']) => {
  switch (type) {
    case 'analise':
      return 'bg-tribunal-blue';
    case 'projeto':
      return 'bg-tribunal-gold';
    case 'configuracao':
      return 'bg-gray-500';
    default:
      return 'bg-gray-500';
  }
};

const RecentActivity = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="tribunal-card"
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">Atividades Recentes</h2>
        <button className="text-tribunal-blue hover:bg-blue-500 text-sm font-medium">
          Ver todas
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex gap-4 items-start">
            <div 
              className={`${getTypeColor(activity.type)} w-2 h-2 mt-2 rounded-full`}
            />
            <div className="flex-1">
              <h3 className="font-medium text-gray-800">{activity.title}</h3>
              <p className="text-sm text-gray-500">{activity.description}</p>
            </div>
            <span className="text-xs text-gray-400">{activity.date}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default RecentActivity;
