import { Header } from "@/components/Header";
import { AdminClient } from "@/components/AdminClient";

export default function AdminPage() {
  return (
    <main>
      <Header showAdmin />
      <AdminClient />
    </main>
  );
}
