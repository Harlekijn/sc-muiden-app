import { ReactNode } from 'react';
import styles from './layout.module.css';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Leden', href: '/dashboard/leden' },
  { label: 'Teams', href: '/dashboard/teams' },
  { label: 'Activiteiten', href: '/dashboard/activiteiten' },
  { label: 'Aankondigingen', href: '/dashboard/aankondigingen' },
  { label: 'Rollen', href: '/dashboard/rollen' },
  { label: 'Instellingen', href: '/dashboard/instellingen' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <span className={styles.logoText}>SC Muiden</span>
        </div>
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className={styles.navLink}>
              {item.label}
            </a>
          ))}
        </nav>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
