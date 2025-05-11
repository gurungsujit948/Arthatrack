import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Layout>
      <div className="min-h-[calc(100vh-144px)] flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-6xl font-bold text-primary-600 dark:text-primary-400">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Page not found
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Oops! The page you are looking for doesn't exist or has been moved.
          </p>
          <div className="mt-8">
            <Button 
              variant="primary" 
              onClick={() => navigate('/')}
            >
              Go back home
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;