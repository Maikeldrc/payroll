import { FirebaseError, initializeApp, getApp, getApps } from "firebase/app";
import {
  getMultiFactorResolver,
  inMemoryPersistence,
  getAuth,
  GoogleAuthProvider,
  multiFactor,
  MultiFactorError,
  MultiFactorResolver,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  TotpMultiFactorGenerator,
  TotpSecret,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
// Tokens are intentionally memory-only; a browser refresh requires re-authentication.
export const authPersistenceReady = setPersistence(auth, inMemoryPersistence);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export interface TotpSignInChallenge {
  resolver: MultiFactorResolver;
  enrollmentId: string;
}

export interface TotpEnrollmentChallenge {
  secret: TotpSecret;
  secretKey: string;
  qrCodeUrl: string;
}

export async function signInWithGoogle(): Promise<User> {
  await authPersistenceReady;
  return (await signInWithPopup(auth, googleProvider)).user;
}

export function getTotpSignInChallenge(error: unknown): TotpSignInChallenge | null {
  if (!(error instanceof FirebaseError) || error.code !== "auth/multi-factor-auth-required") return null;
  const resolver = getMultiFactorResolver(auth, error as MultiFactorError);
  const hint = resolver.hints.find((candidate) => candidate.factorId === TotpMultiFactorGenerator.FACTOR_ID);
  return hint ? { resolver, enrollmentId: hint.uid } : null;
}

export async function resolveTotpSignIn(challenge: TotpSignInChallenge, code: string): Promise<User> {
  const assertion = TotpMultiFactorGenerator.assertionForSignIn(challenge.enrollmentId, code);
  return (await challenge.resolver.resolveSignIn(assertion)).user;
}

export function hasTotpEnrollment(user: User): boolean {
  return multiFactor(user).enrolledFactors.some((factor) => factor.factorId === TotpMultiFactorGenerator.FACTOR_ID);
}

export async function beginTotpEnrollment(user: User): Promise<TotpEnrollmentChallenge> {
  const session = await multiFactor(user).getSession();
  const secret = await TotpMultiFactorGenerator.generateSecret(session);
  return {
    secret,
    secretKey: secret.secretKey,
    qrCodeUrl: secret.generateQrCodeUrl(user.email || user.uid, "ITERA Care"),
  };
}

export async function completeTotpEnrollment(
  user: User,
  challenge: TotpEnrollmentChallenge,
  code: string,
): Promise<void> {
  const assertion = TotpMultiFactorGenerator.assertionForEnrollment(challenge.secret, code);
  await multiFactor(user).enroll(assertion, "Google Authenticator");
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  await authPersistenceReady;
  return (await signInWithEmailAndPassword(auth, email, password)).user;
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
