'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '@/hooks/use-auth';


const signInSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password cannot be empty.' }),
});

const signUpSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters long.' }),
});


export type SignInData = z.infer<typeof signInSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;


export function AuthForm() {
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const { toast } = useToast();

  const currentSchema = mode === 'signin' ? signInSchema : signUpSchema;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: {
        email: '',
        password: '',
        ...(mode === 'signup' && { displayName: '' }),
    }
  });

  const onSubmit = async (data: z.infer<typeof currentSchema>) => {
    setIsLoading(true);
    try {
        if (mode === 'signin') {
            await signInWithEmail(data as SignInData);
            toast({ title: 'Signed In', description: 'Welcome back!' });
        } else {
            await signUpWithEmail(data as SignUpData);
            toast({ title: 'Account Created', description: "You've been signed in successfully." });
        }
        router.push('/');
    } catch (error: any) {
      console.error(error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code) {
          switch (error.code) {
              case 'auth/invalid-credential':
                  description = 'Invalid email or password. Please check your credentials.';
                  break;
              case 'auth/user-not-found':
                  description = 'No account found with this email.';
                  break;
              case 'auth/wrong-password':
                  description = 'Incorrect password. Please try again.';
                  break;
              case 'auth/email-already-in-use':
                  description = 'This email address is already in use by another account.';
                  break;
              case 'auth/weak-password':
                  description = 'The password is too weak. Please choose a stronger password.';
                  break;
          }
      }
      toast({
        variant: 'destructive',
        title: mode === 'signin' ? 'Sign In Failed' : 'Sign Up Failed',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          {mode === 'signup' && (
            <div className="grid gap-1">
                <Label htmlFor="displayName">Name</Label>
                <Input
                    id="displayName"
                    placeholder="John Doe"
                    type="text"
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
              autoComplete='current-password'
              disabled={isLoading}
              {...register('password')}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button disabled={isLoading} className="mt-2">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </div>
      </form>
       <p className="px-8 text-center text-sm text-muted-foreground">
        {mode === 'signin' ? (
            <Link href="/login?mode=signup" className="underline underline-offset-4 hover:text-primary">
                Don't have an account? Sign Up
            </Link>
        ) : (
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                Already have an account? Sign In
            </Link>
        )}
      </p>
    </div>
  );
}
