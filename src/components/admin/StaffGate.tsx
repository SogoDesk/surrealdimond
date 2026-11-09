"use client";

/**
 * Staff sign in through the API, when API_AUTH is on: email and password, then a
 * code for anyone who has turned two-factor on. Two-factor is optional, and each
 * person turns it on or off from the console's top bar (StaffTwoFactor below).
 */

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import PasswordRules from "@/components/account/PasswordRules";
import { checkPassword } from "@/lib/auth";
import { authApi, toStaffSession, type Me, type MfaBegin } from "@/lib/api/auth";
import { ApiRequestError } from "@/lib/api/client";
import { clearDealer } from "@/lib/dealer";
import { setStaffSession } from "@/lib/staff";
import s from "./admin.module.css";

type Step =
  | { name: "loading" }
  | { name: "password" }
  | { name: "dealer" }
  | { name: "code" }
  | { name: "recovery" };

const NO_SERVER = "We could not reach the server. Please try again.";

function messageOf(error: unknown, field?: string): string {
  if (!(error instanceof ApiRequestError)) return NO_SERVER;
  return (field && error.fields?.[field]) || error.message;
}

/** Where a session goes next, from what the API says about it. Null opens the console. */
function nextStep(me: Me): Step | null {
  if (me.dealer) return { name: "dealer" };
  return me.staff?.mfa === "code_required" ? { name: "code" } : null;
}

export default function StaffGate() {
  const [step, setStep] = useState<Step>({ name: "loading" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const advance = (me: Me) => {
    const following = nextStep(me);
    if (following) {
      setCode("");
      setStep(following);
    } else {
      setStaffSession(toStaffSession(me));
    }
  };

  useEffect(() => {
    let live = true;
    authApi
      .me()
      .then((me) => {
        const following = nextStep(me);
        if (!live) return;
        if (following) setStep(following);
        else setStaffSession(toStaffSession(me));
      })
      .catch(() => {
        if (live) setStep({ name: "password" });
      });
    return () => {
      live = false;
    };
  }, []);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await work();
    } finally {
      setBusy(false);
    }
  };

  const submitPassword = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      try {
        clearDealer();
        advance(await authApi.login(email.trim(), password));
        setPassword("");
      } catch (err) {
        if (err instanceof ApiRequestError && err.code === "no_account") setError("We could not find a staff login for that email.");
        else if (err instanceof ApiRequestError && err.code === "setup_required") setError("This login has no password yet. Use the setup link you were sent.");
        else setError(messageOf(err, "password"));
      }
    });
  };

  const submitCode = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      try {
        await authApi.mfaVerify(code.trim());
        advance(await authApi.me());
      } catch (err) {
        setError(messageOf(err, "code"));
      }
    });
  };

  const submitRecovery = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      try {
        await authApi.mfaRecover(code.trim());
        advance(await authApi.me());
      } catch (err) {
        setError(messageOf(err, "code"));
      }
    });
  };

  const useAnotherLogin = () => {
    void run(async () => {
      await authApi.logout().catch(() => undefined);
      clearDealer();
      setCode("");
      setStep({ name: "password" });
    });
  };

  const errorLine = error ? (
    <p className={s.error} role="alert">
      {error}
    </p>
  ) : null;

  const codeField = (
    <label className={s.field}>
      <span className={s.label}>6 digit code</span>
      <input className={s.input} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
    </label>
  );

  return (
    <main className={s.signin} data-console>
      <div className={s.signinCard}>
        <p className={s.wordmark}>
          SURREAL <span>Console</span>
        </p>

        {step.name === "loading" && <p className={s.signinLine} aria-busy="true">Checking your session</p>}

        {step.name === "password" && (
          <form className={s.gateForm} onSubmit={submitPassword} noValidate>
            <h1 className={s.signinTitle}>Staff sign in</h1>
            <label className={s.field}>
              <span className={s.label}>Email</span>
              <input className={s.input} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </label>
            <label className={s.field}>
              <span className={s.label}>Password</span>
              <input className={s.input} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {errorLine}
            <button type="submit" className={s.primary} disabled={busy || !email || !password}>
              {busy ? "Checking" : "Sign in"}
            </button>
          </form>
        )}

        {step.name === "dealer" && (
          <div className={s.gateForm}>
            <h1 className={s.signinTitle}>This is for Surreal staff</h1>
            <p className={s.signinLine}>You are signed in with a dealer account, which does not open the console.</p>
            <button type="button" className={s.primary} disabled={busy} onClick={useAnotherLogin}>
              Sign in with a staff login
            </button>
          </div>
        )}

        {step.name === "code" && (
          <form className={s.gateForm} onSubmit={submitCode} noValidate>
            <h1 className={s.signinTitle}>Enter your code</h1>
            <p className={s.signinLine}>Open your authenticator app and enter the 6 digit code for Surreal Diamond.</p>
            {codeField}
            {errorLine}
            <button type="submit" className={s.primary} disabled={busy || code.trim().length !== 6}>
              {busy ? "Checking" : "Continue"}
            </button>
            <button
              type="button"
              className={s.gateLink}
              onClick={() => {
                setCode("");
                setError("");
                setStep({ name: "recovery" });
              }}
            >
              Lost your phone? Use a recovery code
            </button>
          </form>
        )}

        {step.name === "recovery" && (
          <form className={s.gateForm} onSubmit={submitRecovery} noValidate>
            <h1 className={s.signinTitle}>Use a recovery code</h1>
            <p className={s.signinLine}>Each recovery code works once.</p>
            <label className={s.field}>
              <span className={s.label}>Recovery code</span>
              <input className={s.input} autoComplete="off" value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
            </label>
            {errorLine}
            <button type="submit" className={s.primary} disabled={busy || !code.trim()}>
              {busy ? "Checking" : "Continue"}
            </button>
          </form>
        )}

        <div className={s.gateFoot}>
          {step.name !== "password" && step.name !== "loading" && step.name !== "dealer" && (
            <button type="button" className={s.gateLink} disabled={busy} onClick={useAnotherLogin}>
              Use another login
            </button>
          )}
          <Link href="/" className={s.backLink}>
            Back to the site
          </Link>
        </div>
      </div>
    </main>
  );
}

