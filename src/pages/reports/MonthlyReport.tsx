import React, { useState, useEffect } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Download, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Transaction, Category } from '../../types';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const MonthlyReport: React.FC = () => {
  const { user } = useAuth();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const formattedMonth = format(currentMonth, 'MMMM yyyy');
  
  useEffect(() => {
    fetchData();
  }, [currentMonth]);
  
  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Format dates for Supabase query
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      
      // Fetch categories
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user?.id);
        
      if (categoryError) throw categoryError;
      
      setCategories(categoryData || []);
      
      // Fetch transactions for the month
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .select('*, category:categories(*)')
        .eq('user_id', user?.id)
        .gte('date', startDate)
        .lte('date', endDate);
        
      if (transactionError) throw transactionError;
      
      setTransactions(transactionData || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  
  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Don't allow going beyond current month
    if (nextMonth <= new Date()) {
      setCurrentMonth(nextMonth);
    }
  };
  
  const downloadCSV = () => {
    if (transactions.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    // Create CSV content
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount'];
    
    const rows = transactions.map(t => [
      t.date,
      t.type,
      t.category?.name || 'Uncategorized',
      t.description,
      t.amount.toFixed(2)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions-${format(currentMonth, 'yyyy-MM')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV file downloaded');
  };
  
  // Data calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  
  // Group transactions by day for the line chart
  const dailyData = () => {
    const days = Array.from(
      { length: monthEnd.getDate() },
      (_, i) => format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1), 'dd')
    );
    
    const incomeByDay: Record<string, number> = {};
    const expensesByDay: Record<string, number> = {};
    
    days.forEach(day => {
      incomeByDay[day] = 0;
      expensesByDay[day] = 0;
    });
    
    transactions.forEach(transaction => {
      const day = format(new Date(transaction.date), 'dd');
      
      if (transaction.type === 'income') {
        incomeByDay[day] = (incomeByDay[day] || 0) + transaction.amount;
      } else {
        expensesByDay[day] = (expensesByDay[day] || 0) + transaction.amount;
      }
    });
    
    return {
      labels: days,
      datasets: [
        {
          label: 'Income',
          data: Object.values(incomeByDay),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Expenses',
          data: Object.values(expensesByDay),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.5)',
          tension: 0.3,
        },
      ],
    };
  };
  
  // Group expenses by category for the pie chart
  const expensesByCategoryData = () => {
    const categoryExpenses: Record<string, number> = {};
    const categoryColors: Record<string, string> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const categoryName = transaction.category?.name || 'Uncategorized';
        categoryExpenses[categoryName] = (categoryExpenses[categoryName] || 0) + transaction.amount;
        categoryColors[categoryName] = transaction.category?.color || '#64748B';
      });
      
    return {
      labels: Object.keys(categoryExpenses),
      datasets: [
        {
          data: Object.values(categoryExpenses),
          backgroundColor: Object.keys(categoryExpenses).map(cat => categoryColors[cat]),
          borderWidth: 0,
        },
      ],
    };
  };
  
  // Top spending categories
  const topCategories = () => {
    const categoryExpenses: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const categoryName = transaction.category?.name || 'Uncategorized';
        categoryExpenses[categoryName] = (categoryExpenses[categoryName] || 0) + transaction.amount;
      });
      
    return Object.entries(categoryExpenses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };
  
  // Income vs Expenses comparison
  const incomeVsExpensesData = {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        data: [totalIncome, totalExpenses],
        backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderWidth: 0,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
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
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Report</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Financial summary and analysis
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={downloadCSV}
            disabled={transactions.length === 0}
            icon={<Download size={16} />}
          >
            Export CSV
          </Button>
        </div>
        
        {/* Month Selector */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousMonth}
                icon={<ArrowLeft size={16} />}
              >
                Previous
              </Button>
              
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {formattedMonth}
              </h2>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextMonth}
                disabled={new Date(currentMonth).getMonth() === new Date().getMonth()}
                icon={<ArrowRight size={16} />}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : transactions.length > 0 ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Income</h3>
                  <p className="mt-2 text-3xl font-bold text-success-600 dark:text-success-400">
                    ${totalIncome.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Expenses</h3>
                  <p className="mt-2 text-3xl font-bold text-danger-600 dark:text-danger-400">
                    ${totalExpenses.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Net Savings</h3>
                  <p className={`mt-2 text-3xl font-bold ${
                    netSavings >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                  }`}>
                    ${netSavings.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">Savings Rate</h3>
                  <p className={`mt-2 text-3xl font-bold ${
                    savingsRate >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                  }`}>
                    {savingsRate.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Cash Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <Line data={dailyData()} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Income vs Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <Bar data={incomeVsExpensesData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Expenses by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Pie data={expensesByCategoryData()} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Spending Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topCategories().map(([category, amount], index) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg font-semibold text-gray-500 dark:text-gray-400 w-6">
                            {index + 1}.
                          </span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {category}
                          </span>
                        </div>
                        <span className="font-medium text-danger-600 dark:text-danger-400">
                          ${amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                    
                    {topCategories().length === 0 && (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                        No expense data
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
              No transactions for {formattedMonth}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Add some transactions to see your financial report.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MonthlyReport;