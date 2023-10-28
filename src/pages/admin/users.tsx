import { type User } from "@prisma/client";
import { type NextPage } from "next";
import Image from "next/image";
import CreateUser from "~/components/User/Admin/Create";
import AdminBreadcrumbs from "~/components/utils/AdminBreadcrumbs";
import { api } from "~/utils/api";
import DeleteUser from "~/components/User/Admin/Delete";
import getRandomAvatar from "~/helpers/getRandomAvatar";

export const Users: NextPage = () => {
  const { data: users, refetch } = api.user.getAll.useQuery();
  const { mutateAsync: setAdminStatus } = api.user.setAdminStatus.useMutation({});

  const handleSetAdminStatus = async (user: User) => {
    await setAdminStatus({ id: user.id, isAdmin: !user.isAdmin });
    void refetch();
  }

  if (!users) return null;

  return (
    <div>
      <AdminBreadcrumbs
        currentPaths={["/admin/users"]}
        currentPathNames={["Users"]}
      />
      <h1>Users</h1>
      <CreateUser onUserCreated={() => void refetch()} />
      <table className="table">
        <thead>
          <tr>
            <th>Admin</th>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={user.isAdmin}
                  onChange={() => void handleSetAdminStatus(user)}
                />
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <div className="avatar">
                    <div className="w-6 rounded-full">
                      <Image
                        src={user.image ?? getRandomAvatar()}
                        alt={user.name ?? ""}
                        className="rounded-full"
                        width={50}
                        height={50}
                      />
                    </div>
                  </div>
                  <div>{user.name}</div>
                </div>
              </td>
              <td>{user.email}</td>
              <td>
                <DeleteUser 
                  userId={user.id} 
                  onUserDeleted={() => void refetch()}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;