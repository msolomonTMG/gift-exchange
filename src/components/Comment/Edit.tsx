import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { type RequestComment } from "@prisma/client";
import { type FC, useState } from "react";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";
import { Portal } from "~/components/utils/Portal";

type Props = {
  comment: RequestComment;
  onCommentUpdated: () => void;
}

export const EditComment: FC<Props> = ({ comment, onCommentUpdated }) => {
  const { mutateAsync: update, isLoading } = api.requestComment.update.useMutation({});
  const [text, setText] = useState<string>(comment.comment);
  const isDarkTheme = useIsDarkTheme();

  const handleUpdate = async () => {
    console.log({ text });
    if (!text) return;
    try {
      await update({
        comment: text,
        id: comment.id,
      });
      toast.success(`Comment updated`, {
        theme: isDarkTheme ? 'dark' : 'light'
      });
      onCommentUpdated();
    } catch (e) {
      const error = e as Error;
      console.error({ e });
      toast.error(`Error updating comment: ${error.message}`, {
        theme: isDarkTheme ? 'dark' : 'light'
      });
      return;
    } finally  {
      // close the modal
      (document.getElementById(`edit_comment_${comment.id}_modal`) as HTMLDialogElement).close();
    }
  }

  return (
    <>
      <button className="btn btn-xs btn-ghost" onClick={()=>(document.getElementById(`edit_comment_${comment.id}_modal`) as HTMLDialogElement).showModal()}>
        Edit
      </button>
      <Portal>
        <dialog id={`edit_comment_${comment.id}_modal`} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Edit Comment
            </h3>
            <div className="flex flex-col items-end gap-2 border bg-base-100 rounded-lg p-2">
              <textarea
                className="textarea w-full focus:outline-0"
                value={text}
                onChange={(e) => setText(e.target.value) }
              />
              <div className="flex items-center w-full justify-between">
                <form method="dialog">
                  <button className="btn btn-sm btn-ghost">Cancel</button>
                </form>
                <button 
                  className="btn btn-sm btn-ghost"
                  disabled={isLoading}
                  onClick={() => void handleUpdate()}
                >
                  {isLoading ? (
                    <div className="loading loading-spinner h-6 w-6" />
                  ) : (
                    <PaperAirplaneIcon className="h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </dialog>
      </Portal>
    </>
  )
}

export default EditComment;