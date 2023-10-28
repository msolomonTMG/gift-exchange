import { type NextPage } from "next";
import { useSession } from "next-auth/react";
import Image from "next/image";
import getRandomAvatar from "~/helpers/getRandomAvatar";

export const Profile: NextPage = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex flex-col w-full gap-2 animate-pulse">
        <div className="h-10 w-1/2 bg-base-200 rounded-lg" />
        <div className="h-6 w-24 bg-base-200 rounded-lg" />
        <div className="grid grid-cols-12 gap-2">
          <div className="h-96 col-span-9 bg-base-200 rounded-lg" />
          <div className="h-96 col-span-3 bg-base-200 rounded-lg" />
        </div>
      </div>
    )
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-full min-h-screen max-w-sm mx-auto">
        Sign In
      </div>
    )
  }

  if (session.user) {
    return (
      <div>
        <h1>Profile</h1>
        <h3 className="text-xl font-bold">Information</h3>
        <span className="text-xs opacity-50">This information is set by your Google Workspace</span>
        <div className="flex flex-col gap-2 mt-2 mb-8">
          <div className="flex items-center gap-2">
            <Image
              src={session.user.image ?? getRandomAvatar()}
              alt={session.user.name ?? "User"}
              width={48}
              height={48}
              className="rounded-full"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold">{session.user.name}</span>
              <span className="text-sm opacity-50">{session.user.email}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Profile;