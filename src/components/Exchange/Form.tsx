import { type FC } from "react";
import { useForm, type SubmitHandler } from "react-hook-form"
import { api } from "~/utils/api";
import { toast } from 'react-toastify';
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { type Exchange } from "@prisma/client";

type Inputs = {
  name: string;
  description: string;
  slug: string;
}

interface Props {
  exchange?: Exchange;
  submit: "create" | "update";
  onSubmit?: (exchange: Exchange) => void;
}

export const ExchangeForm: FC<Props> = ({ submit, onSubmit, exchange }) => {
  const { 
    mutateAsync: createExchange, 
    isLoading: createIsLoading 
  } = api.exchange.create.useMutation({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      name: exchange?.name,
      description: exchange?.description,
      slug: exchange?.slug,
    }
  });

  const isDarkTheme = useIsDarkTheme();
  
  const onFormSubmission: SubmitHandler<Inputs> = async (data) => {
    if (submit === "create") {
      const createdExchange = await createExchange({ 
        name: data.name,
        description: data.description,
        slug: data.slug,
      });
      toast.success(`${data.name} exchange created successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
      void onSubmit?.(createdExchange);
    }
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
      {errors.name && <span className="text-error">{errors.name.message}</span>}
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
        />
        {errors.description && <span className="text-error">{errors.description.message}</span>}
      </div>
      <div className="w-full">
        <label
          className="label"
          htmlFor="slug"
        >
          URL Slug
        </label>
        <input 
          className="input input-bordered w-full"
          {...register("slug", { required: true })}
        />
      </div>
      {/* errors will return when field validation fails  */}
      {errors.slug && <span className="text-error">{errors.slug.message}</span>}
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

export default ExchangeForm;