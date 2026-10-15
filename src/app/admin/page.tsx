import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminApp } from "@/components/admin/AdminApp/AdminApp";
import { Login } from "@/components/admin/Login/Login";
import { getAdmin, loadAdminData } from "@/features/admin/server";

export const metadata: Metadata = { title: "Админ-панель", robots: { index: false, follow: false } };

/** /admin — sign-in or the panel. `?edit=KZ-001` opens a product card, `?tab=req` a section. */
export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense>
      <Admin searchParams={searchParams} />
    </Suspense>
  );
}

async function Admin({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  // Request time only: the session check reads the clock (token expiry), which a prerender must not.
  await connection();
  const session = await getAdmin();
  if (!session) return <Login />;
  const [data, params] = await Promise.all([loadAdminData(session.db), searchParams]);
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  return <AdminApp admin={session.admin} data={data} edit={one(params.edit)} tab={one(params.tab)} />;
}
