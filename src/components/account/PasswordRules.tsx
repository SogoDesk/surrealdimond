import { checkPassword } from "@/lib/auth";
import s from "./account.module.css";

/** The password rules as a live checklist, with a strength meter (set up, change password). */
export default function PasswordRules({ password, email, company }: { password: string; email: string; company: string }) {
  const check = checkPassword(password, { email, company });
  return (
    <div className={s.rules}>
      <div className={s.meter} data-score={check.score} aria-hidden>
        <span />
        <span />
        <span />
        <span />
      </div>
      <p className={s.meterLabel} aria-live="polite">
        {password ? `Strength: ${check.label}` : "Your password must have:"}
      </p>
      <ul className={s.ruleList}>
        {check.rules.map((r) => (
          <li key={r.id} data-ok={r.ok || undefined}>
            <svg aria-hidden viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              {r.ok ? <path d="M3.5 8.5l3 3 6-7" /> : <circle cx="8" cy="8" r="2" />}
            </svg>
            {r.label}
            <span className={s.srOnly}>{r.ok ? ", done" : ", not yet"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
