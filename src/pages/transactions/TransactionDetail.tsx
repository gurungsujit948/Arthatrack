import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Transaction } from '../../types';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const TransactionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchTransaction();
  }, [id]);
  
  const fetchTransaction = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();
        
      if (error) throw error;
      
      setTransaction(data);
    } catch (error) {
      console.error('Error fetching transaction:', error);
      toast.error('Failed to load transaction details');
      navigate('/transactions');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete this transaction?');
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);
        
      if (error) throw error;
      
      toast.success('Transaction deleted successfully');
      navigate('/transactions');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!transaction) {
    return (
      <Layout>
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              Transaction not found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              The transaction you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <div className="mt-6">
              <Button
                variant="primary"
                onClick={() => navigate('/transactions')}
              >
                Back to Transactions
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/transactions')}
              className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Transaction Details
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View transaction information
              </p>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{transaction.description}</CardTitle>
            <div className="flex space-x-2">
              <Link to={`/transactions/${id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Edit size={16} />}
                >
                  Edit
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={16} />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Amount
                  </h3>
                  <p className={`text-2xl font-semibold ${
                    transaction.type === 'income' 
                      ? 'text-success-600 dark:text-success-400' 
                      : 'text-danger-600 dark:text-danger-400'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Type
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    transaction.type === 'income'
                      ? 'bg-success-100 text-success-800 dark:bg-success-800 dark:text-success-100'
                      : 'bg-danger-100 text-danger-800 dark:bg-danger-800 dark:text-danger-100'
                  }`}>
                    {transaction.type === 'income' ? 'Income' : 'Expense'}
                  </span>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Date
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {format(new Date(transaction.date), 'MMMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              <div>
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Category
                  </h3>
                  <p className="text-gray-900 dark:text-white flex items-center">
                    <span 
                      className="inline-block w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: transaction.category?.color || '#CBD5E1' }}
                    ></span>
                    {transaction.category?.name || 'Uncategorized'}
                  </p>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Created At
                  </h3>
                  <p className="text-gray-900 dark:text-white">
                    {format(new Date(transaction.created_at), 'MMMM dd, yyyy, h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TransactionDetail;