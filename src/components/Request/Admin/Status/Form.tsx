import { type RequestStatus } from "@prisma/client";
import { type FC } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Inputs = {
  name: string;
}

type Props = {
  submit: "create" | "update";
  requestStatus?: RequestStatus;
  onSubmit?: () => void;
}

export const RequestStatusForm: FC<Props> = ({ submit, onSubmit, requestStatus }) => {
  const { mutateAsync: create, isLoading: createIsLoading } = api.requestStatus.create.useMutation({});
  const { mutateAsync: update, isLoading: updateIsLoading } = api.requestStatus.update.useMutation({});
  const isLoading = createIsLoading || updateIsLoading;
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const onFormSubmission: SubmitHandler<Inputs> = async (data) => {
    if (submit === "update" && requestStatus) {
      await update({
        id: requestStatus.id,
        name: data.name,
      });
      toast.success(`Status updated successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    }

    if (submit === "create") {
      await create({
        name: data.name,
      });
      toast.success(`Status created successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    }
    void onSubmit?.();
  };

  const isDarkTheme = useIsDarkTheme();

  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => {
      e.preventDefault();
      void handleSubmit(onFormSubmission)();
    }}>
      <div className="w-full">
        <label
          className="label"
          htmlFor="name"
        >
          Name
        </label>
        <input 
          className="input input-bordered w-full"
          {...register("name", { required: true })}
          defaultValue={requestStatus?.name ?? ""}
        />
        {errors.name && <span className="text-error">This field is required</span>}
      </div>
      <button 
        className="btn btn-primary"
        type="submit"
      >
        {isLoading && (
          <div className="loading loading-spinner" />
        )}
        Submit
      </button>
    </form>
  );
};

export default RequestStatusForm;