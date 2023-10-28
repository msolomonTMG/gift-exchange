import { UsersIcon } from "@heroicons/react/24/outline";
import { type NextPage } from "next"
import Link from "next/link";
import { type ReactNode } from "react";

export const Admin: NextPage = () => {
  type AdminPage = {
    title: string;
    description: string;
    path: string;
    icon: ReactNode;
  };
  const pages: AdminPage[] = [
    {
      title: "Users",
      description: "Manage users",
      path: "/admin/users",
      icon: <UsersIcon className="h-6 w-6 stroke-2" />
    }
  ]
  return (
    <div>
      <h1>Admin</h1>
      <div className="grid grid-cols-1 gap-2">
        {pages.map(page => (
          <Link
            key={page.path}
            href={page.path}
            className="flex w-full rounded border p-6 items-center gap-2 bg-base-200"
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {page.icon}
                <h3 className="text-xl font-bold">{page.title}</h3>
              </div>
              <p className="ml-8">{page.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
};

export default Admin;