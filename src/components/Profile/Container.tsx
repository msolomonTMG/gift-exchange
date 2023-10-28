import { type FC } from "react";
import Preferences from "~/components/Profile/Preferences";
import { type User } from "@prisma/client";

type Props = {
  user: User;
}

export const ProfileContainer: FC<Props> = ({ user }) => {
  return (
    <div>
      <Preferences user={user} />
    </div>
  )
}

export default ProfileContainer;