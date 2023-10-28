import { CheckCircleIcon, TrashIcon } from "@heroicons/react/24/outline";
import { type RequestFieldOption } from "@prisma/client";
import { useState, type FC } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Props = {
  submit: "create" | "update";
  requestFieldOption?: RequestFieldOption;
  onSubmit?: (requestFieldOption: RequestFieldOption) => void;
  onDelete?: (requestFieldOptionId: number) => void;
}

type Inputs = {
  name: string;
  requestFieldOption?: RequestFieldOption;
}

// We do not use React-Form here because we want to be able to submit within another form
export const RequestFieldOptionsForm: FC<Props> = ({ requestFieldOption, onSubmit, onDelete, submit }) => {
  const { mutateAsync: create, isLoading: createIsLoading } = api.requestFieldOption.create.useMutation({});
  const { mutateAsync: update } = api.requestFieldOption.update.useMutation({});
  const { mutateAsync: deleteOption } = api.requestFieldOption.delete.useMutation({});

  const [showInput, setShowInput] = useState<boolean>(false);

  const {
    register,
    watch,
    // formState: { errors },
    reset,
  } = useForm<Inputs>({
    defaultValues: {
      name: requestFieldOption?.name ?? "",
      requestFieldOption,
    }
  });

  const name = watch("name");

  const isDarkTheme = useIsDarkTheme();

  const handleSubmit = async () => {
    console.log('submitting...')
    try {
      let option: RequestFieldOption;
      if (submit === "create") {
        option = await create({
          name,
          requestFieldId: requestFieldOption?.requestFieldId,
        });
      } else {
        if (!requestFieldOption?.id) throw new Error("No option ID provided");
        option = await update({
          id: requestFieldOption.id,
          name,
          requestFieldId: requestFieldOption?.requestFieldId,
        });
      }
      toast.success(`Option ${submit === "create" ? "created" : "updated"} successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
      void onSubmit?.(option);
      void reset();
      setShowInput(false);
    } catch (e) {
      const error = e as Error;
      toast.error(`Error ${submit === "create" ? "creating" : "updating"} option: ${error.message}`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    }
  }

  const handleDelete = async () => {
    try {
      if (!requestFieldOption?.id) throw new Error("No option ID provided");
      await deleteOption({ id: requestFieldOption?.id });
      toast.success(`Option deleted successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
      void onDelete?.(requestFieldOption.id)
    } catch (e) {
      const error = e as Error;
      toast.error(`Error deleting option: ${error.message}`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    }
  }

  return (
    <div>
      <div className="w-full">
        <div className="flex gap-2">
          {((submit === "create" && showInput) || (submit === "update")) && (
            <input
              className="input input-bordered w-full"
              type="text"
              {...register("name")}
              defaultValue={requestFieldOption?.name}
            />
          )}
          {submit === "update" && name !== requestFieldOption?.name && (
            <button
              className="btn btn-ghost"
              onClick={() => void handleSubmit()}
            >
              <CheckCircleIcon className="h-5 w-5" />
            </button>
          )}
          {submit === "update" && (
            <button
              className="btn btn-ghost"
              onClick={() => void handleDelete()}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      {submit === "create" && !showInput && (
        <button 
          className="btn btn-block"
          type="button"
          onClick={() => setShowInput(true)}
        >
          Add Option
        </button>
      )}
      {submit === "create" && showInput && (
        <button 
          className="btn btn-secondary btn-block mt-2"
          type="button"
          onClick={() => void handleSubmit()}
        >
          {createIsLoading && (
            <div className="loading loading-spinner" />
          )}
          Save Option
        </button>
      )}
    </div>
  )
}

export default RequestFieldOptionsForm;