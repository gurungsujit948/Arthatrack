import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const { resetPassword } = useAuth();

  const validate = () => {
    if (!email) {
      setError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email is invalid');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        toast.error(error.message || 'Failed to send reset email');
      } else {
        setIsSubmitted(true);
        toast.success('Password reset email sent');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-144px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Forgot Password</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Enter your email to reset your password
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <div className="text-center py-4">
                  <div className="mb-4 text-success-600 dark:text-success-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Check your email
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    We've sent a password reset link to {email}
                  </p>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Back to login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Input
                    id="email"
                    type="email"
                    label="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    icon={<Mail size={18} className="text-gray-500" />}
                    error={error}
                    required
                  />
                  
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={isLoading}
                  >
                    Send Reset Link
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ForgotPassword;