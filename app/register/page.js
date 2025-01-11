'use client';

import { useState } from 'react';
import { db } from '@/utils/firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore/lite';
import { useRouter } from 'next/navigation';
import { Hash, User, Mail, BookOpen, GraduationCap, Lock } from 'lucide-react';
import Image from 'next/image';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    surname: '',
    matricNumber: '',
    email: '',
    department: 'Computer Science', // Set default
    password: '',
    level: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if email already exists
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '==', formData.email)
      );
      const emailSnapshot = await getDocs(emailQuery);
      
      if (!emailSnapshot.empty) {
        throw new Error('Email already exists');
      }

      // Check if matric number already exists
      const matricQuery = query(
        collection(db, 'users'),
        where('matricNumber', '==', formData.matricNumber)
      );
      const matricSnapshot = await getDocs(matricQuery);
      
      if (!matricSnapshot.empty) {
        throw new Error('Matric number already exists');
      }

      // Add user to Firestore
      await addDoc(collection(db, 'users'), {
        ...formData,
        createdAt: new Date().toISOString()
      });

      router.push('/');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 relative">
            {/* You can add NACOS logo here */}
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          NACOS Registration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Department of Computer Science
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/10 backdrop-blur-lg py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-gray-700">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                  First Name
                </label>
                <div className="mt-1 relative">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-700 rounded-md shadow-sm bg-gray-800/50 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <User className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label htmlFor="middleName" className="block text-sm font-medium text-gray-300">
                  Middle Name
                </label>
                <div className="mt-1 relative">
                  <input
                    id="middleName"
                    name="middleName"
                    type="text"
                    value={formData.middleName}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-700 rounded-md shadow-sm bg-gray-800/50 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <User className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="surname" className="block text-sm font-medium text-gray-300">
                Surname
              </label>
              <div className="mt-1 relative">
                <input
                  id="surname"
                  name="surname"
                  type="text"
                  required
                  value={formData.surname}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-700 rounded-md shadow-sm bg-gray-800/50 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <User className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="matricNumber" className="block text-sm font-medium text-gray-300">
                Matric Number
              </label>
              <div className="mt-1 relative">
                <input
                  id="matricNumber"
                  name="matricNumber"
                  type="text"
                  required
                  value={formData.matricNumber}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-700 rounded-md shadow-sm bg-gray-800/50 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Hash className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-700 rounded-md shadow-sm bg-gray-800/50 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-300">
                Level
              </label>
              <div className="mt-1 relative">
                <select
                  id="level"
                  name="level"
                  required
                  value={formData.level}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-700 rounded-md shadow-sm bg-gray-800/50 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Level</option>
                  <option value="nd1">ND1</option>
                  <option value="nd2">ND2</option>
                  <option value="hnd1">HND1</option>
                  <option value="hnd2">HND2</option>
                </select>
                <BookOpen className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-700 rounded-md shadow-sm bg-gray-800/50 text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
              >
                {loading ? 'Processing...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-900 text-gray-400">Already have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => router.push('/login')}
                className="w-full flex justify-center py-2 px-4 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}