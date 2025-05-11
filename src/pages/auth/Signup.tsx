import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';

const Signup: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    let isValid = true;

    if (!fullName) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    }

    if (!email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password, fullName);
      
      if (error) {
        toast.error(error.message || 'Failed to sign up');
      } else {
        toast.success('Account created successfully! Please check your email for verification.');
        navigate('/login');
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create an account</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Sign up to start tracking your finances
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  id="fullName"
                  type="text"
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  icon={<User size={18} className="text-gray-500" />}
                  error={errors.fullName}
                  required
                />
                
                <Input
                  id="email"
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  icon={<Mail size={18} className="text-gray-500" />}
                  error={errors.email}
                  required
                />
                
                <Input
                  id="password"
                  type="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock size={18} className="text-gray-500" />}
                  error={errors.password}
                  required
                />
                
                <Input
                  id="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock size={18} className="text-gray-500" />}
                  error={errors.confirmPassword}
                  required
                />
                
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  isLoading={isLoading}
                >
                  Sign Up
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
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

export default Signup;