import React from 'react';
import Icon from '../../../components/AppIcon';

const SummaryCard = ({ title, count, trend, label, icon, color }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 h-full flex flex-col relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
                <Icon name={icon} size={64} className={color.replace('bg-', 'text-')} />
            </div>

            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-lg ${color} text-white shadow-sm`}>
                    <Icon name={icon} size={20} />
                </div>
                <h4 className="text-gray-500 dark:text-gray-300 text-sm font-medium">{title}</h4>
            </div>

            <div className="mt-auto">
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{count}</span>
                    {trend && (
                        <span className={`text-xs font-bold ${trend > 0 || trend === 'Activo' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                            {trend > 0 ? '+' : ''}{trend}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
            </div>
        </div>
    );
};

export default SummaryCard;
