import { type User } from "@prisma/client";
import { type FC } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type Inputs = {
  emailWhenRequestStageChanged: boolean;
  emailWhenRequestCommentedOn: boolean;
  emailWhenAwaitingMyRequestApproval: boolean;
  emailWhenRequestCreated: boolean;
}

type Props = {
  user: User;
}

export const Preferences: FC<Props> = ({ user }) => {
  const { mutateAsync: updatePreferences, isLoading } = api.user.updatePreferences.useMutation({});
  type Preference = {
    title: string;
    description: string;
    value: keyof Inputs;
  }
  const preferences = [
    {
      title: "Created Requests",
      description: "Receive an email when a request is created that I am a part of.",
      value: "emailWhenRequestCreated",
    },
    {
      title: "Request Comments",
      description: "Receive an email when a request that I am a part of is commented on.",
      value: "emailWhenRequestCommentedOn",
    },
    {
      title: "Request Stage Changes",
      description: "Receive an email when a request that I am a part of is approved or rejected at any stage.",
      value: "emailWhenRequestStageChanged",
    },
    {
      title: "Awaiting My Approval",
      description: "Receive an email when a request stage changes to one that requires my approval.",
      value: "emailWhenAwaitingMyRequestApproval",
    },
  ] as Preference[];
  const isDarkTheme = useIsDarkTheme();
  const {
    register,
    handleSubmit,
    // formState: { errors },
  } = useForm<Inputs>({
    defaultValues: {
      emailWhenRequestStageChanged: user.emailWhenRequestStageChanged,
      emailWhenRequestCommentedOn: user.emailWhenRequestCommentedOn,
      emailWhenAwaitingMyRequestApproval: user.emailWhenAwaitingMyRequestApproval,
      emailWhenRequestCreated: user.emailWhenRequestCreated,
    },
  });

  const onFormSubmission: SubmitHandler<Inputs> = async (data) => {
    console.log({ data });
    try {
      await updatePreferences({
        id: user.id,
        ...data,
      });
      toast.success(`Preferences updated successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    } catch (e) {
      const error = e as Error;
      toast.error(error.message, {
        theme: isDarkTheme ? "dark" : "light",
      });
    }
  };
  
  return (
    <form className="flex flex-col gap-2" onSubmit={(e) => {
      e.preventDefault();
      void handleSubmit(onFormSubmission)();
    }}>
      <h3 className="text-xl font-bold">Email Preferences for Budget Requests</h3>
      <span className="text-xs opacity-50">
        Control what type of email alerts you receive when you are part of budget requests
      </span>
      {preferences.map((preference) => (
        <div className="w-full items-center border-2 rounded-lg p-4 justify-between flex gap-2" key={preference.title}>
          <div className="flex-col flex gap-1">
            <label
              className="label p-0"
              htmlFor={preference.title}
            >
              {preference.title}
            </label>
            <label
              className="label label-text-alt p-0"
              htmlFor={preference.title}
            >
              {preference.description}
            </label>
          </div>
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            {...register(preference.value, { required: false })}
          />
        </div>
      ))}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={isLoading}
      >
        {isLoading && (
          <div className="loading loading-spinner" />
        )}
        Save
      </button>
    </form>
  )
};

export default Preferences;