import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { type RequestType, type Request, type RequestEvent, type RequestStatus, type RequestStageApprover, type StageInWorkflow, type Stage as StageT } from "@prisma/client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useState, type FC, useRef, useEffect } from "react";
import { api } from "~/utils/api";
import RemoveApprover from "./Admin/ManageApprovers/RemoveApprover";
import AddApprover from "./Admin/ManageApprovers/AddApprover";

type RequestWithRecords = Request & {
  requestType: RequestType;
  events: RequestEvent[];
  status: RequestStatus;
  stageApprovers: RequestStageApprover[];
}

type Props = {
  request: RequestWithRecords;
  onApproverAdded: () => void;
  onApproverRemoved: () => void;
}

const StageApprover: FC<{ 
  request: RequestWithRecords;
  stageApprover: RequestStageApprover;
  onApproverRemoved: () => void;
}> = ({ request, stageApprover, onApproverRemoved }) => {
  const { data: session } = useSession();
  const [isHovered, setIsHovered] = useState<boolean>(false);
  console.log({ request, stageApprover })
  const { data: user, isLoading } = api.user.get.useQuery({
    id: stageApprover.userId
  });
  if (isLoading) return (
    <div className="h-6 w-32 animate-pulse flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-base-200" />
      <div className="w-32 h-5 bg-base-200 rounded-lg" />
    </div>
  )
  if (!user) return null;
  return (
    <li 
      key={stageApprover.id} 
      className="flex items-center text-xs gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="avatar">
        <div className="w-4 rounded-full">
          <Image
            src={user.image ?? ""}
            alt={user.name ?? "Approver"}
            width={16}
            height={16}
          /> 
        </div>
      </div>
      <div>{user.name}</div>
      {request.events.filter(
        (event) => event.userId === stageApprover.userId && event.value === stageApprover.stageId.toString()
      )?.map(
        (event) => {
          const reopenEvents = request.events.filter((event) => event.action === "REOPEN");
          const latestReopenEvent = reopenEvents.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          // if this event is before the latest reopen event, return null
          if (latestReopenEvent && new Date(event.createdAt).getTime() < new Date(latestReopenEvent.createdAt).getTime()) {
            return null;
          }
          const actionDateString = new Date(event.createdAt).toLocaleDateString([], {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          });
          if (event.action === "APPROVE") {
            return (
              <div 
                key={event.id} 
                className="tooltip cursor-pointer" 
                data-tip={`Approved ${actionDateString}`}
              >
                <CheckCircleIcon className="h-4 w-4 text-success" />
              </div>
            )
          }
          if (event.action === "REJECT") {
            return (
              <div 
                key={event.id} 
                className="tooltip cursor-pointer" 
                data-tip={`Rejected ${actionDateString}`}
              >
                <XMarkIcon className="h-4 w-4 text-error" />
              </div>
            )
          }
        }
      )}
      {session?.user?.isAdmin && (
        <div className={`${isHovered ? '' : 'hidden'}`}>
          <RemoveApprover
            request={request}
            stageApprover={stageApprover}
            onApproverRemoved={() => void onApproverRemoved()}
          />
        </div>
      )}
    </li>
  )
};

export const Stage: FC<{ 
  stage: StageT;
  stageInWorkflow: StageInWorkflow;
  currentStageInWorkflow: StageInWorkflow;
  finalStageOrder: number;
  request: RequestWithRecords;
  onApproverRemoved: () => void;
  onApproverAdded: () => void;
}> = ({ 
  request, 
  stage, 
  stageInWorkflow, 
  currentStageInWorkflow, 
  finalStageOrder,
  onApproverAdded,
  onApproverRemoved,
}) => {
  const { data: session } = useSession();
  const [showAddApprover, setShowAddApprover] = useState<boolean>(false);
  const isAtOrBeyondCurrentStage = stageInWorkflow.order <= (currentStageInWorkflow?.order ?? 0);
  const stageIsApproved = stageInWorkflow.order < (currentStageInWorkflow?.order ?? 0) || 
    (finalStageOrder === stageInWorkflow.order && request.status.name === "Approved");
  
  // make the step longer for each approver in the stage
  const stepRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!stepRef.current) return;
    const numApproversInStage = request.stageApprovers?.filter(stageApprover => stageApprover.stageId === stage.id).length ?? 0;
    const translateYPercentage = -64 - (numApproversInStage * 4);
    stepRef.current.style.setProperty('--translateYPercentage', `${translateYPercentage}%`);
  }, [request.stageApprovers, request.stageApprovers.length, stage.id]); 
  return (
    <li 
      id={`step-${stage.id}`} 
      ref={stepRef}
      key={stage.id} 
      className={`step ${isAtOrBeyondCurrentStage ? 'step-primary' : ''} stepWithDynamicHeight`}
      data-content={`${stageIsApproved ? '✓' : ''}`}
      onMouseEnter={() => setShowAddApprover(session?.user?.isAdmin ?? false)}
      onMouseLeave={() => setShowAddApprover(false)}
    >
      <div className="flex flex-col gap-2">
        <div>{stage.name}</div>
        <ul>
          {request.stageApprovers?.filter(stageApprover => stageApprover.stageId === stage.id).map(stageApprover => (
            <StageApprover 
              key={stageApprover.id} 
              stageApprover={stageApprover} 
              request={request}
              onApproverRemoved={() => void onApproverRemoved()}
            />
          ))}
        </ul>
        <div className={`h-6 ${showAddApprover ? 'visible' : 'invisible'}`}>
          <AddApprover
            request={request}
            stageId={stage.id}
            onApproverAdded={() => void onApproverAdded()}
          />
        </div>
      </div>
    </li>
  )
};

export const Stages: FC<Props> = ({ request, onApproverAdded, onApproverRemoved }) => {
  const { data: stages } = api.stage.getAll.useQuery();
  const { data: workflow } = api.workflow.getById.useQuery({
    id: request.requestType.workflowId,
    includeStages: true,
  }, {
    enabled: request.requestType.workflowId !== undefined
  });
  const currentStageInWorkflow = workflow?.stages?.find(stage => stage.stageId === request.stageId);
  const finalStageOrder = workflow?.stages?.sort((a, b) => b.order - a.order)[0]?.order ?? 0;
  return (
    <ul className="steps steps-vertical">
      {workflow?.stages.sort((a, b) => a.order - b.order).map(s => {
        const stage = stages?.find(stage => stage.id === s.stageId);
        if (!stage || !currentStageInWorkflow) return null;
        return (
          <Stage
            key={stage.id}
            stage={stage}
            stageInWorkflow={s}
            currentStageInWorkflow={currentStageInWorkflow}
            finalStageOrder={finalStageOrder}
            request={request}
            onApproverAdded={() => void onApproverAdded()}
            onApproverRemoved={() => void onApproverRemoved()}
          />
        )
      })}
    </ul>
  )
};

export default Stages;