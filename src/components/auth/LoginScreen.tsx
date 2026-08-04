import React, { useState } from "react";
import { LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const LoginScreen: React.FC = () => {
  const { signInEmail, signInGoogle, accessError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch {
      setError("No se pudo iniciar sesión. Verifique sus credenciales o contacte al administrador.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl" aria-labelledby="login-title">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center"><ShieldCheck className="text-white" /></div>
          <div>
            <h1 id="login-title" className="text-xl font-bold text-white">ITERA Care</h1>
            <p className="text-sm text-slate-400">Acceso autorizado solamente</p>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run(() => signInEmail(email, password));
          }}
        >
          <label className="block text-sm text-slate-300">
            Correo corporativo
            <input className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm text-slate-300">
            Contraseña
            <input className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {(error || accessError) && <p role="alert" className="rounded-xl bg-rose-950/60 border border-rose-800 p-3 text-sm text-rose-200">{error || accessError}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" /> Iniciar sesión
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-800" />o<span className="h-px flex-1 bg-slate-800" /></div>
        <button disabled={busy} onClick={() => void run(signInGoogle)} className="w-full rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-200 disabled:opacity-50 flex items-center justify-center gap-2">
          <LockKeyhole className="w-4 h-4" /> Continuar con Google Workspace
        </button>
        <p className="mt-6 text-xs leading-relaxed text-slate-500">La creación de cuentas y la asignación de roles se realizan exclusivamente por administradores autorizados.</p>
      </section>
    </main>
  );
};
