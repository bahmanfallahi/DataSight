'use client';

import { AuthForm } from '@/components/auth-form';
import DataSightLogo from '@/components/data-sight/logo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function LoginPage() {

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
            <DataSightLogo className="mx-auto h-12 w-12 mb-4" />
          <CardTitle className="text-2xl">
            Welcome Back
          </CardTitle>
          <CardDescription>
            Enter your email and password to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
            <AuthForm />
        </CardContent>
      </Card>
    </div>
  );
}
