import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowUpDown, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Transaction, Category } from '../../types';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

type SortField = 'date' | 'amount' | 'description';
type SortOrder = 'asc' | 'desc';

const TransactionList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);
  
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });
        
      if (error) throw error;
      
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };
  
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
    }
  };
  
  const handleDelete = async (id: number) => {
    const confirmed = window.confirm('Are you sure you want to delete this transaction?');
    
    if (!confirmed) return;
    
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Transaction deleted successfully', {
        icon: '🗑️',
        duration: 3000
      });
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Failed to delete transaction');
    }
  };
  
  // Sort and filter functions
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={16} />;
    return sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />;
  };
  
  const filterTransactions = () => {
    return transactions.filter(transaction => {
      // Apply search filter
      const matchesSearch = searchQuery === '' ||
        transaction.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply category filter
      const matchesCategory = selectedCategory === '' ||
        transaction.category_id.toString() === selectedCategory;
      
      // Apply type filter
      const matchesType = selectedType === '' ||
        transaction.type === selectedType;
      
      return matchesSearch && matchesCategory && matchesType;
    });
  };
  
  const sortTransactions = (filteredTransactions: Transaction[]) => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortField === 'amount') {
        return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
      } else {
        const valueA = a[sortField].toLowerCase();
        const valueB = b[sortField].toLowerCase();
        return sortOrder === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
    });
  };
  
  // Get paginated, filtered, and sorted transactions
  const getDisplayedTransactions = () => {
    const filteredTransactions = filterTransactions();
    const sortedTransactions = sortTransactions(filteredTransactions);
    
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    
    return {
      transactions: sortedTransactions.slice(startIndex, endIndex),
      totalCount: filteredTransactions.length,
    };
  };
  
  const { transactions: displayedTransactions, totalCount } = getDisplayedTransactions();
  const totalPages = Math.ceil(totalCount / rowsPerPage);
  
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedType('');
  };

  return (
    <Layout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your income and expenses
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate('/transactions/new')}
          >
            Add Transaction
          </Button>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filter Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search size={18} />}
              />
              
              <Select
                label=""
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map(c => ({ value: c.id.toString(), label: c.name }))
                ]}
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value)}
              />
              
              <Select
                label=""
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'income', label: 'Income' },
                  { value: 'expense', label: 'Expense' }
                ]}
                value={selectedType}
                onChange={(value) => setSelectedType(value)}
              />
              
              <Button
                variant="outline"
                onClick={resetFilters}
                icon={<Filter size={16} />}
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : displayedTransactions.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center">
                            Date
                            <span className="ml-1">{getSortIcon('date')}</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('description')}
                        >
                          <div className="flex items-center">
                            Description
                            <span className="ml-1">{getSortIcon('description')}</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Category
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                          onClick={() => handleSort('amount')}
                        >
                          <div className="flex items-center">
                            Amount
                            <span className="ml-1">{getSortIcon('amount')}</span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {displayedTransactions.map((transaction) => (
                        <tr 
                          key={transaction.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {format(new Date(transaction.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'income'
                                ? 'bg-success-100 text-success-800 dark:bg-success-800 dark:text-success-100'
                                : 'bg-danger-100 text-danger-800 dark:bg-danger-800 dark:text-danger-100'
                            }`}>
                              {transaction.type === 'income' ? 'Income' : 'Expense'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {transaction.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {transaction.category?.name || 'Uncategorized'}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                            transaction.type === 'income'
                              ? 'text-success-600 dark:text-success-400'
                              : 'text-danger-600 dark:text-danger-400'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <Link
                              to={`/transactions/${transaction.id}`}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                            >
                              View
                            </Link>
                            <Link
                              to={`/transactions/${transaction.id}/edit`}
                              className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 mr-4"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleDelete(transaction.id)}
                              className="text-danger-600 hover:text-danger-900 dark:text-danger-400 dark:hover:text-danger-300"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-400">
                          Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * rowsPerPage, totalCount)}
                          </span>{' '}
                          of <span className="font-medium">{totalCount}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          {Array.from({ length: totalPages }).map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentPage(index + 1)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === index + 1
                                  ? 'z-10 bg-primary-50 dark:bg-primary-900 border-primary-500 dark:border-primary-600 text-primary-600 dark:text-primary-200'
                                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                          
                          <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  No transactions found
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery || selectedCategory || selectedType
                    ? 'Try adjusting your filters or search query.'
                    : 'Get started by creating a new transaction.'}
                </p>
                <div className="mt-6">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/transactions/new')}
                    icon={<Plus size={16} />}
                  >
                    Add Transaction
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

export default TransactionList;