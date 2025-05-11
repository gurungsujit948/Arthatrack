import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { SpendingInsight } from '../../lib/aiAnalytics';

interface AIInsightsProps {
  insights: SpendingInsight[];
  isLoading?: boolean;
}

const AIInsights: React.FC<AIInsightsProps> = ({ insights, isLoading = false }) => {
  const getIcon = (type: SpendingInsight['type'], trend?: SpendingInsight['trend']) => {
    if (trend === 'up') return <TrendingUp className="w-5 h-5" />;
    if (trend === 'down') return <TrendingDown className="w-5 h-5" />;
    
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return null;
    }
  };
  
  const getTypeStyles = (type: SpendingInsight['type']) => {
    switch (type) {
      case 'warning':
        return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>AI Insights</span>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-500 border-t-transparent" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {insights.length > 0 ? (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`p-4 rounded-lg ${getTypeStyles(insight.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(insight.type, insight.trend)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{insight.message}</p>
                    {insight.value && (
                      <p className="text-sm opacity-75 mt-1">
                        Impact: {insight.value.toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <p>No insights available yet. Add more transactions to get personalized recommendations.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsights;