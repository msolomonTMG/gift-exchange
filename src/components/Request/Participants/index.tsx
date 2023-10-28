import { type Request, type User } from "@prisma/client";
import Image from "next/image";
import { type FC } from "react";
import AddParticipant from "./Add";
import RemoveParticipant from "./Remove";

type RequestWithParticipants = Request & {
  participants: User[];
}

type Props = {
  request: RequestWithParticipants;
  onParticipantAdded: () => void;
  onParticipantRemoved: () => void;
}

export const RequestParticipants: FC<Props> = ({ request, onParticipantAdded, onParticipantRemoved }) => {
  return (
    <div className="flex flex-wrap items-center gap-2 bg-base-300 rounded-lg p-4">
      {request.participants.map((participant) => (
        <div className="badge gap-2" key={participant.id}>
          <div className="flex items-center gap-2">
            <div className="avatar">
              <div className="w-4 rounded-full">
                <Image 
                  src={participant.image ?? ""} 
                  alt={participant.name ?? "Participant"}
                  width={32}
                  height={32}
                />
              </div>
            </div>
            <div>{participant.name}</div>
            <RemoveParticipant
              request={request}
              participantUserId={participant.id}
              onParticipantRemoved={() => void onParticipantRemoved()}
            />
          </div>
        </div>
      ))}
      <AddParticipant 
        request={request}
        onParticipantAdded={() => void onParticipantAdded()}
      />
    </div>
  )
};

export default RequestParticipants;