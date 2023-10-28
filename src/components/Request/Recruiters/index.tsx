import { type Request, type User } from "@prisma/client";
import Image from "next/image";
import { type FC } from "react";
import AddRecruiter from "~/components/Request/Recruiters/Add";
import RemoveRecruiter from "~/components/Request/Recruiters/Remove";

type RequestWithRecruiters = Request & {
  recruiters: User[];
}

type Props = {
  request: RequestWithRecruiters;
  onRecruiterAdded: () => void;
  onRecruiterRemoved: () => void;
}

export const RequestRecruiters: FC<Props> = ({ request, onRecruiterAdded, onRecruiterRemoved }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-base-300 rounded-lg p-4">
      {request.recruiters.map((recruiter) => (
        <div className="badge gap-2" key={recruiter.id}>
          <div className="flex items-center gap-2">
            <div className="avatar">
              <div className="w-4 rounded-full">
                <Image 
                  src={recruiter.image ?? ""} 
                  alt={recruiter.name ?? "Recruiter"}
                  width={32}
                  height={32}
                />
              </div>
            </div>
            <div>{recruiter.name}</div>
            <RemoveRecruiter
              request={request}
              recruiterUserId={recruiter.id}
              onRecruiterRemoved={() => void onRecruiterRemoved()}
            />
          </div>
        </div>
      ))}
      <AddRecruiter 
        request={request}
        onRecruiterAdded={() => void onRecruiterAdded()}
      />
    </div>
  )
};

export default RequestRecruiters;