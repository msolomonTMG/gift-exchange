import { type FC } from "react";
import { useForm, type SubmitHandler } from "react-hook-form"
import { api } from "~/utils/api";
import { toast } from 'react-toastify';
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { type Gift } from "@prisma/client";

type Inputs = {
  name: string;
  description: string;
  image: string;
  url: string;
  price: number;
}

interface Props {
  gift?: Gift;
  exchangeId?: number;
  submit: "create" | "update";
  onSubmit?: (gift: Gift) => void;
}

export const GiftForm: FC<Props> = ({ submit, onSubmit, gift, exchangeId }) => {
  const { 
    mutateAsync: createGift, 
    isLoading: createIsLoading 
  } = api.gift.create.useMutation({});
  const {
    mutateAsync: updateGift,
  } = api.gift.update.useMutation({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      name: gift?.name,
      description: gift?.description,
      image: gift?.image ?? "",
      url: gift?.url ?? "",
      price: gift?.price ?? 0,
    }
  });

  const isDarkTheme = useIsDarkTheme();
  
  const onFormSubmission: SubmitHandler<Inputs> = async (data) => {
    console.log({ data })
    if (submit === "create") {
      const createdGift = await createGift({ 
        name: data.name,
        description: data.description,
        image: data.image,
        url: data.url,
        price: parseFloat(data.price.toString()),
        exchangeId: exchangeId!,
      });
      toast.success(`${data.name} created successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
      (document.getElementById(`create_gift_modal`) as HTMLDialogElement).close();
      void onSubmit?.(createdGift);
    }
    if (submit === "update") {
      const editedGift = await updateGift({ 
        name: data.name,
        description: data.description,
        image: data.image,
        url: data.url,
        price: parseFloat(data.price.toString()),
        id: gift!.id,
      });
      toast.success(`${data.name} edited successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
      void onSubmit?.(editedGift);
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
          htmlFor="price"
        >
          Price
        </label>
        <input 
          className="input input-bordered w-full"
          type="number"
          step="0.01"
          {...register("price", { required: false })}
        />
      </div>
      {/* errors will return when field validation fails  */}
      {errors.price && <span className="text-error">{errors.price.message}</span>}
      <div className="w-full">
        <label
          className="label"
          htmlFor="image"
        >
          Image
        </label>
        <input 
          className="input input-bordered w-full"
          {...register("image", { required: false })}
        />
      </div>
      {/* errors will return when field validation fails  */}
      {errors.image && <span className="text-error">{errors.image.message}</span>}
      <div className="w-full">
        <label
          className="label"
          htmlFor="url"
        >
          URL
        </label>
        <input 
          className="input input-bordered w-full"
          {...register("url", { required: false })}
        />
      </div>
      {/* errors will return when field validation fails  */}
      {errors.url && <span className="text-error">{errors.url.message}</span>}
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

export default GiftForm;