import { useState, type FC } from "react";
import { useForm, type SubmitHandler } from "react-hook-form"
import { api } from "~/utils/api";
import { toast } from 'react-toastify';
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { type Gift } from "@prisma/client";
import { SingleImageDropzone } from "~/components/Edgestore/SingleImageDropzone";
import { useEdgeStore } from "~/lib/edgestore";
import Image from "next/image";

type Inputs = {
  name: string;
  description: string;
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
    isLoading: updateIsLoading,
  } = api.gift.update.useMutation({});

  const isLoading = createIsLoading || updateIsLoading;

  const [file, setFile] = useState<File>();
  const { edgestore } = useEdgeStore();
  const [progress, setProgress] = useState<number>(0);
  const [editImage, setEditImage] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      name: gift?.name,
      description: gift?.description,
      url: gift?.url ?? "",
      price: gift?.price ?? 0,
    }
  });

  const isDarkTheme = useIsDarkTheme();
  
  const onFormSubmission: SubmitHandler<Inputs> = async (data) => {
    if (submit === "create") {
      let imgUrl = "";
      if (file) {
        const imageUploadResponse = await edgestore.publicFiles.upload({
          file,
          onProgressChange: (progress) => {
            // you can use this to show a progress bar
            console.log(progress);
            setProgress(progress);
          },
        });
        imgUrl = imageUploadResponse.url;
      }
      const createdGift = await createGift({ 
        name: data.name,
        description: data.description,
        url: data.url,
        imgUrl,
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
      let imgUrl = "";
      if (editImage && file) {
        const imageUploadResponse = await edgestore.publicFiles.upload({
          file,
          onProgressChange: (progress) => {
            // you can use this to show a progress bar
            console.log(progress);
            setProgress(progress);
          },
        });
        imgUrl = imageUploadResponse.url;
      }
      const editedGift = await updateGift({ 
        name: data.name,
        description: data.description,
        url: data.url,
        imgUrl: editImage ? imgUrl : gift!.image!,
        price: parseFloat(data.price.toString()),
        id: gift!.id,
      });
      toast.success(`${data.name} edited successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
      (document.getElementById(`edit_gift_${gift!.id}_modal`) as HTMLDialogElement).close();
      void onSubmit?.(editedGift);
    }
    setProgress(0);
    setFile(undefined);
    reset();
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => {
      e.preventDefault();
      void handleSubmit(onFormSubmission)();
    }}>
      {((editImage && submit === "update") || submit === "create") && (
        <div className="w-full flex justify-center">
          <SingleImageDropzone
            width={200}
            height={200}
            value={file}
            onChange={(file) => {
              setFile(file);
            }}
          />
        </div>
      )}
      {!editImage && submit === "update" && (
        <Image
          src={gift?.image ?? ""}
          alt={gift?.name ?? "Gift Image"}
          width={200}
          height={200}
          className="rounded-md mx-auto"
        />
      )}
      {progress > 0 && (
        <div className="h-4 w-full border max-w-xs mx-auto rounded-lg overflow-hidden">
          <div 
            className="h-full bg-success transition-all duration-700 ease-linear" 
            style={{
              width: `${progress}%`,
            }}
          ></div>
        </div>
      )}
      {submit === "update" && (
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Edit Image</span> 
            <input 
              type="checkbox" 
              className="toggle"
              onChange={() => setEditImage((prev) => !prev)}
              checked={editImage}
            />
          </label>
        </div>
      )}
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
        disabled={isLoading}
      >
        {isLoading && (
          <div className="loading loading-spinner" />
        )}
        Submit
      </button>
    </form>
  );
};

export default GiftForm;