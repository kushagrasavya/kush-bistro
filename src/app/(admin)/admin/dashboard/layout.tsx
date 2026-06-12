import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // THE BARRIER: If no valid session exists, instantly bounce them to login
  if (error || !user) {
    redirect('/admin/login'); 
  }

  // If they pass the check, render the dashboard
  return <>{children}</>;
}