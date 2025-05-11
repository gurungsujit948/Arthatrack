import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, CreditCard, Plus, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Category } from '../../types';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Categories: React.FC = () => {
  const { user } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');
        
      if (error) throw error;
      
      setCategories(data || []);
      
      // Create default categories if none exist
      if (data?.length === 0) {
        await createDefaultCategories();
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
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
    // Check if category is used in transactions
    try {
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);
        
      if (countError) throw countError;
      
      if (count && count > 0) {
        toast.error(`Cannot delete: This category is used in ${count} transactions`);
        return;
      }
      
      // Check if category is used in budgets
      const { count: budgetCount, error: budgetCountError } = await supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);
        
      if (budgetCountError) throw budgetCountError;
      
      if (budgetCount && budgetCount > 0) {
        toast.error(`Cannot delete: This category is used in ${budgetCount} budgets`);
        return;
      }
      
      // If not used, proceed with deletion
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };
  
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
    });
    setShowForm(true);
  };
  
  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      color: '#3B82F6',
    });
    setErrors({});
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name,
            color: formData.color,
          })
          .eq('id', editingCategory.id);
          
        if (error) throw error;
        
        setCategories(
          categories.map(c => 
            c.id === editingCategory.id 
              ? { ...c, name: formData.name, color: formData.color } 
              : c
          )
        );
        
        toast.success('Category updated');
      } else {
        // Create new category
        const { data, error } = await supabase
          .from('categories')
          .insert([{
            name: formData.name,
            color: formData.color,
            icon: 'tag', // Default icon
            user_id: user?.id,
          }])
          .select();
          
        if (error) throw error;
        
        if (data) {
          setCategories([...categories, data[0]]);
        }
        
        toast.success('Category created');
      }
      
      handleCancel();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Failed to save category');
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Layout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage transaction categories
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-1">
                  <Link
                    to="/settings"
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <User size={18} className="mr-3" />
                    Profile
                  </Link>
                  <Link
                    to="/settings/categories"
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-100"
                  >
                    <CreditCard size={18} className="mr-3" />
                    Categories
                  </Link>
                </nav>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-4 space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Categories</CardTitle>
                
                {!showForm && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowForm(true)}
                    icon={<Plus size={16} />}
                  >
                    Add Category
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {showForm && (
                  <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                      {editingCategory ? 'Edit Category' : 'New Category'}
                    </h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <Input
                        label="Category Name"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                        required
                      />
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Color
                        </label>
                        <div className="flex items-center">
                          <input
                            type="color"
                            id="color"
                            name="color"
                            value={formData.color}
                            onChange={handleChange}
                            className="w-10 h-10 p-0 border-0 rounded-md cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {formData.color}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancel}
                        >
                          Cancel
                        </Button>
                        
                        <Button type="submit">
                          {editingCategory ? 'Update Category' : 'Create Category'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
                
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : categories.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {categories.map((category) => (
                      <div 
                        key={category.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-6 h-6 rounded-full mr-3"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {category.name}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(category)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            aria-label="Edit category"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="p-1 text-danger-500 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-300"
                            aria-label="Delete category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No categories found. Add your first category.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Categories;