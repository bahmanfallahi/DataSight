'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { signUpWithEmail, signInWithEmail } from '@/hooks/use-auth';

const authSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long.' }),
});

const signUpSchema = authSchema.extend({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }),
});


type AuthData = z.infer<typeof authSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof authSchema>;

export function AuthForm() {
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const currentSchema = isSignUp ? signUpSchema : authSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
  });

  const onSubmit = async (data: z.infer<typeof currentSchema>) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(data as SignUpData);
        toast({
          title: 'Account Created',
          description: 'You have been successfully signed up. Please sign in.',
        });
        setIsSignUp(false); // Switch to sign in view
      } else {
        await signInWithEmail(data as SignInData);
        router.push('/');
        toast({
          title: 'Signed In',
          description: 'Welcome back!',
        });
      }
    } catch (error: any) {
      console.error(error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code) {
          switch (error.code) {
              case 'auth/email-already-in-use':
                  description = 'This email is already in use. Please sign in or use a different email.';
                  break;
              case 'auth/invalid-credential':
                  description = 'Invalid email or password. Please check your credentials.';
                  break;
              case 'auth/user-not-found':
                  description = 'No account found with this email. Please sign up first.';
                  break;
              case 'auth/wrong-password':
                  description = 'Incorrect password. Please try again.';
                  break;
          }
      }
      toast({
        variant: 'destructive',
        title: isSignUp ? 'Sign Up Failed' : 'Sign In Failed',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-2">
          {isSignUp && (
            <div className="grid gap-1">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="Your Name"
                type="text"
                autoCapitalize="words"
                autoComplete="name"
                autoCorrect="off"
                disabled={isLoading}
                {...register('displayName')}
              />
              {errors.displayName && <p className="text-sm text-destructive">{errors.displayName.message}</p>}
            </div>
          )}
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              placeholder="••••••••"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              disabled={isLoading}
              {...register('password')}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button disabled={isLoading} className="mt-2">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>
      <Button variant="outline" type="button" disabled={isLoading} onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
      </Button>
    </div>
  );
}
