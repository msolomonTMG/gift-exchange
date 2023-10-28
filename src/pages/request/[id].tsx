import { type NextPage } from "next";
import { useRouter } from "next/router";
import RequestForm from "~/components/Request/Form";
import { api } from "~/utils/api";
import Stages from "~/components/Request/Stages";
import ApproveStage from "~/components/Stage/Approve";
import RequestStatus from "~/components/Request/Status";
import RejectStage from "~/components/Stage/Reject";
import ReopenStage from "~/components/Stage/Reopen";
import RequestParticipants from "~/components/Request/Participants";
import RequestRecruiters from "~/components/Request/Recruiters";
import CommentList from "~/components/Comment/List";

export const RequestPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { data: request, isLoading, refetch } = api.request.getById.useQuery({
    id: Number(id)
  }, {
    enabled: id !== undefined
  });
  console.log({ request })

  if (!request && !isLoading) {
    return (
      <div className="h-full w-full flex flex-col gap-2">
        <h1 className="mb-0">Request Not Found</h1>
        <p>Request with id {id} not found</p>
      </div>
    )
  }

  if (isLoading) {
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
  }

  return (
    <div className="pb-20">
      <h1 className="mb-0">REQ-{request.id}: {request.requestType.name}</h1>
      <RequestStatus request={request} />
      <div className="flex lg:flex-row flex-col-reverse gap-6">
        <div className="grow flex flex-col gap-8 max-w-4xl">
          <RequestForm 
            submit="update" 
            request={request}
            onUpdate={() => void refetch()}
          />
          <CommentList request={request} />
        </div>
        <div className="shrink lg:w-80 w-full flex flex-col gap-2">
          <h3 className="font-bold text-lg">Approvals</h3>
          <div className="grid grid-flow-col gap-2 mb-2">
            <RejectStage request={request} onRejected={() => void refetch()} />
            <ReopenStage request={request} onReopened={() => void refetch()} />
            <ApproveStage request={request} onApproved={() => void refetch()} />
          </div>
          <Stages 
            request={request} 
            onApproverAdded={() => void refetch()}
            onApproverRemoved={() => void refetch()}
          />
          <h3 className="font-bold text-lg">Recruiters</h3>
          <RequestRecruiters
            request={request}
            onRecruiterAdded={() => void refetch()}
            onRecruiterRemoved={() => void refetch()}
          />
          <h3 className="font-bold text-lg mt-4">Participants</h3>
          <RequestParticipants
            request={request}
            onParticipantAdded={() => void refetch()}
            onParticipantRemoved={() => void refetch()}
          />
        </div>
      </div>
      
    </div>
  )
};

export default RequestPage;