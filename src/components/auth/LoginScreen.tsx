import React, { useState } from "react";
import { KeyRound, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { useAuth } from "../../context/AuthContext";
import type { TotpEnrollmentChallenge } from "../../lib/firebase";

export const LoginScreen: React.FC = () => {
  const {
    signInEmail,
    signInGoogle,
    accessError,
    totpSignInRequired,
    totpEnrollmentRequired,
    beginTotpSetup,
    completeTotpSetup,
    verifyTotpSignIn,
    logout,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [enrollment, setEnrollment] = useState<TotpEnrollmentChallenge | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

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

  const startTotpSetup = async () => {
    setBusy(true);
    setError(null);
    try {
      const challenge = await beginTotpSetup();
      const dataUrl = await QRCode.toDataURL(challenge.qrCodeUrl, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 240,
      });
      setEnrollment(challenge);
      setQrDataUrl(dataUrl);
    } catch {
      setError("No se pudo iniciar la configuración de Google Authenticator. Vuelva a iniciar sesión.");
    } finally {
      setBusy(false);
    }
  };

  const submitTotpEnrollment = async () => {
    if (!enrollment || !/^\d{6}$/.test(totpCode)) {
      setError("Ingrese el código de seis dígitos de Google Authenticator.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await completeTotpSetup(enrollment, totpCode);
      setEnrollment(null);
      setQrDataUrl(null);
      setTotpCode("");
    } catch {
      setError("El código no es válido o venció. Ingrese el código actual de Google Authenticator.");
    } finally {
      setBusy(false);
    }
  };

  const submitTotpSignIn = async () => {
    if (!/^\d{6}$/.test(totpCode)) {
      setError("Ingrese el código de seis dígitos de Google Authenticator.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await verifyTotpSignIn(totpCode);
      setTotpCode("");
    } catch {
      setError("El código no es válido o venció. Ingrese el código actual de Google Authenticator.");
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

        {totpEnrollmentRequired ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Configura Google Authenticator</h2>
              <p className="mt-1 text-sm text-slate-400">Este segundo factor es obligatorio para el acceso administrativo.</p>
            </div>
            {!enrollment ? (
              <button disabled={busy} onClick={() => void startTotpSetup()} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2">
                <KeyRound className="w-4 h-4" /> Generar código QR
              </button>
            ) : (
              <>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-300">
                  <li>Abra Google Authenticator y pulse el botón +.</li>
                  <li>Seleccione “Escanear un código QR”.</li>
                  <li>Escanee este código e ingrese el número de seis dígitos.</li>
                </ol>
                {qrDataUrl && <img src={qrDataUrl} alt="Código QR para configurar Google Authenticator" className="mx-auto w-60 rounded-xl bg-white p-2" />}
                <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
                  <p className="text-xs text-slate-400">Clave manual</p>
                  <code className="mt-1 block break-all text-sm text-slate-200">{enrollment.secretKey}</code>
                </div>
                <label className="block text-sm text-slate-300">
                  Código de Google Authenticator
                  <input className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center font-mono text-xl tracking-[0.35em] text-white" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
                </label>
                <button disabled={busy} onClick={() => void submitTotpEnrollment()} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50">Confirmar y entrar</button>
              </>
            )}
            {(error || accessError) && <p role="alert" className="rounded-xl bg-rose-950/60 border border-rose-800 p-3 text-sm text-rose-200">{error || accessError}</p>}
            <button disabled={busy} onClick={() => void logout("mfa-setup-cancelled")} className="w-full px-4 py-2 text-sm text-slate-400 disabled:opacity-50">Cancelar y cerrar sesión</button>
          </div>
        ) : totpSignInRequired ? (
          <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void submitTotpSignIn(); }}>
            <div>
              <h2 className="text-lg font-semibold text-white">Verificación en dos pasos</h2>
              <p className="mt-1 text-sm text-slate-400">Ingrese el código actual de Google Authenticator.</p>
            </div>
            <label className="block text-sm text-slate-300">
              Código de seis dígitos
              <input autoFocus className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center font-mono text-xl tracking-[0.35em] text-white" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
            </label>
            {(error || accessError) && <p role="alert" className="rounded-xl bg-rose-950/60 border border-rose-800 p-3 text-sm text-rose-200">{error || accessError}</p>}
            <button disabled={busy} className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white disabled:opacity-50">Verificar y entrar</button>
          </form>
        ) : <form
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
        </form>}

        {!totpEnrollmentRequired && !totpSignInRequired && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-800" />o<span className="h-px flex-1 bg-slate-800" /></div>
            <button disabled={busy} onClick={() => void run(signInGoogle)} className="w-full rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-200 disabled:opacity-50 flex items-center justify-center gap-2">
              <LockKeyhole className="w-4 h-4" /> Continuar con Google Workspace
            </button>
            <p className="mt-6 text-xs leading-relaxed text-slate-500">La creación de cuentas y la asignación de roles se realizan exclusivamente por administradores autorizados.</p>
          </>
        )}
      </section>
    </main>
  );
};
