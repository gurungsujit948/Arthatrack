import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, User, LogOut, Mountain } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path: string) => pathname === path;

  const navItemVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100 }}
      className="bg-gradient-to-r from-red-800 to-red-900 shadow-lg sticky top-0 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <motion.div 
              className="flex-shrink-0 flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link 
                to="/" 
                className="group flex items-center space-x-2 text-xl font-bold text-white"
              >
                <motion.div
                  animate={{
                    rotate: [0, -10, 10, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  <Mountain className="h-8 w-8 text-primary-200" />
                </motion.div>
                <span className="font-serif tracking-wider bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  ARTHATRACK
                </span>
              </Link>
            </motion.div>
            
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {user && (
                <motion.div 
                  className="flex space-x-4"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.1
                      }
                    }
                  }}
                >
                  {[
                    { path: '/dashboard', label: 'Dashboard' },
                    { path: '/transactions', label: 'Transactions' },
                    { path: '/budgets', label: 'Budgets' },
                    { path: '/reports', label: 'Reports' },
                  ].map((item) => (
                    <motion.div key={item.path} variants={navItemVariants}>
                      <Link
                        to={item.path}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:bg-red-700 hover:scale-105 ${
                          isActive(item.path)
                            ? 'bg-red-700 text-white'
                            : 'text-red-100 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2 rounded-full text-red-100 hover:text-white hover:bg-red-700 transition-colors focus:outline-none"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
            
            {user ? (
              <div className="hidden sm:flex sm:items-center sm:space-x-2">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Link
                    to="/settings"
                    className="p-2 rounded-full text-red-100 hover:text-white hover:bg-red-700 transition-colors"
                  >
                    <User size={20} />
                  </Link>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={signOut}
                  className="p-2 rounded-full text-red-100 hover:text-white hover:bg-red-700 transition-colors"
                  aria-label="Sign out"
                >
                  <LogOut size={20} />
                </motion.button>
              </div>
            ) : (
              <div className="hidden sm:flex sm:items-center sm:space-x-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-md text-sm font-medium text-red-100 hover:text-white hover:bg-red-700 transition-colors"
                  >
                    Login
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/signup"
                    className="px-4 py-2 rounded-md text-sm font-medium bg-yellow-500 text-red-900 hover:bg-yellow-400 transition-colors"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </div>
            )}
            
            <div className="flex items-center sm:hidden">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-red-100 hover:text-white hover:bg-red-700 transition-colors focus:outline-none"
                aria-expanded={isOpen}
              >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      
      <motion.div 
        className={`sm:hidden ${isOpen ? 'block' : 'hidden'}`}
        initial="hidden"
        animate={isOpen ? "visible" : "hidden"}
        variants={{
          visible: { opacity: 1, height: 'auto' },
          hidden: { opacity: 0, height: 0 }
        }}
      >
        <div className="px-2 pt-2 pb-3 space-y-1 bg-red-900">
          {user ? (
            <>
              {[
                { path: '/dashboard', label: 'Dashboard' },
                { path: '/transactions', label: 'Transactions' },
                { path: '/budgets', label: 'Budgets' },
                { path: '/reports', label: 'Reports' },
                { path: '/settings', label: 'Settings' },
              ].map((item) => (
                <motion.div
                  key={item.path}
                  variants={navItemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to={item.path}
                    onClick={closeMenu}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-red-700 text-white'
                        : 'text-red-100 hover:bg-red-700 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  signOut();
                  closeMenu();
                }}
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-100 hover:bg-red-700 hover:text-white transition-colors"
              >
                Sign Out
              </motion.button>
            </>
          ) : (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium text-red-100 hover:bg-red-700 hover:text-white transition-colors"
                >
                  Login
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/signup"
                  onClick={closeMenu}
                  className="block px-3 py-2 rounded-md text-base font-medium bg-yellow-500 text-red-900 hover:bg-yellow-400 transition-colors"
                >
                  Sign Up
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>
    </motion.header>
  );
};

export default Navbar;