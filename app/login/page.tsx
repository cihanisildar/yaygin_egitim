'use client';

import { ArrowRight, User2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Kullanıcı adı ve şifre gereklidir');
      return;
    }

    try {
      await login(username, password);
    } catch (err: unknown) {
      console.error('Login error:', err);
      toast.error('Giriş başarısız. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center mb-3">
            <User2 size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            Hoş Geldiniz
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Sisteme erişmek için giriş yapın
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="Kullanıcı adınızı girin"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center py-2 px-4 rounded-lg text-white text-sm font-semibold
              bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
              transition-all duration-200 shadow-md mt-2
              ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Giriş yapılıyor...</span>
              </div>
            ) : (
              <>
                Giriş Yap
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">
            Hesabınız yok mu?{' '}
            <Link 
              href="/register" 
              className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
            >
              Hemen kaydolun
            </Link>
          </span>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Öğrenci Takip Sistemi
        </div>
      </div>
    </div>
  );
} 