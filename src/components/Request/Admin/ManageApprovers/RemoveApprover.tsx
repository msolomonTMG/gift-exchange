import { TrashIcon } from "@heroicons/react/24/outline";
import { type Request, type RequestStageApprover } from "@prisma/client";
import { type FC } from "react";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type RequestWithStageApprovers = Request & {
  stageApprovers: RequestStageApprover[];
}
type Props = {
  request: RequestWithStageApprovers;
  stageApprover: RequestStageApprover;
  onApproverRemoved: () => void;
}
export const RemoveApprover:FC<Props> = ({ request, stageApprover, onApproverRemoved }) => {
  const isDarkTheme = useIsDarkTheme();
  const { mutateAsync: removeApprover, isLoading } = api.request.removeApprover.useMutation({});
  const handleDelete = async () => {
    try {
      await removeApprover({ 
        requestId: request.id,
        requestStageApproverId: stageApprover.id
      });
      toast.success("Approver removed successfully", {
        theme: isDarkTheme ? "colored" : "light",
      });
      void onApproverRemoved();
    } catch (e) {
      const error = e as Error;
      toast.error('Error deleting approver: ' + error.message, {
        theme: isDarkTheme ? "colored" : "light",
      });
    } finally {
      // close the modal
      (document.getElementById(`remove_approver_${stageApprover.id}_modal`) as HTMLDialogElement).close();
    }
  }
  return (
    <>
      <button className="flex items-center" onClick={()=>(document.getElementById(`remove_approver_${stageApprover.id}_modal`) as HTMLDialogElement).showModal()}>
        <TrashIcon className="h-3 w-3 text-error" />
      </button>
      <dialog id={`remove_approver_${stageApprover.id}_modal`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            Remove Approver
          </h3>
          <p className="py-2">
            This user will no longer be able to approve or reject this request.
          </p>
          <p className="py-2">
            This user may lose access to this request unless they are an approver of a different stage or if they are added in other ways such as a participant or recruiter.
          </p>
          <div className="modal-action">
            <form method="dialog">
              <div className="flex items-center gap-2">
                <button 
                  className="btn btn-error"
                  onClick={() => void handleDelete()}
                >
                  {isLoading && (
                    <div className="loading loading-spinner" />
                  )}
                  Remove Approver
                </button>
                <button className="btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
};

export default RemoveApprover;