"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation'; // ← Next.js router
import Link from 'next/link';

export default function SignIn() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
  
    try {
      const response = await fetch('http://127.0.0.1:5000/auth/login', {
        method: 'POST',
        credentials: 'include', // Ensures cookies are sent
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log(response.status, data);  // Debug log
      
      if (response.ok) {
        // After successful login, check if the user is logged in
        router.push('/chatbot'); // Redirect to the chatbot page
      } else {
        setError(data.error || 'Login failed.');
      }
      
    } catch (err) {
      setError('An unexpected error occurred.');
      console.error(err);
    }
  };
  
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="py-12 md:py-20">
          <div className="pb-12 text-center">
            <h1 className="animate-[gradient_6s_linear_infinite] bg-[linear-gradient(to_right,var(--color-gray-200),var(--color-indigo-200),var(--color-gray-50),var(--color-indigo-300),var(--color-gray-200))] bg-[length:200%_auto] bg-clip-text font-nacelle text-3xl font-semibold text-transparent md:text-4xl">
              Welcome back
            </h1>
          </div>

          <form className="mx-auto max-w-[400px]" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-indigo-200/65" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input w-full"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-indigo-200/65" htmlFor="password">
                    Password
                  </label>
                  <Link className="text-sm text-gray-600 hover:underline" href="/reset-password">
                    Forgot?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  className="form-input w-full"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

            <div className="mt-6 space-y-5">
              <button className="btn w-full bg-linear-to-t from-indigo-600 to-indigo-500 text-white">
                Sign in
              </button>
              <div className="flex items-center gap-3 text-center text-sm italic text-gray-600 before:h-px before:flex-1 before:bg-linear-to-r before:from-transparent before:via-gray-400/25 after:h-px after:flex-1 after:bg-linear-to-r after:from-transparent after:via-gray-400/25">
                or
              </div>
              <button className="btn relative w-full bg-gray-800 text-gray-300">
                Sign In with Google
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-indigo-200/65">
            Don&apos;t you have an account?{' '}
            <Link className="font-medium text-indigo-500" href="/signup">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
