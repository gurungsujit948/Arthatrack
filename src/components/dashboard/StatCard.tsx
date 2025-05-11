import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: number;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  change, 
  className = '' 
}) => {
  const hasChange = change !== undefined;
  const isPositive = change && change > 0;
  
  return (
    <Card className={`overflow-hidden transform transition-all duration-300 hover:scale-105 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-md text-primary-600 dark:text-primary-400">
            {icon}
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {value}
          </h3>
          {hasChange && (
            <div className="flex items-center mt-2">
              <div 
                className={`flex items-center text-sm font-medium ${
                  isPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                }`}
              >
                {isPositive ? (
                  <ArrowUp size={16} className="mr-1" />
                ) : (
                  <ArrowDown size={16} className="mr-1" />
                )}
                <span>{Math.abs(change)}%</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                from last month
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;