'use client';

import { AuthForm } from '@/components/auth-form';
import DataSightLogo from '@/components/data-sight/logo';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
            <DataSightLogo className="mx-auto h-12 w-12 mb-4" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === 'signin' 
                ? 'Enter your email and password to sign in' 
                : 'Enter your details to create your account'}
          </p>
        </div>
        <AuthForm />
      </div>
    </div>
  );
}
