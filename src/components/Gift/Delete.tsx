import { TrashIcon } from "@heroicons/react/24/outline";
import { type Gift } from "@prisma/client";
import { type FC } from "react";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Props = {
  gift: Gift;
  onGiftDeleted: () => void;
}

export const DeleteGift: FC<Props> = ({ gift, onGiftDeleted }) => {
  const { mutateAsync: deleteGift, isLoading } = api.gift.delete.useMutation({});
  const isDarkTheme = useIsDarkTheme();

  const handleDelete = async () => {
    try {
      await deleteGift({
        id: gift.id,
      });
      toast.success("Gift deleted successfully", {
        theme: isDarkTheme ? "colored" : "light",
      });
      void onGiftDeleted();
    } catch (e) {
      const error = e as Error;
      toast.error('Error deleting gift: ' + error.message, {
        theme: isDarkTheme ? "colored" : "light",
      });
    }
  }
  return (
    <>
      <button className="flex items-center" onClick={()=>(document.getElementById(`delete_gift_${gift.id}_modal`) as HTMLDialogElement).showModal()}>
        <TrashIcon className="h-4 w-4" />
      </button>
      <dialog id={`delete_gift_${gift.id}_modal`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            Delete Wishlist Item
          </h3>
          <p className="py-2">
            Are you sure you want to delete this wishlist item?
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
                  Delete Wishlist Item
                </button>
                <button className="btn">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </>
  )
}