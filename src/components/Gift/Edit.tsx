import { type Gift } from "@prisma/client";
import { type FC } from "react";
import GiftForm from "~/components/Gift/Form";

type Props = {
  gift: Gift;
  onGiftEdited: () => void;
}

export const EditGift: FC<Props> = ({ gift, onGiftEdited }) => {
  return (
    <>
      <button className="btn" onClick={()=>(document.getElementById(`edit_gift_${gift.id}_modal`) as HTMLDialogElement).showModal()}>
        Edit
      </button>
      <dialog id={`edit_gift_${gift.id}_modal`} className="modal">
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg">Edit Gift</h3>
          <div className="py-4">
            <GiftForm
              gift={gift}
              submit="update"
              onSubmit={() => void onGiftEdited()}
            />
          </div>
        </div>
      </dialog>
    </>
  )
};

export default EditGift;