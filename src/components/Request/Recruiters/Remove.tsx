import { XMarkIcon } from "@heroicons/react/24/outline";
import { type Request } from "@prisma/client";
import { type FC } from "react";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Props = {
  request: Request;
  recruiterUserId: string;
  onRecruiterRemoved: () => void;
}

export const RemoveRecruiter: FC<Props> = ({
  request,
  recruiterUserId,
  onRecruiterRemoved,
}) => {
  const { mutateAsync: removeRecruiter, isLoading } = api.request.removeRecruiter.useMutation({});
  const isDarkTheme = useIsDarkTheme();

  const handleRemove = async () => {
    try {
      await removeRecruiter({
        requestId: request.id,
        userId: recruiterUserId,
      });
      toast.success("Recruiter removed successfully", {
        theme: isDarkTheme ? "colored" : "light",
      });
      void onRecruiterRemoved();
    } catch (e) {
      const error = e as Error;
      toast.error('Error deleting recruiter: ' + error.message, {
        theme: isDarkTheme ? "colored" : "light",
      });
    }
  }
  return (
    <>
      <button className="flex items-center" onClick={()=>(document.getElementById(`remove_recruiter_${recruiterUserId}_modal`) as HTMLDialogElement).showModal()}>
        <XMarkIcon className="h-3 w-3" />
      </button>
      <dialog id={`remove_recruiter_${recruiterUserId}_modal`} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            Remove Recruiter
          </h3>
          <p className="py-2">
            This user will no longer be a recruiter on the request.
          </p>
          <p className="py-2">
            This user may lose access to this request unless they are an approver or if they are added in other ways such as a recruiter.
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
                  Remove Recruiter
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

export default RemoveRecruiter;