import type { AdminModule } from "@/content/admin";
import AdminIcon from "./AdminIcon";
import s from "./admin.module.css";

/** A console module still in design: what it will hold. */
export default function AdminHolding({ mod }: { mod: AdminModule }) {
  return (
    <div className={s.page}>
      <header className={s.holdingHead}>
        <span className={s.holdingIcon}>
          <AdminIcon id={mod.icon} />
        </span>
        <div>
          <p className={s.kicker}>In design</p>
          <h1 className={s.pageTitle}>{mod.label}</h1>
          <p className={s.pageLine}>{mod.line}.</p>
        </div>
      </header>
      {mod.holds && (
        <section className={s.card} aria-labelledby="holds-title">
          <h2 id="holds-title" className={s.cardTitle}>
            What this module will hold
          </h2>
          <ul className={s.holds}>
            {mod.holds.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
