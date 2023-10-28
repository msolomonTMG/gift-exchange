import { type FC } from "react";
import { useForm, type SubmitHandler } from "react-hook-form"
import { api } from "~/utils/api";
import { toast } from 'react-toastify';
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { type Department, type Stage } from "@prisma/client";

type Inputs = {
  userId: string;
  department: Department;
  stage: Stage;
}

interface Props {
  department: Department;
  stage: Stage;
  onSubmit?: () => void;
}

export const ApproverForm: FC<Props> = ({ department, stage, onSubmit }) => {
  const { data: users } = api.user.getAll.useQuery();
  const { 
    mutateAsync: addApprover, 
    isLoading: createIsLoading 
  } = api.departmentStageApprover.createOrUpdate.useMutation({});

  const {
    register,
    handleSubmit,
    // formState: { errors },
  } = useForm<Inputs>();

  const isDarkTheme = useIsDarkTheme();
  console.log({ department, stage })
  
  const onFormSubmission: SubmitHandler<Inputs> = async (data) => {
    console.log({
      departmentId: department.id,
      stageId: stage.id,
      userId: data.userId,
    })
    await addApprover({
      userId: data.userId,
      departmentId: department.id,
      stageId: stage.id,
    });
    toast.success(`Approvers updated successfully!`, {
      theme: isDarkTheme ? "dark" : "light",
    });
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
          Approver
        </label>
        <select
          className="select select-bordered w-full"
          {...register("userId", { required: true })}
        >
          {users?.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>
      </div>
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

export default ApproverForm;