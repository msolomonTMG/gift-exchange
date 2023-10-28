import { useSession } from "next-auth/react";
import { type FC, useState, useEffect } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { type RequestField, type Request } from "@prisma/client";
import { api } from "~/utils/api";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";

type RequestWithFormattedFields = Request & {
  formattedFields: {
    requestFieldId: number;
    requestField: RequestField;
    value: string | number | Date;
  }[];
}

type Props = {
  request?: RequestWithFormattedFields;
  onUpdate?: () => void;
  onCreate?: (createdRequest: Request) => void;
  submit: "create" | "update";
}

type Inputs = {
  creatorId: string;
  requestTypeId: number;
  departmentId: number;
  fields: Record<string, string | number | Date>;
}

export const RequestForm: FC<Props> = ({ request, submit, onUpdate, onCreate }) => {
  const { data: session } = useSession();
  const { data: requestTypes } = api.requestType.getAll.useQuery();
  const { data: departments } = api.department.getAll.useQuery({});
  const { 
    mutateAsync: createRequest, 
    isLoading: createIsLoading 
  } = api.request.create.useMutation({});
  const { 
    mutateAsync: updateRequest,
    isLoading: updateIsLoading,
  } = api.request.update.useMutation({});
  const isLoading = createIsLoading || updateIsLoading;
  const [defaultValues, setDefaultValues] = useState<Inputs>({
    creatorId: session?.user?.id ?? "",
    requestTypeId: request?.requestTypeId ?? 0,
    departmentId: request?.departmentId ?? 0,
    fields: {},
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    // formState: { errors },
  } = useForm<Inputs>({
    defaultValues,
  });
  const requestTypeId = watch("requestTypeId");

  // all fields that can be selected for this request type
  const { data: fields } = api.requestField.getByRequestType.useQuery({
    requestTypeId: requestTypeId ? Number(requestTypeId) : 0
  }, {
    enabled: requestTypeId !== undefined
  });
  console.log({ fields })

  const isDarkTheme = useIsDarkTheme();

  useEffect(() => {
    if (!request || !fields) return;
    const existingValues = request.formattedFields.reduce((acc, formattedField) => {
      const field = fields.find(field => field.requestFieldId === formattedField.requestFieldId);
      console.log({ fields, field, acc, formattedField })
      if (!field) return acc;
      const formattedValue = (value: string | number | Date) => {
        if (field.requestField.type === "DATE") {
          return new Date(value).toISOString().split('T')[0];
        }
        return value;
      }
      return {
        ...acc,
        [`${field.id}`]: formattedValue(formattedField.value),
      }
    }, {});
    console.log({ existingValues });
    setDefaultValues({
      ...defaultValues,
      fields: existingValues,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, fields]);

  useEffect(() => {
    void reset(defaultValues);
  }, [defaultValues, reset]);

  useEffect(() => {
    if (requestTypeId) {
      void reset();
      setValue("requestTypeId", requestTypeId);
    }
  }, [requestTypeId, reset, setValue])

  const onFormSubmission: SubmitHandler<Inputs> = async (data) => {
    console.log({ data })
    if (!fields) {
      toast.error(`Error creating request: No fields found`);
      return;
    }
    const requestFields = Object.entries(data.fields).map(([fieldId, value]) => ({
      requestFieldId: fields.find((field) => field.id === Number(fieldId))?.requestFieldId ?? 0,
      value: value.toString(),
    }));
    if (submit === "create") {
      console.log('data.fields', data.fields);
      try {
        const createdRequest = await createRequest({
          requestTypeId: Number(data.requestTypeId),
          departmentId: Number(data.departmentId),
          fields: requestFields,
        }) as Request;
        console.log({ createdRequest });
        toast.success(`Request created successfully!`, {
          theme: isDarkTheme ? "dark" : "light",
        });
        void onCreate?.(createdRequest);
      } catch (e) {
        const error = e as Error;
        toast.error(`Error creating request: ${error.message}`, {
          theme: isDarkTheme ? "dark" : "light",
        });
      }
    }
    if (submit === "update") {
      if (!request) {
        toast.error(`Error updating request: No request found`);
        return;
      }
      try {
        await updateRequest({
          id: request.id,
          fields: requestFields,
        });
        toast.success(`Request updated successfully!`, {
          theme: isDarkTheme ? "dark" : "light",
        });
        void onUpdate?.();
      } catch (e) {
        const error = e as Error;
        toast.error(`Error updating request: ${error.message}`);
      }
    } 
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => {
      e.preventDefault();
      void handleSubmit(onFormSubmission)();
    }}>
      {submit === "create" &&  (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {requestTypes?.map(requestType => (
            <div key={requestType.id} className="form-control border rounded-lg p-6">
              <label className="label cursor-pointer">
                <div className="flex flex-col">
                  <span className="label-text text-xl font-bold">{requestType.name}</span> 
                  <span>{requestType.description}</span>
                </div>
                <input 
                  type="radio"
                  className="radio" 
                  value={requestType.id}
                  {...register("requestTypeId", { required: true })}
                />
              </label>
            </div>
          ))}
        </div>
      )}
      <div className="form-control w-full">
        <label
          className="label label-text"
          htmlFor="department"
        >
          Department
        </label>
        <select 
          id="department"
          className="select select-bordered" 
          {...register(`departmentId`, { required: true })}
        >
          <option value="">Select a department</option>
          {departments?.map(option => (
            <option key={option.id} value={option.id}>{option.name}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {fields?.map(field => (
          <div key={field.id} className={`form-control w-full ${field.requestField.type === "PARAGRAPH" ? " col-span-2" : ""}`}>
            <label
              className="label label-text"
              htmlFor={field.requestField.name}
            >
              {field.requestField.name}
            </label>
            {field.requestField.type === "SELECT" && (
              <select 
                id={field.requestField.name} 
                className="select select-bordered" 
                {...register(`fields.${field.id}`)}
              >
                <option value="">Select {field.requestField.name}</option>
                {field.requestField.options?.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            )}
            {field.requestField.type === "BOOLEAN" && (
              <select 
                id={field.requestField.name} 
                className="select select-bordered" 
                {...register(`fields.${field.id}`)}
              >
                <option value="">Select yes or no</option>
                <option value={1}>Yes</option>
                <option value={0}>No</option>
              </select>
            )}
            {field.requestField.type === "NUMBER" && (
              <input 
                id={field.requestField.name} 
                className="input input-bordered" 
                type="number"
                {...register(`fields.${field.id}`)}
              />
            )}
            {field.requestField.type === "TEXT" && (
              <input 
                id={field.requestField.name} 
                className="input input-bordered" 
                type="text"
                {...register(`fields.${field.id}`)}
              />
            )}
            {field.requestField.type === "PARAGRAPH" && (
              <textarea 
                id={field.requestField.name} 
                className="textarea textarea-bordered" 
                {...register(`fields.${field.id}`)}
              />
            )}
            {field.requestField.type === "DATE" && (
              <input 
                id={field.requestField.name} 
                className="input input-bordered" 
                type="date"
                {...register(`fields.${field.id}`)}
              />
            )}
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary mt-4"
      >
        {isLoading && (
          <div className="loading loading-spinner" />
        )}
        Submit
      </button>
    </form>
  )
};

export default RequestForm;