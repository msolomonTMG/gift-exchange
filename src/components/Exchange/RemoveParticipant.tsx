import { XMarkIcon } from "@heroicons/react/24/outline";
import { type Exchange } from "@prisma/client";
import { type FC } from "react";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Props = {
  exchange: Exchange;
  participantUserId: string;
  onParticipantRemoved: () => void;
}

export const RemoveParticipant: FC<Props> = ({
  exchange,
  participantUserId,
  onParticipantRemoved,
}) => {
  const { mutateAsync: removeParticipant, isLoading } = api.exchange.removeParticipant.useMutation({});
  const isDarkTheme = useIsDarkTheme();

  const handleRemove = async () => {
    try {
      await removeParticipant({
        exchangeId: exchange.id,
        userId: participantUserId,
      });
      toast.success("Participant removed successfully", {
        theme: isDarkTheme ? "colored" : "light",
      });
      void onParticipantRemoved();
    } catch (e) {
      const error = e as Error;
      toast.error('Error deleting participant: ' + error.message, {
        theme: isDarkTheme ? "colored" : "light",
      });
    }
  }
  return (
    <>
      <button className="flex items-center" onClick={()=>(document.getElementById(`remove_participant_${participantUserId}_modal`) as HTMLDialogElement).showModal()}>
        <XMarkIcon className="h-3 w-3" />
      </button>
      <dialog id={`remove_participant_${participantUserId}_modal`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            Remove Participant
          </h3>
          <p className="py-2">
            This user will no longer be a participant in the exchange. This user may lose access to this exchange.
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
                  Remove Participant
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

export default RemoveParticipant;