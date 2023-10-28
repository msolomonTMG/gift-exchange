import { XMarkIcon } from "@heroicons/react/24/outline";
import { type RequestType, type RequestField } from "@prisma/client";
import { useState, type FC, useEffect } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Inputs = {
  name: string;
  description: string;
  workflowId: number;
}

type Props = {
  submit: "create" | "update";
  requestType?: RequestType;
  onSubmit?: () => void;
}

export const RequestTypeForm: FC<Props> = ({ submit, onSubmit, requestType }) => {
  const { mutateAsync: create, isLoading: createIsLoading } = api.requestType.create.useMutation({});
  const { mutateAsync: update, isLoading: updateIsLoading } = api.requestType.update.useMutation({});
  const { 
    mutateAsync: linkFieldsToRequestType, 
    isLoading: fieldLinkIsLoading 
  } = api.requestField.linkToRequestType.useMutation({});
  const isLoading = createIsLoading || updateIsLoading || fieldLinkIsLoading;
  const { data: workflows } = api.workflow.getAll.useQuery({
    includeStages: true
  });
  const { data: allFields } = api.requestField.getAll.useQuery({
    includeOptions: true,
  });
  const { data: currentRequestFields } = api.requestField.getByRequestType.useQuery({
    requestTypeId: requestType?.id ?? 0
  }, {
    enabled: requestType !== undefined
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const [selectedFields, setSelectedFields] = useState<RequestField[]>([]);
  useEffect(() => {
    setSelectedFields(currentRequestFields?.map(requestFieldInRequestType => {
      return requestFieldInRequestType.requestField;
    }) ?? []);
  }, [currentRequestFields]);

  const [fieldOptions, setFieldOptions] = useState<RequestField[]>([]);
  useEffect(() => {
    if (!allFields) return;
    // const fieldOptions = allFields.filter(field => {
    //   if (!currentRequestFields && !selectedFields) return true;
    //   const isCurrentField = currentRequestFields?.find(currentField => currentField.id === field.id);
    //   const isSelectedField = selectedFields?.find(selectedField => selectedField.id === field.id);
    //   return !isCurrentField && !isSelectedField;
    // });
    setFieldOptions(allFields);
  }, [allFields]);

  console.log({ selectedFields, fieldOptions })

  const onFormSubmission: SubmitHandler<Inputs> = async (data) => {
    console.log({ data, selectedFields, requestType });
    // create the requestFieldInRequestType records if necessary
    if (submit === "update" && requestType && selectedFields) {
      const fieldsToLink = selectedFields.map((field, index) => ({
        requestTypeId: requestType.id,
        requestFieldId: field.id,
        order: index,
      }));
      console.log({ fieldsToLink });
      await linkFieldsToRequestType(fieldsToLink);
    }
    if (submit === "update" && requestType) {
      await update({
        id: requestType.id,
        name: data.name,
        description: data.description,
        workflowId: Number(data.workflowId),
      });
      toast.success(`Type updated successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    }

    if (submit === "create") {
      const createdType = await create({
        name: data.name,
        description: data.description,
        workflowId: Number(data.workflowId),
      });
      if (selectedFields) {
        const fieldsToLink = selectedFields.map((field, index) => ({
          requestTypeId: createdType.id,
          requestFieldId: field.id,
          order: index,
        }));
        console.log({ fieldsToLink });
        await linkFieldsToRequestType(fieldsToLink);
      }
      toast.success(`Type created successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    }
    void onSubmit?.();
  };

  const isDarkTheme = useIsDarkTheme();

  if (!workflows) return null;

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
          defaultValue={requestType?.name ?? ""}
        />
        {errors.name && <span className="text-error">This field is required</span>}
      </div>
      <div className="w-full">
        <label
          className="label"
          htmlFor="description"
        >
          Description
        </label>
        <textarea 
          className="textarea textarea-bordered w-full"
          {...register("description", { required: false })}
          defaultValue={requestType?.description ?? ""}
        />
        {errors.description && <span className="text-error">Description is a string</span>}
      </div>
      <div className="w-full">
        <label
          className="label"
          htmlFor="workflowId"
        >
          Workflow
        </label>
        <select
          className="select select-bordered w-full"
          {...register("workflowId", { required: true })}
          defaultValue={requestType?.workflowId ?? ""}
        >
          <option value="">Select a workflow</option>
          {workflows?.map(workflow => (
            <option key={workflow.id} value={workflow.id}>{workflow.name}</option>
          ))}
        </select>
        {errors.workflowId && <span className="text-error">This field is required</span>}
      </div>
      <label className="label -mb-2">
        Fields
      </label>
      {selectedFields.map((field, index) => (
        <div key={index} className="flex items-center gap-2">
          <select
            className="select select-bordered w-full"
            value={field?.id}
            onChange={(e) => {
              if (!fieldOptions) {
                toast.error(`Something went wrong!`, {
                  theme: isDarkTheme ? "dark" : "light",
                });
                return;
              }
              const newSelectedFields = [...selectedFields];
              newSelectedFields[index] = fieldOptions.find(field => field.id === parseInt(e.target.value))!;
              setSelectedFields(newSelectedFields);
            }}
          >
            {fieldOptions?.map(field => (
              <option key={field.id} value={field.id}>{field.name}</option>
            ))}
          </select>
          <button 
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              const newSelectedFields = [...selectedFields];
              newSelectedFields.splice(index, 1);
              setSelectedFields(newSelectedFields);
            }}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
      {fieldOptions?.length > 0 && (
        <button
          type="button"
          className="btn"
          onClick={() => setSelectedFields([...selectedFields, fieldOptions[0]!])}
        >
          Add Field
        </button>
      )}
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