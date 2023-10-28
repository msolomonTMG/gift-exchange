import { type RequestComment } from "@prisma/client";
import { type FC } from "react";
import { toast } from "react-toastify";
import { Portal } from "~/components/utils/Portal";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Props = {
  comment: RequestComment;
  onCommentDeleted: () => void;
}

export const DeleteComment: FC<Props> = ({ comment, onCommentDeleted }) => {
  const { mutateAsync: deleteComment, isLoading } = api.requestComment.delete.useMutation({});
  const isDarkTheme = useIsDarkTheme();

  const handleDelete = async () => {
    try {
      await deleteComment({
        id: comment.id,
      });
      toast.success(`Comment deleted`, {
        theme: isDarkTheme ? 'dark' : 'light'
      });
      onCommentDeleted();
    } catch (e) {
      const error = e as Error;
      console.error({ e });
      toast.error(`Error deleting comment: ${error.message}`, {
        theme: isDarkTheme ? 'dark' : 'light'
      });
      return;
    } finally  {
      // close the modal
      (document.getElementById(`delete_comment_${comment.id}_modal`) as HTMLDialogElement).close();
    }
  }

  return (
    <>
      <button className="btn btn-xs btn-ghost" onClick={()=>(document.getElementById(`delete_comment_${comment.id}_modal`) as HTMLDialogElement).showModal()}>
        Delete
      </button>
      <Portal>
        <dialog id={`delete_comment_${comment.id}_modal`} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Delete Comment
            </h3>
            <p className="my-4">Are you sure you want to delete this comment? This action cannot be undone.</p>
            <div className="flex items-center gap-2 justify-end">
              <form method="dialog">
                <button className="btn btn-ghost">Cancel</button>
              </form>
              <button 
                className="btn btn-error"
                disabled={isLoading}
                onClick={() => void handleDelete()}
              >
                {isLoading ? (
                  <div className="loading loading-spinner h-6 w-6" />
                ) : (
                  'Delete Comment'
                )}
              </button>
            </div>
          </div>
        </dialog>
      </Portal>
    </>
  )
}

export default DeleteComment;