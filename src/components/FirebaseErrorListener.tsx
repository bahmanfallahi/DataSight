'use client';
import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

// This component listens for 'permission-error' events on the errorEmitter.
// When an event is received, it throws the error. In a Next.js development environment,
// this will trigger the error overlay, displaying the rich, contextual error message
// from the FirestorePermissionError. This provides immediate, actionable feedback to the
// developer about why a security rule was violated.
// In a production environment, this would likely be integrated with a logging or monitoring service.
export default function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error('Caught a Firestore permission error:', error.message);
      
      // Throw the error to make it visible in the Next.js development error overlay.
      // This is the primary mechanism for debugging security rules.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      } else {
        // In production, just show a generic toast notification.
        toast({
          variant: "destructive",
          title: "Permission Denied",
          description: "You don't have permission to perform this action.",
        });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null; // This component does not render anything.
}
