import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, Moon, Sun, CreditCard, Ban as Bank } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import Layout from '../../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

const ProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    currency: 'USD',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);
  
  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (profile) {
        setFormData({
          fullName: profile.full_name || '',
          email: user.email || '',
          currency: profile.currency || 'USD',
        });
      } else {
        setFormData({
          fullName: '',
          email: user.email || '',
          currency: 'USD',
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile data');
    }
  };
  
  const validateProfile = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validatePassword = () => {
    const newErrors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfile() || !user) return;
    
    setIsLoading(true);
    
    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.fullName,
            currency: formData.currency,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
          
        if (updateError) throw updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            email: user.email,
            full_name: formData.fullName,
            currency: formData.currency,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);
          
        if (insertError) throw insertError;
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) return;
    
    setIsPasswordLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setIsPasswordLoading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const currencies = [
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'JPY', label: 'Japanese Yen (JPY)' },
    { value: 'CAD', label: 'Canadian Dollar (CAD)' },
    { value: 'AUD', label: 'Australian Dollar (AUD)' },
    { value: 'CNY', label: 'Chinese Yuan (CNY)' },
    { value: 'INR', label: 'Indian Rupee (INR)' },
    { value: 'BRL', label: 'Brazilian Real (BRL)' },
    { value: 'RUB', label: 'Russian Ruble (RUB)' },
  ];

  return (
    <Layout>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account preferences
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
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary-50 dark:bg-primary-900 text-primary-700 dark:text-primary-100"
                  >
                    <User size={18} className="mr-3" />
                    Profile
                  </Link>
                  <Link
                    to="/settings/categories"
                    className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <CreditCard size={18} className="mr-3" />
                    Categories
                  </Link>
                </nav>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {theme === 'dark' ? (
                      <Moon size={18} className="mr-3 text-gray-700 dark:text-gray-300" />
                    ) : (
                      <Sun size={18} className="mr-3 text-gray-700 dark:text-gray-300" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="ml-2 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 dark:bg-gray-700 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    <span
                      className={`${
                        theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                      } inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-4 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <Input
                    label="Full Name"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                    required
                  />
                  
                  <Input
                    label="Email"
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    required
                    disabled
                  />
                  
                  <Select
                    label="Currency"
                    id="currency"
                    options={currencies}
                    value={formData.currency}
                    onChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
                  />
                  
                  <div className="pt-4">
                    <Button
                      type="submit"
                      isLoading={isLoading}
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <Input
                    label="Current Password"
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.currentPassword}
                    required
                  />
                  
                  <Input
                    label="New Password"
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.newPassword}
                    required
                  />
                  
                  <Input
                    label="Confirm New Password"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={passwordErrors.confirmPassword}
                    required
                  />
                  
                  <div className="pt-4">
                    <Button
                      type="submit"
                      isLoading={isPasswordLoading}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfileSettings;