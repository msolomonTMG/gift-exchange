import { XMarkIcon } from "@heroicons/react/24/outline";
import { type Gift } from "@prisma/client";
import { type FC } from "react";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Props = {
  gift: Gift;
  participantUserId: string;
  onPurchaserRemoved: () => void;
}

export const RemovePurchaser: FC<Props> = ({
  gift,
  participantUserId,
  onPurchaserRemoved,
}) => {
  const { mutateAsync: removePurchaser, isLoading } = api.gift.removePurchaser.useMutation({});
  const isDarkTheme = useIsDarkTheme();

  const handleRemove = async () => {
    try {
      await removePurchaser({
        giftId: gift.id,
        userId: participantUserId,
      });
      toast.success("Puchaser removed successfully", {
        theme: isDarkTheme ? "colored" : "light",
      });
      void onPurchaserRemoved();
    } catch (e) {
      const error = e as Error;
      toast.error('Error deleting participant: ' + error.message, {
        theme: isDarkTheme ? "colored" : "light",
      });
    }
  }
  return (
    <>
      <button className="flex items-center" onClick={()=>(document.getElementById(`remove_purchaser_${participantUserId}_modal`) as HTMLDialogElement).showModal()}>
        <XMarkIcon className="h-3 w-3" />
      </button>
      <dialog id={`remove_purchaser_${participantUserId}_modal`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            Remove Purchaser
          </h3>
          <p className="py-2">
            This user will no longer be a purchaser on the gift.
          </p>
          <div className="modal-action">
            <form method="dialog">
              <div className="flex items-center gap-2">
                <button 
                  className="btn btn-error"
                  onClick={() => void handleRemove()}
                >
                  {isLoading && (
                    <div className="loading loading-spinner" />
                  )}
                  Remove Purchaser
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

export default RemovePurchaser;