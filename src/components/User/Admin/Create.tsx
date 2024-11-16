import { type FC } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";
import getRandomAvatar from "~/helpers/getRandomAvatar";

type Inputs = {
  isAdmin: boolean;
  email: string;
  name: string;
}

type Props = {
  onUserCreated: () => void;
}

export const CreateUser: FC<Props> = ({ onUserCreated }) => {
  const { mutateAsync: createUser, isLoading } = api.user.create.useMutation({});
  
  const {
    register,
    handleSubmit,
    // formState: { errors },
  } = useForm<Inputs>();

  const isDarkTheme = useIsDarkTheme();

  const onFormSubmission: SubmitHandler<Inputs> = async (data) => {
    try {
      await createUser({ 
        name: data.name,
        email: data.email.trim(),
        isAdmin: data.isAdmin,
        image: getRandomAvatar(),
      });
      toast.success(`${data.name} created successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
      void onUserCreated();
    } catch (e) {
      const error = e as Error;
      toast.error('Error creating user: ' + error.message, {
        theme: isDarkTheme ? "dark" : "light",
      });
    } finally {
      // close the modal
      (document.getElementById('create_user_modal') as HTMLDialogElement).close();
    }
  };
  return (
    <div>
      <button className="btn" onClick={()=>(document.getElementById('create_user_modal') as HTMLDialogElement).showModal()}>
        Create New User
      </button>
      <dialog id="create_user_modal" className="modal">
        <div className="modal-box">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
          </form>
          <h3 className="font-bold text-lg">Create User</h3>
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
            <div className="w-full">
              <label
                className="label"
                htmlFor="name"
              >
                Email
              </label>
              <input 
                className="input input-bordered w-full"
                {...register("email", { required: true })}
              />
            </div>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span>Is Admin</span> 
                <input 
                  className="checkbox"
                  type="checkbox"
                  {...register("isAdmin", { required: false })}
                />
              </label>
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
        </div>
      </dialog>
    </div>
  )
};

export default CreateUser;