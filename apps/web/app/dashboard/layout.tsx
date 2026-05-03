import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../lib/supabase-server';
import { GeenToegang } from './_components/GeenToegang';
import styles from './layout.module.css';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Leden', href: '/dashboard/leden' },
  { label: 'Teams', href: '/dashboard/teams' },
  { label: 'Activiteiten', href: '/dashboard/activiteiten' },
  { label: 'Aankondigingen', href: '/dashboard/aankondigingen' },
  { label: 'Gezinsverzoeken', href: '/dashboard/gezinsverzoeken' },
  { label: 'Rollen', href: '/dashboard/rollen' },
  { label: 'Instellingen', href: '/dashboard/instellingen' },
];

const ALLOWED_ROLES = ['beheerder', 'commissielid'];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return (
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarLogo}>
            <span className={styles.logoText}>SC Muiden</span>
          </div>
        </aside>
        <main className={styles.content}>
          <GeenToegang />
        </main>
      </div>
    );
  }

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
