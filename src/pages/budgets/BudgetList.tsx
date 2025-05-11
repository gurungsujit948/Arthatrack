import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Budget, Transaction, Category } from '../../types';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';

const BudgetList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter state
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), 'yyyy-MM')
  );
  
  useEffect(() => {
    fetchData();
  }, [selectedMonth]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id);
        
      if (categoryError) throw categoryError;
      
      setCategories(categoryData || []);
      
      // Create default categories if none exist
      if (categoryData?.length === 0) {
        await createDefaultCategories();
      }
      
      // Fetch budgets for selected month
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('*, category:categories(*)')
        .eq('user_id', user?.id)
        .eq('month', selectedMonth);
        
      if (budgetError) throw budgetError;
      
      // Fetch transactions for the selected month
      const startDate = `${selectedMonth}-01`;
      const endDate = new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]), 0).toISOString().split('T')[0];
      
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('type', 'expense')
        .gte('date', startDate)
        .lte('date', endDate);
        
      if (transactionError) throw transactionError;
      
      setTransactions(transactionData || []);
      
      // Calculate spent amount for each budget
      const budgetsWithSpent = (budgetData || []).map(budget => {
        const spent = transactionData
          ?.filter(t => t.category_id === budget.category_id)
          .reduce((sum, t) => sum + t.amount, 0) || 0;
          
        return { ...budget, spent };
      });
      
      setBudgets(budgetsWithSpent);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load budgets');
    } finally {
      setIsLoading(false);
    }
  };
  
  const createDefaultCategories = async () => {
    const defaultCategories = [
      { name: 'Housing', color: '#3B82F6', icon: 'home' },
      { name: 'Food', color: '#10B981', icon: 'shopping-bag' },
      { name: 'Transportation', color: '#F59E0B', icon: 'car' },
      { name: 'Entertainment', color: '#8B5CF6', icon: 'film' },
      { name: 'Healthcare', color: '#EF4444', icon: 'heart' },
      { name: 'Shopping', color: '#EC4899', icon: 'shopping-cart' },
      { name: 'Personal', color: '#6366F1', icon: 'user' },
      { name: 'Bills', color: '#F97316', icon: 'credit-card' },
      { name: 'Savings', color: '#0EA5E9', icon: 'piggy-bank' },
      { name: 'Salary', color: '#22C55E', icon: 'dollar-sign' },
      { name: 'Investments', color: '#A855F7', icon: 'trending-up' },
      { name: 'Other', color: '#64748B', icon: 'more-horizontal' },
    ];
    
    try {
      const categoriesToInsert = defaultCategories.map(category => ({
        ...category,
        user_id: user?.id,
      }));
      
      const { data, error } = await supabase
        .from('categories')
        .insert(categoriesToInsert)
        .select();
        
      if (error) throw error;
      
      setCategories(data || []);
      toast.success('Default categories created');
    } catch (error) {
      console.error('Error creating default categories:', error);
      toast.error('Failed to create default categories');
    }
  };
  
  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setBudgets(budgets.filter(b => b.id !== id));
      toast.success('Budget deleted');
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };
  
  // Generate month options
  const getMonthOptions = () => {
    const options = [];
    const now = new Date();
    
    // Generate the last 6 months and next 6 months
    for (let i = -6; i <= 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = format(date, 'yyyy-MM');
      const label = format(date, 'MMMM yyyy');
      
      options.push({ value, label });
    }
    
    return options;
  };
  
  // Calculate total budget and spent
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);
  const progress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <Layout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budgets</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your monthly spending limits
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/budgets/new')}
          >
            Add Budget
          </Button>
        </div>
        
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <Select
                    options={getMonthOptions()}
                    value={selectedMonth}
                    onChange={(value) => setSelectedMonth(value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Overview Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Budget</h3>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">
                  ${totalBudget.toFixed(2)}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Spent</h3>
                <p className="text-3xl font-bold text-danger-600 dark:text-danger-400 mt-2">
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Remaining</h3>
                <p className="text-3xl font-bold text-success-600 dark:text-success-400 mt-2">
                  ${(totalBudget - totalSpent).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Overall Budget Usage
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    progress >= 100 
                      ? 'bg-danger-600' 
                      : progress >= 75 
                        ? 'bg-yellow-500' 
                        : 'bg-success-600'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Category Budgets</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : budgets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {budgets.map((budget) => (
                  <div key={budget.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        <span 
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: budget.category?.color || '#CBD5E1' }}
                        ></span>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {budget.category?.name || 'Uncategorized'}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/budgets/${budget.id}/edit`)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="text-danger-600 hover:text-danger-800 dark:text-danger-400 dark:hover:text-danger-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400">
                          ${budget.spent?.toFixed(2) || '0.00'} / ${budget.amount.toFixed(2)}
                        </span>
                        <span className={`font-medium ${
                          (budget.spent || 0) >= budget.amount 
                            ? 'text-danger-600 dark:text-danger-400' 
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {Math.round(((budget.spent || 0) / budget.amount) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className={`h-2 rounded-full ${
                            (budget.spent || 0) >= budget.amount 
                              ? 'bg-danger-600' 
                              : (budget.spent || 0) >= (budget.amount * 0.75) 
                                ? 'bg-yellow-500' 
                                : 'bg-success-600'
                          }`}
                          style={{ width: `${Math.min(((budget.spent || 0) / budget.amount) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Remaining: <span className="font-medium">${(budget.amount - (budget.spent || 0)).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  No budgets for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Set up category budgets to track your spending.
                </p>
                <div className="mt-6">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/budgets/new')}
                    icon={<Plus size={16} />}
                  >
                    Create Budget
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BudgetList;