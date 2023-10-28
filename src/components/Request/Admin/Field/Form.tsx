import { type RequestFieldOption, type RequestField } from "@prisma/client";
import { useState, type FC, useEffect } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { type RequestFieldType } from "~/types/request";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";
import { REQUEST_FIELD_TYPES } from "~/constants/request";
import RequestFieldOptionsForm from "./OptionsForm";

type Inputs = {
  name: string;
  type: RequestFieldType;
}

type RequestFieldWithOptions = RequestField & {
  options?: RequestFieldOption[];
}

type Props = {
  submit: "create" | "update";
  requestField?: RequestFieldWithOptions;
  onSubmit?: () => void;
}

export const RequestFieldForm: FC<Props> = ({ submit, onSubmit, requestField }) => {
  const { mutateAsync: create, isLoading: createIsLoading } = api.requestField.create.useMutation({});
  const { mutateAsync: update } = api.requestField.update.useMutation({});
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      name: requestField?.name ?? "",
      type: requestField?.type as RequestFieldType ?? "",
    }
  });

  const type = watch("type");
  const [options, setOptions] = useState<RequestFieldOption[]>(requestField?.options ?? []);
  useEffect(() => {
    setOptions(requestField?.options ?? []);
  }, [requestField?.options]);


  console.log({ requestField, type, options })

  const onFormSubmission: SubmitHandler<Inputs> = async (data) => {
    try {
      if (submit === "create") {
        console.log({
          name: data.name,
          type: data.type,
          options: options.map((option) => option.id),
        })
        await create({
          name: data.name,
          type: data.type,
          options: options.map((option) => option.id),
        });
        toast.success(`Field created successfully!`, {
          theme: isDarkTheme ? "dark" : "light",
        });
      } else {
        if (!requestField?.id) throw new Error("No field ID provided");
        await update({
          id: requestField.id,
          name: data.name,
          type: data.type,
          options: options.map((option) => option.id),
        });
      }
      void onSubmit?.();
    } catch (e) {
      const error = e as Error;
      toast.error(`Error ${submit === "create" ? "creating" : "updating"} field: ${error.message}`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    }
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
          defaultValue={requestField?.name ?? ""}
        />
        {errors.name && <span className="text-error">This field is required</span>}
      </div>
      <div className="w-full">
        <label
          className="label"
          htmlFor="name"
        >
          Type
        </label>
        <select
          className="select select-bordered w-full"
          {...register("type", { required: true })}
          defaultValue={requestField?.type ?? ""}
        >
          {REQUEST_FIELD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.toLowerCase()}
            </option>
          ))}
        </select>
        {errors.type && <span className="text-error">This field is required</span>}
      </div>
      {type === "SELECT" && (
        <label
          className="label"
          htmlFor="name"
        >
          Options
        </label>
      )}
      {type === "SELECT" && options?.map((option: RequestFieldOption) => (
        <RequestFieldOptionsForm 
          key={option.id}
          requestFieldOption={option} 
          submit={"update"}
          onSubmit={(updatedOption) => {
            setOptions([...options, updatedOption]);
          }}
          onDelete={(deletedId) => {
            setOptions(options.filter((option) => option.id !== deletedId));
          }}
        />
      ))}
      {type === "SELECT" && (
        <RequestFieldOptionsForm 
          submit={"create"}
          onSubmit={(createdOption) => {
            setOptions([...options, createdOption]);
          }}
          onDelete={(deletedId) => {
            setOptions(options.filter((option) => option.id !== deletedId));
          }}
        />
      )}
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