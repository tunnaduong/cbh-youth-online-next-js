import AdminShell from "./AdminShell";

export const metadata = {
  title: "Admin — CBH Youth Online",
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
