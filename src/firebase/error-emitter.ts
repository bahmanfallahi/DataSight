import { EventEmitter } from 'events';

// A simple event emitter that is used to broadcast Firestore permission errors.
// When a Firestore operation fails due to security rules, the code will emit a 'permission-error' event
// on this emitter, passing the FirestorePermissionError as the payload.
// The FirebaseErrorListener component listens for this event and displays the error in the
// Next.js error overlay. This decouples the error handling logic from the data access logic.

class ErrorEmitter extends EventEmitter {}

export const errorEmitter = new ErrorEmitter();
