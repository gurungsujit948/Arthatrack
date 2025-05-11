import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Transaction, Category, TransactionType } from '../../types';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

const TransactionForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<{
    description: string;
    amount: string;
    date: string;
    type: TransactionType;
    category_id: string;
  }>({
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense',
    category_id: '',
  });

  const [errors, setErrors] = useState<{
    description?: string;
    amount?: string;
    date?: string;
    category_id?: string;
  }>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchTransaction();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const fetchTransaction = async () => {
    try {
      setIsFetching(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          description: data.description,
          amount: data.amount.toString(),
          date: data.date,
          type: data.type,
          category_id: data.category_id.toString(),
        });
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      toast.error('Failed to load transaction');
      navigate('/transactions');
    } finally {
      setIsFetching(false);
    }
  };

  const checkBudgetLimit = async (categoryId: number, amount: number, date: string) => {
    const month = format(new Date(date), 'yyyy-MM');
    
    try {
      // Get budget for the category and month
      const { data: budgetData, error: budgetError } = await supabase
        .from('budgets')
        .select('amount')
        .eq('category_id', categoryId)
        .eq('month', month)
        .eq('user_id', user?.id)
        .single();
        
      if (budgetError) throw budgetError;
      
      if (budgetData) {
        // Get total expenses for the category in this month
        const { data: expensesData, error: expensesError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('category_id', categoryId)
          .eq('type', 'expense')
          .eq('user_id', user?.id)
          .gte('date', `${month}-01`)
          .lte('date', `${month}-31`);
          
        if (expensesError) throw expensesError;
        
        const totalExpenses = (expensesData || []).reduce((sum, t) => sum + t.amount, 0);
        const newTotal = totalExpenses + amount;
        
        if (newTotal > budgetData.amount) {
          const overage = (newTotal - budgetData.amount).toFixed(2);
          const category = categories.find(c => c.id === categoryId);
          toast.error(
            `Warning: This transaction will put you £${overage} over budget for ${category?.name} this month`,
            { duration: 6000 }
          );
        }
      }
    } catch (error) {
      console.error('Error checking budget:', error);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    const transactionData = {
      description: formData.description,
      amount: Number(formData.amount),
      date: formData.date,
      type: formData.type,
      category_id: Number(formData.category_id),
      user_id: user?.id,
    };
    
    try {
      if (formData.type === 'expense') {
        await checkBudgetLimit(
          Number(formData.category_id),
          Number(formData.amount),
          formData.date
        );
      }

      if (isEditMode) {
        const { error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', id)
          .eq('user_id', user?.id);
          
        if (error) throw error;
        
        toast.success('Transaction updated successfully', {
          icon: '✏️',
          duration: 3000
        });
        navigate(`/transactions/${id}`);
      } else {
        const { data, error } = await supabase
          .from('transactions')
          .insert([transactionData])
          .select();
          
        if (error) throw error;
        
        toast.success('Transaction created successfully', {
          icon: '✨',
          duration: 3000
        });
        navigate(`/transactions/${data[0].id}`);
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error(isEditMode ? 'Failed to update transaction' : 'Failed to create transaction');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isFetching) {
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

  return (
    <Layout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditMode ? 'Edit Transaction' : 'New Transaction'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEditMode ? 'Update transaction details' : 'Add a new income or expense'}
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Transaction' : 'Transaction Details'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Transaction Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="income"
                          checked={formData.type === 'income'}
                          onChange={() => handleSelectChange('type', 'income')}
                          className="form-radio h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Income</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="type"
                          value="expense"
                          checked={formData.type === 'expense'}
                          onChange={() => handleSelectChange('type', 'expense')}
                          className="form-radio h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                        />
                        <span className="ml-2 text-gray-700 dark:text-gray-300">Expense</span>
                      </label>
                    </div>
                  </div>
                  
                  <Input
                    label="Description"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Salary, Groceries, Rent"
                    error={errors.description}
                    required
                  />
                  
                  <Input
                    label="Amount"
                    id="amount"
                    name="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    error={errors.amount}
                    required
                  />
                </div>
                
                <div className="space-y-4">
                  <Input
                    label="Date"
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    error={errors.date}
                    required
                  />
                  
                  <Select
                    label="Category"
                    id="category_id"
                    options={[
                      { value: '', label: 'Select a category' },
                      ...categories.map(c => ({ value: c.id.toString(), label: c.name }))
                    ]}
                    value={formData.category_id}
                    onChange={(value) => handleSelectChange('category_id', value)}
                    error={errors.category_id}
                  />
                  
                  {categories.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      No categories found. Default categories will be created automatically.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/transactions')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                >
                  {isEditMode ? 'Update Transaction' : 'Create Transaction'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TransactionForm;