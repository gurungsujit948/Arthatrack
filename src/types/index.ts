export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  amount: number;
  date: string;
  description: string;
  category_id: number;
  type: TransactionType;
  created_at: string;
  user_id: string;
  category?: Category;
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  user_id: string;
}

export interface Budget {
  id: number;
  amount: number;
  month: string;
  category_id: number;
  user_id: string;
  created_at: string;
  category?: Category;
  spent?: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
}