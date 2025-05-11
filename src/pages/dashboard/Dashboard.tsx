import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank, GraduationCap, Book, Coffee } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Transaction, Category } from '../../types';
import Layout from '../../components/layout/Layout';
import StatCard from '../../components/dashboard/StatCard';
import TransactionList from '../../components/dashboard/TransactionList';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { analyzeSpendingPatterns, predictNextMonthSpending } from '../../lib/aiAnalytics';
import AIInsights from '../../components/dashboard/AIInsights';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<SpendingInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stats, setStats] = useState({
    balance: 0,
    income: 0,
    expenses: 0,
    savingsRate: 0
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchDashboardData();
  }, [user, navigate]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setIsAnalyzing(true);
      
      // Fetch transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user?.id)
        .order('date', { ascending: false });
        
      if (transactionsError) throw transactionsError;
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id);
        
      if (categoriesError) throw categoriesError;
      
      setTransactions(transactionsData || []);
      setCategories(categoriesData || []);
      
      // Calculate stats
      const income = transactionsData
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) || 0;
        
      const expenses = transactionsData
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) || 0;
        
      const balance = income - expenses;
      const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
      
      setStats({
        balance,
        income,
        expenses,
        savingsRate
      });

      // Generate AI insights
      if (transactionsData && transactionsData.length > 0) {
        const spendingInsights = analyzeSpendingPatterns(transactionsData);
        const predictions = await predictNextMonthSpending(transactionsData);
        
        // Add predictions to insights if confidence is high enough
        predictions.forEach(prediction => {
          if (prediction.confidence > 0.7) {
            const category = categoriesData?.find(c => c.id === prediction.categoryId);
            if (category) {
              spendingInsights.push({
                type: 'info',
                message: `Based on your spending patterns, you might spend around $${prediction.predictedAmount.toFixed(2)} on ${category.name} next month.`,
                value: prediction.predictedAmount
              });
            }
          }
        });
        
        setInsights(spendingInsights);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  const prepareExpensesByCategory = () => {
    const categoryExpenses: Record<string, number> = {};
    const categoryColors: Record<string, string> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const categoryName = transaction.category?.name || 'Uncategorized';
        categoryExpenses[categoryName] = (categoryExpenses[categoryName] || 0) + transaction.amount;
        categoryColors[categoryName] = transaction.category?.color || '#CBD5E1';
      });
      
    const labels = Object.keys(categoryExpenses);
    const data = Object.values(categoryExpenses);
    const backgroundColor = labels.map(label => categoryColors[label]);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 0,
        },
      ],
    };
  };
  
  const prepareMonthlyData = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(month.toLocaleDateString('en-US', { month: 'short' }));
    }
    
    const monthlyIncome: Record<string, number> = {};
    const monthlyExpenses: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
      
      if (months.includes(monthStr)) {
        if (transaction.type === 'income') {
          monthlyIncome[monthStr] = (monthlyIncome[monthStr] || 0) + transaction.amount;
        } else {
          monthlyExpenses[monthStr] = (monthlyExpenses[monthStr] || 0) + transaction.amount;
        }
      }
    });
    
    const incomeData = months.map(month => monthlyIncome[month] || 0);
    const expenseData = months.map(month => monthlyExpenses[month] || 0);
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Income',
          data: incomeData,
          backgroundColor: '#16A34A',
        },
        {
          label: 'Expenses',
          data: expenseData,
          backgroundColor: '#DC2626',
        },
      ],
    };
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Layout>
      <div 
        className="min-h-screen bg-cover bg-center"
        style={{
          backgroundImage: 'url("https://images.pexels.com/photos/2982449/pexels-photo-2982449.jpeg")',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backgroundBlendMode: 'overlay'
        }}
      >
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {!user && (
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-8 mb-8 backdrop-blur">
              <h1 className="text-4xl font-bold text-red-800 dark:text-red-400 mb-4">
                Welcome to Student Finance Tracker
              </h1>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                Your financial companion for university life at the University of Wolverhampton
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-white/80 dark:bg-gray-800/80">
                  <CardContent className="p-6">
                    <GraduationCap className="w-12 h-12 text-red-800 dark:text-red-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Student Budget Planning
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Plan your tuition, accommodation, and living expenses effectively
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 dark:bg-gray-800/80">
                  <CardContent className="p-6">
                    <Book className="w-12 h-12 text-red-800 dark:text-red-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Course Materials
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Track expenses for textbooks, supplies, and study materials
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/80 dark:bg-gray-800/80">
                  <CardContent className="p-6">
                    <Coffee className="w-12 h-12 text-red-800 dark:text-red-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Student Life
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Manage your social life and entertainment budget wisely
                    </p>
                  </CardContent>
                </Card>
              </div>
              <div className="bg-red-800 text-white p-6 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Open Day Special</h2>
                <p className="mb-4">
                  Start your university journey with smart financial planning. Sign up today and get:
                </p>
                <ul className="list-disc list-inside mb-6 space-y-2">
                  <li>Personalized budget templates for Wolverhampton students</li>
                  <li>Expense tracking categorized for university life</li>
                  <li>Tips for managing student loans and grants</li>
                  <li>Local student discounts and deals tracker</li>
                </ul>
                <Button
                  variant="primary"
                  onClick={() => navigate('/signup')}
                  className="bg-white text-red-800 hover:bg-gray-100"
                >
                  Get Started
                </Button>
              </div>
            </div>
          )}

          {user && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-200">
                  Your financial overview
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                  title="Balance"
                  value={`$${stats.balance.toFixed(2)}`}
                  icon={<Wallet size={20} />}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur"
                />
                <StatCard
                  title="Income"
                  value={`$${stats.income.toFixed(2)}`}
                  icon={<ArrowUpRight size={20} />}
                  change={2.5}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur"
                />
                <StatCard
                  title="Expenses"
                  value={`$${stats.expenses.toFixed(2)}`}
                  icon={<ArrowDownLeft size={20} />}
                  change={-1.2}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur"
                />
                <StatCard
                  title="Savings Rate"
                  value={`${stats.savingsRate}%`}
                  icon={<PiggyBank size={20} />}
                  change={3.1}
                  className="bg-white/90 dark:bg-gray-800/90 backdrop-blur"
                />
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <Card className="lg:col-span-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Monthly Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                      </div>
                    ) : transactions.length > 0 ? (
                      <Bar data={prepareMonthlyData()} options={barOptions} height={250} />
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No transaction data yet</p>
                        <Button 
                          variant="primary" 
                          onClick={() => navigate('/transactions/new')}
                        >
                          Add Transactions
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Expenses by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="h-64 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                      </div>
                    ) : transactions.filter(t => t.type === 'expense').length > 0 ? (
                      <div className="h-64">
                        <Pie data={prepareExpensesByCategory()} />
                      </div>
                    ) : (
                      <div className="h-64 flex flex-col items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No expense data yet</p>
                        <Button 
                          variant="primary" 
                          onClick={() => navigate('/transactions/new')}
                        >
                          Add Expenses
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">
                  <TransactionList transactions={transactions} limit={5} />
                </div>
                <div className="lg:col-span-1">
                  <AIInsights insights={insights} isLoading={isAnalyzing} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;