import AdminConsole from '@/components/AdminConsole';

// Hidden console — not linked anywhere, and kept out of search engines.
export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}
