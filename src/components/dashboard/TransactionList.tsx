import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Transaction } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface TransactionListProps {
  transactions: Transaction[];
  limit?: number;
}

const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  limit = 5 
}) => {
  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };
  
  const limitedTransactions = transactions.slice(0, limit);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <motion.a 
          href="/transactions" 
          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          View all
        </motion.a>
      </CardHeader>
      <CardContent>
        <motion.div 
          className="divide-y divide-gray-200 dark:divide-gray-700"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {limitedTransactions.length > 0 ? (
            limitedTransactions.map((transaction) => (
              <motion.div 
                key={transaction.id} 
                className="py-3 flex items-center"
                variants={itemVariants}
                whileHover={{ scale: 1.02, x: 5 }}
              >
                <div className="flex-shrink-0 mr-3">
                  {transaction.type === 'income' ? (
                    <ArrowUpCircle className="h-8 w-8 text-success-600 dark:text-success-500" />
                  ) : (
                    <ArrowDownCircle className="h-8 w-8 text-danger-600 dark:text-danger-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {transaction.category?.name || 'Uncategorized'} • {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                  </p>
                </div>
                <div className={`text-sm font-medium ${
                  transaction.type === 'income' 
                    ? 'text-success-600 dark:text-success-500' 
                    : 'text-danger-600 dark:text-danger-500'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              className="py-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
              <motion.a 
                href="/transactions/new" 
                className="block mt-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Add your first transaction
              </motion.a>
            </motion.div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default TransactionList;