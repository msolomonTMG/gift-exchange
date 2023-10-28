import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { type Request } from "@prisma/client";
import { useState, type FC } from "react";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Props = {
  request: Request;
  onCommentAdded: () => void;
}

export const AddComment: FC<Props> = ({ request, onCommentAdded }) => {
  const { mutateAsync: create, isLoading } = api.requestComment.create.useMutation({});
  const [text, setText] = useState<string>();
  const isDarkTheme = useIsDarkTheme();

  const handleCreate = async () => {
    console.log({ text });
    if (!text) return;
    try {
      await create({
        comment: text,
        requestId: request.id,
      });
      toast.success(`Comment added`, {
        theme: isDarkTheme ? 'dark' : 'light'
      });
      setText("");
      onCommentAdded();
    } catch (e) {
      const error = e as Error;
      console.error({ e });
      toast.error(`Error adding comment: ${error.message}`, {
        theme: isDarkTheme ? 'dark' : 'light'
      });
      return;
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 border bg-base-100 rounded-lg p-2">
      <textarea
        className="textarea w-full focus:outline-0"
        value={text}
        onChange={(e) => setText(e.target.value) }
      />
      <button 
        className="btn btn-ghost"
        disabled={isLoading}
        onClick={() => void handleCreate()}
      >
        {isLoading ? (
          <div className="loading loading-spinner h-6 w-6" />
        ) : (
          <PaperAirplaneIcon className="h-6 w-6" />
        )}
      </button>
    </div>
  )
}

export default AddComment;