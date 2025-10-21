// A specialized error class for Firestore permission errors.
// This class is designed to be thrown when a Firestore operation fails due to security rules.
// It captures the context of the operation that was denied, such as the path, operation type,
// and the data that was being sent. This rich context is then used by the FirebaseErrorListener
// to provide a detailed, actionable error message to the developer in the Next.js error overlay,
// which is crucial for debugging security rules during development.

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(context, null, 2)}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
    // This is to make the error message more readable in the Next.js error overlay
    this.stack = '';
  }
}