type TwoFactorStep =
  | { name: "loading" }
  | { name: "off" }
  | { name: "setup"; begin: MfaBegin }
  | { name: "codes"; codes: string[] }
  | { name: "on" };

/**
 * Staff turn two-factor on or off for themselves, from the console's top bar.
 * Setting it up shows a QR code to scan and recovery codes to keep; turning it
 * off asks for the password.
 */
export function StaffTwoFactor({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<TwoFactorStep>({ name: "loading" });
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    authApi
      .me()
      .then((me) => {
        if (live) setStep(me.staff?.mfa === "ok" ? { name: "on" } : { name: "off" });
      })
      .catch((err: unknown) => {
        if (live) {
          setStep({ name: "off" });
          setError(messageOf(err));
        }
      });
    return () => {
      live = false;
    };
  }, []);

  const run = async (work: () => Promise<void>, field?: string) => {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (err) {
      setError(messageOf(err, field));
    } finally {
      setBusy(false);
    }
  };

  const begin = () =>
    void run(async () => {
      const started = await authApi.mfaBegin();
      setCode("");
      setStep({ name: "setup", begin: started });
    });

  const confirm = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const result = await authApi.mfaVerify(code.trim());
      setCode("");
      setStep(result.recoveryCodes?.length ? { name: "codes", codes: result.recoveryCodes } : { name: "on" });
    }, "code");
  };

  const turnOff = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await authApi.mfaDisable(password);
      setPassword("");
      setStep({ name: "off" });
    }, "password");
  };

  const errorLine = error ? (
    <p className={s.error} role="alert">
      {error}
    </p>
  ) : null;

  const close = (
    <button type="button" className={s.gateLink} onClick={onClose}>
      Close
    </button>
  );

  return (
    <section className={s.passwordPanel} aria-labelledby="staff-two-factor">
      <h2 id="staff-two-factor" className={s.pageTitle}>
        Two-factor
      </h2>

      {step.name === "loading" && <p aria-busy="true">Checking your account</p>}

      {step.name === "off" && (
        <div className={s.gateForm}>
          <p>Two-factor is off. It is optional: turn it on and each sign in also asks for a 6 digit code from an authenticator app on your phone.</p>
          {errorLine}
          <div className={s.gateFoot}>
            <button type="button" className={s.primary} disabled={busy} onClick={begin}>
              {busy ? "Starting" : "Set up two-factor"}
            </button>
            {close}
          </div>
        </div>
      )}

      {step.name === "setup" && (
        <form className={s.gateForm} onSubmit={confirm} noValidate>
          <p>Scan this with an authenticator app, then enter the 6 digit code it shows.</p>
          <Image className={s.qr} src={step.begin.qrDataUrl} alt="QR code for your authenticator app" width={220} height={220} unoptimized />
          <p className={s.signinNote}>
            Cannot scan it? Enter this key in the app: <code className={s.secretKey}>{step.begin.secret}</code>
          </p>
          <label className={s.field}>
            <span className={s.label}>6 digit code</span>
            <input className={s.input} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoFocus />
          </label>
          {errorLine}
          <div className={s.gateFoot}>
            <button type="submit" className={s.primary} disabled={busy || code.trim().length !== 6}>
              {busy ? "Checking" : "Turn on two-factor"}
            </button>
            <button
              type="button"
              className={s.gateLink}
              onClick={() => {
                setError("");
                setStep({ name: "off" });
              }}
            >
              Not now
            </button>
          </div>
        </form>
      )}

      {step.name === "codes" && (
        <div className={s.gateForm}>
          <p>Two-factor is on. If you lose your phone, each of these codes lets you in once. They will not be shown again, so keep them somewhere safe.</p>
          <ul className={s.codeList}>
            {step.codes.map((value) => (
              <li key={value}>
                <code>{value}</code>
              </li>
            ))}
          </ul>
          <button type="button" className={s.primary} onClick={() => setStep({ name: "on" })}>
            I have saved them
          </button>
        </div>
      )}

      {step.name === "on" && (
        <form className={s.gateForm} onSubmit={turnOff} noValidate>
          <p>Two-factor is on, so each sign in asks for a code from your authenticator app. To turn it off, enter your password.</p>
          <label className={s.field}>
            <span className={s.label}>Password</span>
            <input className={s.input} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {errorLine}
          <div className={s.gateFoot}>
            <button type="submit" className={s.primary} disabled={busy || !password}>
              {busy ? "Checking" : "Turn off two-factor"}
            </button>
            {close}
          </div>
        </form>
      )}
    </section>
  );
}

