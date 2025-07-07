'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SignUp() {
  const [form, setForm] = useState({
    name: '',
    company_name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
  
    try {
      const res = await fetch(' http://127.0.0.1:5000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
        credentials: 'include',
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
  
      setSuccess(data.message || 'Registered successfully!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };
  

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="pb-12 text-center">
            <h1 className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 via-indigo-300 to-gray-200 text-3xl font-semibold md:text-4xl">
              Create an account
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto max-w-[400px] space-y-5">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {success && <p className="text-green-500 text-sm">{success}</p>}
            
            <div>
              <label className="block text-sm font-medium text-indigo-200/65" htmlFor="name">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                className="form-input w-full"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-200/65" htmlFor="company_name">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                id="company_name"
                type="text"
                className="form-input w-full"
                value={form.company_name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-200/65" htmlFor="email">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                className="form-input w-full"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-200/65" htmlFor="password">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                className="form-input w-full"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mt-6 space-y-5">
              <button type="submit" className="btn w-full bg-indigo-600 text-white">
                Register
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-indigo-200/65">
            Already have an account?{" "}
            <Link className="font-medium text-indigo-500" href="/signin">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
