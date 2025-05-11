import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Budget, Category } from '../../types';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

const BudgetForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<{
    amount: string;
    month: string;
    category_id: string;
  }>({
    amount: '',
    month: format(new Date(), 'yyyy-MM'),
    category_id: '',
  });

  const [errors, setErrors] = useState<{
    amount?: string;
    month?: string;
    category_id?: string;
  }>({});

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchBudget();
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
      
      // If no categories exist, create default ones
      if (data?.length === 0) {
        await createDefaultCategories();
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
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

  const fetchBudget = async () => {
    try {
      setIsFetching(true);
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          amount: data.amount.toString(),
          month: data.month,
          category_id: data.category_id.toString(),
        });
      }
    } catch (error) {
      console.error('Error fetching budget:', error);
      toast.error('Failed to load budget');
      navigate('/budgets');
    } finally {
      setIsFetching(false);
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.month) {
      newErrors.month = 'Month is required';
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
    
    const budgetData = {
      amount: Number(formData.amount),
      month: formData.month,
      category_id: Number(formData.category_id),
      user_id: user?.id,
    };
    
    try {
      // Check if a budget already exists for this category and month
      if (!isEditMode) {
        const { data: existingBudget, error: checkError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user?.id)
          .eq('month', formData.month)
          .eq('category_id', formData.category_id);
          
        if (checkError) throw checkError;
        
        if (existingBudget && existingBudget.length > 0) {
          setErrors({
            category_id: 'A budget for this category and month already exists',
          });
          setIsLoading(false);
          return;
        }
      }
      
      if (isEditMode) {
        const { error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', id)
          .eq('user_id', user?.id);
          
        if (error) throw error;
        
        toast.success('Budget updated successfully', {
          icon: '✏️',
          duration: 3000
        });
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert([budgetData]);
          
        if (error) throw error;
        
        toast.success('Budget created successfully', {
          icon: '✨',
          duration: 3000
        });
      }
      
      navigate('/budgets');
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error(isEditMode ? 'Failed to update budget' : 'Failed to create budget');
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
            {isEditMode ? 'Edit Budget' : 'New Budget'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEditMode ? 'Update budget allocation' : 'Set a spending limit for a category'}
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? 'Edit Budget' : 'Budget Details'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={isEditMode}
              />
              
              {categories.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  No categories found. Default categories will be created automatically.
                </p>
              )}
              
              <Select
                label="Month"
                id="month"
                options={getMonthOptions()}
                value={formData.month}
                onChange={(value) => handleSelectChange('month', value)}
                error={errors.month}
                disabled={isEditMode}
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
              
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/budgets')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                >
                  {isEditMode ? 'Update Budget' : 'Create Budget'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BudgetForm;