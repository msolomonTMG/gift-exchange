import { TrashIcon } from "@heroicons/react/24/outline";
import { type FC } from "react";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Props = {
  userId: string;
  onUserDeleted: () => void;
}

export const DeleteUser: FC<Props> = ({ userId, onUserDeleted }) => {
  const { mutateAsync: deleteUser, isLoading } = api.user.deleteUser.useMutation({});
  const isDarkTheme = useIsDarkTheme();

  const handleDelete = async () => {
    try {
      await deleteUser({ id: userId });
      void onUserDeleted();
      toast.success(`User deleted successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    } catch (e) {
      const error = e as Error;
      toast.error('Error deleting user: ' + error.message, {
        theme: isDarkTheme ? "dark" : "light",
      });
    } finally {
      // close the modal
      (document.getElementById(`delete_user_${userId}_modal`) as HTMLDialogElement).close();
    }
  }

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={()=>(document.getElementById(`delete_user_${userId}_modal`) as HTMLDialogElement).showModal()}>
        <TrashIcon className="h-4 w-4" />
      </button>
      <dialog id={`delete_user_${userId}_modal`} className="modal">
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg">Delete User</h3>
          <p className="my-4">
            Are you sure you want to delete this user? <strong>This action cannot be undone by anyone.</strong>
          </p>
          <div className="flex items-center justify-end w-full gap-2">
            <button className="btn btn-error" onClick={() => void handleDelete()}>
              {isLoading && <span className="loading loading-spinner" />}
              Delete
            </button>
            <button className="btn" onClick={() => (document.getElementById(`delete_user_${userId}_modal`) as HTMLDialogElement).close()}>
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
};

export default DeleteUser;