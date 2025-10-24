'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { signUpWithEmail, useAuth } from '@/hooks/use-auth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const addUserSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters long.' }),
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters long.' }),
});

export type AddUserData = z.infer<typeof addUserSchema>;

interface AddUserFormProps {
    onUserAdded: () => void;
}

export function AddUserForm({ onUserAdded }: AddUserFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = React.useState(false);
  const [newUserPayload, setNewUserPayload] = React.useState<AddUserData | null>(null);
  const adminPasswordRef = React.useRef<HTMLInputElement>(null);
  const { user: adminUser } = useAuth();
  const { toast } = useToast();

  const form = useForm<AddUserData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
        email: '',
        password: '',
        displayName: '',
    }
  });

  const onSubmit = (data: AddUserData) => {
    setNewUserPayload(data);
    setIsPasswordPromptOpen(true);
  };
  
  const handleConfirmCreateUser = async () => {
    const adminPassword = adminPasswordRef.current?.value;

    if (!adminPassword || !adminUser || !newUserPayload) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Admin credentials are required to complete this action.",
        });
        return;
    }
    
    setIsPasswordPromptOpen(false);
    setIsLoading(true);

    try {
        await signUpWithEmail({
            newUser: newUserPayload,
            adminEmail: adminUser.email!,
            adminPassword: adminPassword,
        });
        toast({ title: 'User Created', description: "The new user account has been successfully created." });
        onUserAdded();
    } catch (error: any) {
      console.error(error);
      let description = 'An unexpected error occurred. Please try again.';
      if (error.code) {
          switch (error.code) {
              case 'auth/email-already-in-use':
                  description = 'This email address is already in use by another account.';
                  break;
              case 'auth/weak-password':
                  description = 'The password is too weak. Please choose a stronger password.';
                  break;
              case 'auth/invalid-credential':
                  description = 'Your admin password was incorrect. Please try again.';
                  break;
          }
      }
      toast({
        variant: 'destructive',
        title: 'User Creation Failed',
        description: description,
      });
    } finally {
      setIsLoading(false);
      setNewUserPayload(null);
    }
  }

  return (
    <>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="name@example.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input placeholder="••••••••" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create User
                </Button>
            </form>
        </Form>
        <AlertDialog open={isPasswordPromptOpen} onOpenChange={setIsPasswordPromptOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Admin Authentication Required</AlertDialogTitle>
                    <AlertDialogDescription>
                        For security, please re-enter your (admin) password to create a new user. This is required to prevent your session from being interrupted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-2">
                    <Input
                        ref={adminPasswordRef}
                        type="password"
                        placeholder="Your Admin Password"
                    />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmCreateUser}>
                        Confirm & Create
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}
