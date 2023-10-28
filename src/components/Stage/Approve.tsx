import { type RequestType, type Request, type RequestStatus, type User } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useState, type FC } from "react";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";
import { Portal } from "~/components/utils/Portal";

type RequestWithContext = Request & {
  requestType: RequestType;
  status: RequestStatus;
  currentApprovers: User[];
}

type Props = {
  request: RequestWithContext;
  onApproved: () => void;
}

export const ApproveStage: FC<Props> = ({ request, onApproved }) => {
  const { data: session } = useSession();
  const { mutateAsync: createComment } = api.requestComment.create.useMutation({});
  const { mutateAsync: approve, isLoading } = api.request.approve.useMutation({});

  const [commentText, setCommentText] = useState<string>();
  const isDarkTheme = useIsDarkTheme();
  if (request.currentApprovers.filter((approver) => approver.id === session?.user?.id).length === 0) {
    return null;
  }

  const handleApprove = async () => {
    try {
      await approve({ id: request.id });
      if (commentText !== "" && commentText) {
        await createComment({
          comment: commentText,
          requestId: request.id,
        });
      }
      toast.success("Request approved", {
        theme: isDarkTheme ? "dark" : "light",
      });
      void onApproved();
    } catch (e) {
      const error = e as Error;
      toast.error(`Error approving: ${error.message}`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    } finally {
      // close the modal
      (document.getElementById(`approve_modal`) as HTMLDialogElement).close();
    }
  }

  if (request.status.name !== "Pending") {
    return null;
  }

  return (
    <>
      <button className="btn btn-success" onClick={()=>(document.getElementById(`approve_modal`) as HTMLDialogElement).showModal()}>
        Approve
      </button>
      <Portal>
        <dialog id={`approve_modal`} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Approve Request
            </h3>
            <p className="my-4">Approving this request will move it to the next stage of the workflow.</p>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text-alt">Optional Comment</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value) }
              />
            </div>
            <div className="flex gap-2 items-center justify-end">
              <form method="dialog">
                <button className="btn btn-ghost">Cancel</button>
              </form>
              <button 
                className="btn btn-success"
                disabled={isLoading}
                onClick={() => void handleApprove()}
              >
                {isLoading && (
                  <div className="loading loading-spinner" />
                )}
                Approve
              </button>
            </div>
          </div>
        </dialog>
      </Portal>
    </>
  )
};

export default ApproveStage;