/** Staff change their own password, from the console's top bar. */
export function StaffPassword({ email, onClose }: { email: string; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setDone(false);
    setError("");
    if (!checkPassword(next, { email }).valid) return setError("The new password does not meet every rule yet.");
    if (next !== confirm) return setError("The two new passwords do not match.");
    setBusy(true);
    try {
      await authApi.changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      setDone(true);
    } catch (err) {
      const fields = err instanceof ApiRequestError ? err.fields : undefined;
      setError(fields?.current ?? fields?.next ?? messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={s.passwordPanel} aria-labelledby="staff-password">
      <h2 id="staff-password" className={s.pageTitle}>
        Change your password
      </h2>
      <form className={s.gateForm} onSubmit={submit} noValidate>
        <label className={s.field}>
          <span className={s.label}>Current password</span>
          <input className={s.input} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </label>
        <label className={s.field}>
          <span className={s.label}>New password</span>
          <input className={s.input} type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </label>
        <PasswordRules password={next} email={email} company="" />
        <label className={s.field}>
          <span className={s.label}>Confirm new password</span>
          <input className={s.input} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {error && (
          <p className={s.error} role="alert">
            {error}
          </p>
        )}
        {done && <p role="status">Password changed. Other sessions have been signed out.</p>}
        <div className={s.gateFoot}>
          <button type="submit" className={s.primary} disabled={busy || !current || !next}>
            {busy ? "Saving" : "Change password"}
          </button>
          <button type="button" className={s.gateLink} onClick={onClose}>
            Close
          </button>
        </div>
      </form>
    </section>
  );
}
