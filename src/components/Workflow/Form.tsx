import { useState, type FC, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form"
import { api } from "~/utils/api";
import { toast } from 'react-toastify';
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { type Stage, type StageInWorkflow, type Workflow } from "@prisma/client";

type Inputs = {
  name: string;
}

type WorkflowWithStages = Workflow & {
  stages: StageInWorkflow[];
}

interface Props {
  submit: "create" | "update";
  onSubmit?: () => void;
  workflow?: WorkflowWithStages;
}

export const WorkflowForm: FC<Props> = ({ submit, onSubmit, workflow }) => {
  const { 
    mutateAsync: createWorkflow, 
    isLoading: createIsLoading 
  } = api.workflow.create.useMutation({});

  const {
    mutateAsync: updateWorkflow, 
    isLoading: updateIsLoading 
  } = api.workflow.update.useMutation({});

  const { data: stages } = api.stage.getAll.useQuery();
  const [selectedStages, setSelectedStages] = useState<Stage[]>([]);

  useEffect(() => {
    console.log({ workflow })
    if (workflow) {
      setSelectedStages(workflow.stages.map(stageInWorkflow => {
        return {
          id: stageInWorkflow.stageId,
        } as Stage;
      }));
    }
  }, [workflow]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const isDarkTheme = useIsDarkTheme();
  
  const onFormSubmission: SubmitHandler<Inputs> = async (data) => {
    if (submit === "create") {
      await createWorkflow({ 
        name: data.name,
        stages: selectedStages.map(stage => ({ id: stage.id })),
      });
      toast.success(`${data.name} workflow created successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    }
    if (submit === "update") {
      if (!workflow) {
        toast.error(`Something went wrong!`, {
          theme: isDarkTheme ? "dark" : "light",
        });
        return;
      };
      console.log({ selectedStages })
      // edit workflow
      await updateWorkflow({ 
        id: workflow?.id ?? "",
        name: data.name,
        stages: selectedStages.map(stage => ({ id: stage.id })),
      });
      toast.success(`${data.name} workflow updated successfully!`, {
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
          defaultValue={workflow?.name ?? ""}
        />
      </div>
      {/* errors will return when field validation fails  */}
      {errors.name && <span className="text-error">This field is required</span>}

      {selectedStages.map((stage, index) => (
        <div key={index} className="flex items-center gap-2">
          <select
            className="select select-bordered w-full"
            value={stage?.id}
            onChange={(e) => {
              if (!stages) {
                toast.error(`Something went wrong!`, {
                  theme: isDarkTheme ? "dark" : "light",
                });
                return;
              }
              const newSelectedStages = [...selectedStages];
              newSelectedStages[index] = stages.find(stage => stage.id === parseInt(e.target.value))!;
              setSelectedStages(newSelectedStages);
            }}
          >
            {stages?.map(stage => (
              <option key={stage.id} value={stage.id}>{stage.name}</option>
            ))}
          </select>
          <button 
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const newSelectedStages = [...selectedStages];
              newSelectedStages.splice(index, 1);
              setSelectedStages(newSelectedStages);
            }}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      {stages && (
        <button
          type="button"
          className="btn"
          onClick={() => setSelectedStages([...selectedStages, stages[0]!])}
        >
          Add Stage
        </button>
      )}
      <button 
        className="btn btn-primary"
        type="submit"
      >
        {(createIsLoading || updateIsLoading) && (
          <div className="loading loading-spinner" />
        )}
        Submit
      </button>
    </form>
  );
};

export default WorkflowForm;