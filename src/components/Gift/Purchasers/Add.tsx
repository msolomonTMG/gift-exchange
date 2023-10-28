import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { type Gift } from "@prisma/client";
import { useState, type FC } from "react";
import { toast } from "react-toastify";
import { Portal } from "~/components/utils/Portal";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Props = {
  gift: Gift;
  onPurchaserAdded: () => void;
}
export const AddPurchaser:FC<Props> = ({ gift, onPurchaserAdded }) => {
  const isDarkTheme = useIsDarkTheme();
  const { data: users } = api.user.getAll.useQuery();
  const { mutateAsync: addPurchaser, isLoading } = api.gift.addPurchaser.useMutation({});
  const [userIdToAdd, setUserIdToAdd] = useState<string>('');
  const handleAdd = async () => {
    try {
      await addPurchaser({ 
        giftId: gift.id,
        userId: userIdToAdd,
      });
      toast.success("Purchaser added successfully", {
        theme: isDarkTheme ? "colored" : "light",
      });
      void onPurchaserAdded();
    } catch (e) {
      const error = e as Error;
      toast.error('Error adding purchaser: ' + error.message, {
        theme: isDarkTheme ? "colored" : "light",
      });
    } finally {
      // close the modal
      (document.getElementById(`add_purchaser_${gift.id}_modal`) as HTMLDialogElement).close();
    }
  }
  return (
    <>
      <button className="btn btn-xs btn-ghost" onClick={()=>(document.getElementById(`add_purchaser_${gift.id}_modal`) as HTMLDialogElement).showModal()}>
        <PlusCircleIcon className="h-3 w-3" /> Add Purchaser
      </button>
      <Portal>
        <dialog id={`add_purchaser_${gift.id}_modal`} className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Add Purchaser
            </h3>
            <p className="py-4">
              Adding a purchaser to the gift means that this person plans to buy the gift.
            </p>
            {users && (
              <select 
                className="form-select select select-bordered w-full"
                value={userIdToAdd}
                onChange={(e) => setUserIdToAdd(e.target.value)}
              >
                <option value="">Select a purchaser</option>
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
                    Add Purchaser
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

export default AddPurchaser;