import { type FC } from "react";
import GiftForm from "~/components/Gift/Form";

type Props = {
  exchangeId: number;
  onGiftCreated: () => void;
}

export const CreateGift: FC<Props> = ({ exchangeId, onGiftCreated }) => {
  return (
    <>
      <button className="btn" onClick={()=>(document.getElementById(`create_gift_modal`) as HTMLDialogElement).showModal()}>
        Create Gift
      </button>
      <dialog id={`create_gift_modal`} className="modal">
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg">Create Gift</h3>
          <div className="py-4">
            <GiftForm
              submit="create"
              exchangeId={exchangeId}
              onSubmit={() => {
                onGiftCreated();
              }}
            />
          </div>
        </div>
      </dialog>
    </>
  )
};

export default CreateGift;