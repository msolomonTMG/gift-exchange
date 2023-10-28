import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { type Request, type RequestStageApprover } from "@prisma/client";
import { useState, type FC } from "react";
import { toast } from "react-toastify";
import { Portal } from "~/components/utils/Portal";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type RequestWithStageApprovers = Request & {
  stageApprovers: RequestStageApprover[];
}
type Props = {
  request: RequestWithStageApprovers;
  stageId: number;
  onApproverAdded: () => void;
}
export const AddApprover:FC<Props> = ({ request, stageId, onApproverAdded }) => {
  const isDarkTheme = useIsDarkTheme();
  const { data: users } = api.user.getAll.useQuery();
  const { mutateAsync: addApprover, isLoading } = api.request.addApprover.useMutation({});
  const [userIdToAdd, setUserIdToAdd] = useState<string>('');
  const handleAdd = async () => {
    try {
      await addApprover({ 
        requestId: request.id,
        stageId: stageId,
        userId: userIdToAdd,
      });
      toast.success("Approver added successfully", {
        theme: isDarkTheme ? "colored" : "light",
      });
      void onApproverAdded();
    } catch (e) {
      const error = e as Error;
      toast.error('Error adding approver: ' + error.message, {
        theme: isDarkTheme ? "colored" : "light",
      });
    } finally {
      // close the modal
      (document.getElementById(`add_approver_${stageId}_modal`) as HTMLDialogElement).close();
    }
  }
  return (
    <>
      <button className="btn btn-xs" onClick={()=>(document.getElementById(`add_approver_${stageId}_modal`) as HTMLDialogElement).showModal()}>
        <PlusCircleIcon className="h-3 w-3" /> Add Approver
      </button>
      <Portal>
        <dialog id={`add_approver_${stageId}_modal`} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Add Approver
            </h3>
            <p className="py-4">
              Adding an approver to the request gives them access to the request and allows them to approve or reject the request.
            </p>
            {users && (
              <select 
                className="form-select select select-bordered w-full"
                value={userIdToAdd}
                onChange={(e) => setUserIdToAdd(e.target.value)}
              >
                <option value="">Select an approver</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            )}
            <div className="modal-action">
              <form method="dialog">
                <div className="flex items-center gap-2">
                  <button 
                    className="btn btn-primary"
                    onClick={() => void handleAdd()}
                  >
                    {isLoading && (
                      <div className="loading loading-spinner" />
                    )}
                    Add Approver
                  </button>
                  <button className="btn">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </dialog>
      </Portal>
    </>
  )
};

export default AddApprover;