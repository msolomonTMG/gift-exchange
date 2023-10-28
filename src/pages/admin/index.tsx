import { BuildingOffice2Icon, ClipboardDocumentListIcon, HandThumbUpIcon, PlayPauseIcon, QueueListIcon, Square3Stack3DIcon, StopCircleIcon, UsersIcon } from "@heroicons/react/24/outline";
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
      title: "Departments",
      description: "Create and manage departments",
      path: "/admin/departments",
      icon: <BuildingOffice2Icon className="h-6 w-6 stroke-2" />
    },
    {
      title: "Approvers",
      description: "Create and manage approvers",
      path: "/admin/approvers",
      icon: <HandThumbUpIcon className="h-6 w-6 stroke-2" />
    },
    {
      title: "Workflow Stages",
      description: "Create and manage the steps of a workflow",
      path: "/admin/stages",
      icon: <StopCircleIcon className="h-6 w-6 stroke-2" />
    },
    {
      title: "Workflows",
      description: "Create and manage workflows for request types",
      path: "/admin/workflows",
      icon: <QueueListIcon className="h-6 w-6 stroke-2" />
    },
    {
      title: "Request Types",
      description: "Create and manage request types",
      path: "/admin/request-types",
      icon: <Square3Stack3DIcon className="h-6 w-6 stroke-2" />
    },
    {
      title: "Request Fields",
      description: "Create and manage request fields for request types",
      path: "/admin/request-fields",
      icon: <ClipboardDocumentListIcon className="h-6 w-6 stroke-2" />
    },
    {
      title: "Request Statuses",
      description: "Create and manage request statuses",
      path: "/admin/request-statuses",
      icon: <PlayPauseIcon className="h-6 w-6 stroke-2" />
    },
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