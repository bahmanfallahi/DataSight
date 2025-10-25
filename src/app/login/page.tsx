'use client';

import { AuthForm } from '@/components/auth-form';
import DataSightLogo from '@/components/data-sight/logo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import packageJson from '../../../package.json';

export default function LoginPage() {

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="flex-grow flex items-center justify-center w-full">
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
       <footer className="py-6 w-full">
            <div className="container flex flex-col items-center justify-between gap-4 md:flex-row text-center">
              <p className="text-balance text-sm leading-loose text-muted-foreground md:text-left">
                develop with ❤️ by bahman fallahi
              </p>
              <p className="text-sm text-muted-foreground">
                Version {packageJson.version}
              </p>
            </div>
        </footer>
    </div>
  );
}
