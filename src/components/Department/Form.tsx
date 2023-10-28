import { type FC } from "react";
import { useForm, type SubmitHandler } from "react-hook-form"
import { api } from "~/utils/api";
import { toast } from 'react-toastify';
import useIsDarkTheme from "~/hooks/useIsDarkTheme";

type Inputs = {
  name: string;
}

interface Props {
  submit: "create" | "update";
  onSubmit?: () => void;
}

export const DepartmentForm: FC<Props> = ({ submit, onSubmit }) => {
  const { 
    mutateAsync: createDepartment, 
    isLoading: createIsLoading 
  } = api.department.create.useMutation({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const isDarkTheme = useIsDarkTheme();
  
  const onFormSubmission: SubmitHandler<Inputs> = async (data) => {
    if (submit === "create") {
      // create department
      await createDepartment({ name: data.name });
      toast.success(`${data.name} department created successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    }
    void onSubmit?.();
  };

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
        />
      </div>
      {/* errors will return when field validation fails  */}
      {errors.name && <span className="text-error">This field is required</span>}
      <button 
        className="btn btn-primary"
        type="submit"
      >
        {createIsLoading && (
          <div className="loading loading-spinner" />
        )}
        Submit
      </button>
    </form>
  );
};

export default DepartmentForm;