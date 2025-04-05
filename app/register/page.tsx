'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@/models/User';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    requestedRole: UserRole.STUDENT,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.password || !formData.firstName || !formData.lastName) {
      setError('Şifre, ad ve soyad gereklidir');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }

    try {
      // Generate username and email from first and last name
      const username = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`.replace(/\s+/g, '');
      const email = `${username}@example.com`;

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          requestedRole: formData.requestedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt talebi başarısız oldu');
      }

      setSuccess(data.message || 'Kayıt talebiniz gönderildi! Yönetici onayı bekleniyor.');
      
      // Clear form
      setFormData({
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        requestedRole: UserRole.STUDENT,
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-blue-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 bg-pattern opacity-5 z-0"></div>
      
      <div className="max-w-md w-full z-10">
        <div className="text-center mb-8">
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-800">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Hesap Oluşturma Talebi
            </span>
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Talebiniz bir yönetici tarafından incelenecektir
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-xl p-8 border border-gray-100">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              {success}
              <p className="mt-2 text-sm">Giriş sayfasına yönlendiriliyorsunuz...</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Ad
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading || !!success}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Soyad
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading || !!success}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder="Şifre"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading || !!success}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    placeholder="Şifre Tekrar"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading || !!success}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="requestedRole" className="block text-sm font-medium text-gray-700 mb-1">
                İstenen Rol
              </label>
              <select
                id="requestedRole"
                name="requestedRole"
                className="block w-full px-4 py-3 border border-gray-200 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                value={formData.requestedRole}
                onChange={handleChange}
                disabled={loading || !!success}
              >
                <option value={UserRole.STUDENT}>Öğrenci</option>
                <option value={UserRole.TUTOR}>Eğitmen</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !!success}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white 
                  ${loading || success ? 'bg-indigo-400' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'} 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-md`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Gönderiliyor...
                  </>
                ) : success ? 'Gönderildi!' : 'Kayıt Talebini Gönder'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">veya</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
              >
                Zaten bir hesabınız var mı? <span className="ml-1 underline">Giriş yapın</span>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8 text-xs text-gray-500">
          © {new Date().getFullYear()} Öğrenci Takip Sistemi. Tüm hakları saklıdır.
        </div>
      </div>
    </div>
  );
} 