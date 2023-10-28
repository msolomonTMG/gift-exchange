import { type RequestType, type Request, type RequestStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useState, type FC } from "react";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";
import { Portal } from "../utils/Portal";

type RequestWithRequestTypeAndStatus = Request & {
  requestType: RequestType;
  status: RequestStatus;
}

type Props = {
  request: RequestWithRequestTypeAndStatus;
  onRejected: () => void;
}

export const RejectStage: FC<Props> = ({ request, onRejected }) => {
  const { data: session } = useSession();
  const { mutateAsync: reject, isLoading } = api.request.reject.useMutation({});
  const { mutateAsync: createComment } = api.requestComment.create.useMutation({});
  const { data: workflow } = api.workflow.getById.useQuery({
    id: request.requestType.workflowId,
    includeStages: true,
  }, {
    enabled: request.requestType.workflowId !== undefined
  });
  const { data: stageApprovers } = api.departmentStageApprover.getAllByDepartmentIdAndStageIds.useQuery({
    departmentId: request.departmentId,
    stageIds: workflow?.stages.map(stage => stage.stageId) ?? [],
  }, {
    enabled: request.departmentId !== undefined && workflow !== undefined
  });
  const [commentText, setCommentText] = useState<string>();

  const isDarkTheme = useIsDarkTheme();
  // if the user id in the session is not in the current approvers array, return null
  if (stageApprovers?.findIndex(stageApprover => stageApprover.userId === session?.user?.id) === -1) {
    return null;
  }

  const handleReject = async () => {
    try {
      await reject({ id: request.id });
      if (commentText !== "" && commentText) {
        await createComment({
          comment: commentText,
          requestId: request.id,
        });
      }
      toast.success("Request rejected", {
        theme: isDarkTheme ? "dark" : "light",
      });
      void onRejected();
    } catch (e) {
      const error = e as Error;
      toast.error(`Error rejecting: ${error.message}`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    } finally {
      // close the modal
      (document.getElementById(`reject_modal`) as HTMLDialogElement).close();
    }
  }

  if (request.status.name !== "Pending") return null;

  return (
    <>
      <button className="btn btn-error" onClick={()=>(document.getElementById(`reject_modal`) as HTMLDialogElement).showModal()}>
        Reject
      </button>
      <Portal>
      <dialog id={`reject_modal`} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Reject Request
            </h3>
            <p className="my-4">Rejecting this request will end this workflow.</p>
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
                className="btn btn-error"
                disabled={isLoading}
                onClick={() => void handleReject()}
              >
                {isLoading && (
                  <div className="loading loading-spinner" />
                )}
                Reject
              </button>
            </div>
          </div>
        </dialog>
      </Portal>
    </>
  )
};

export default RejectStage;