'use client';

import { AuthForm } from '@/components/auth-form';
import DataSightLogo from '@/components/data-sight/logo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import packageJson from '../../../package.json';
import Link from 'next/link';

export default function LoginPage() {

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <ThemeToggle />
         <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            Back to Home
          </Link>
      </div>
      <div className="flex flex-col items-center gap-6">
        <Card className="w-full max-w-sm shadow-lg">
          <CardHeader className="text-center">
              <Link href="/" className="mx-auto">
                <DataSightLogo className="mx-auto h-12 w-12 mb-4" />
              </Link>
            <CardTitle className="text-2xl">
              Welcome Back
            </CardTitle>
            <CardDescription>
              Sign in to access your DataSight dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
              <AuthForm />
          </CardContent>
        </Card>
        <footer className="w-full">
              <div className="container flex flex-col items-center justify-between gap-4 text-center">
                <p className="text-balance text-sm leading-loose text-muted-foreground">
                  develop with ❤️ by bahman fallahi
                </p>
                <p className="text-sm text-muted-foreground">
                  Version {packageJson.version}
                </p>
              </div>
          </footer>
      </div>
    </div>
  );
}
