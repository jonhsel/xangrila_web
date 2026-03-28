import { verificarAdmin } from '@/lib/auth/admin';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AdminHeader } from '@/components/layout/admin-header';

export const metadata = {
  title: 'Painel Admin - Pousada Xangrilá',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { admin } = await verificarAdmin();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar admin={admin} />
      <div className="flex-1 flex flex-col lg:ml-64">
        <AdminHeader admin={admin} />
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
