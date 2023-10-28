import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { type Request } from "@prisma/client";
import { useState, type FC } from "react";
import { toast } from "react-toastify";
import { Portal } from "~/components/utils/Portal";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Props = {
  request: Request;
  onParticipantAdded: () => void;
}
export const AddParticipant:FC<Props> = ({ request, onParticipantAdded }) => {
  const isDarkTheme = useIsDarkTheme();
  const { data: users } = api.user.getAll.useQuery();
  const { mutateAsync: addParticipant, isLoading } = api.request.addParticipant.useMutation({});
  const [userIdToAdd, setUserIdToAdd] = useState<string>('');
  const handleAdd = async () => {
    try {
      await addParticipant({ 
        requestId: request.id,
        userId: userIdToAdd,
      });
      toast.success("Participant added successfully", {
        theme: isDarkTheme ? "colored" : "light",
      });
      void onParticipantAdded();
    } catch (e) {
      const error = e as Error;
      toast.error('Error adding participant: ' + error.message, {
        theme: isDarkTheme ? "colored" : "light",
      });
    } finally {
      // close the modal
      (document.getElementById(`add_participant_${request.id}_modal`) as HTMLDialogElement).close();
    }
  }
  return (
    <>
      <button className="btn btn-xs btn-ghost" onClick={()=>(document.getElementById(`add_participant_${request.id}_modal`) as HTMLDialogElement).showModal()}>
        <PlusCircleIcon className="h-3 w-3" /> Add Participant
      </button>
      <Portal>
        <dialog id={`add_participant_${request.id}_modal`} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Add Participant
            </h3>
            <p className="py-4">
              Adding a participant to the request gives them access to the request but does not allow them to approve or reject the request.
            </p>
            {users && (
              <select 
                className="form-select select select-bordered w-full"
                value={userIdToAdd}
                onChange={(e) => setUserIdToAdd(e.target.value)}
              >
                <option value="">Select a participant</option>
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
                    Add Participant
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

export default AddParticipant;