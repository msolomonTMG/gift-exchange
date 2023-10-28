import { type RequestType, type Request, type RequestStatus } from "@prisma/client";
import { useSession } from "next-auth/react";
import { type FC } from "react";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import { api } from "~/utils/api";

type RequestWithRequestTypeAndStatus = Request & {
  requestType: RequestType;
  status: RequestStatus;
}

type Props = {
  request: RequestWithRequestTypeAndStatus;
  onReopened: () => void;
}

export const ReopenStage: FC<Props> = ({ request, onReopened }) => {
  const { data: session } = useSession();
  const { mutateAsync: reopen, isLoading } = api.request.reopen.useMutation({});
  const { data: workflow } = api.workflow.getById.useQuery({
    id: request.requestType.workflowId,
    includeStages: true,
  }, {
    enabled: request.requestType.workflowId !== undefined
  });
  const { data: stageApprovers } = api.departmentStageApprover.getAllByDepartmentIdAndStageIds.useQuery({
    departmentId: request.departmentId,
    stageIds: workflow?.stages.map(stage => stage.stageId) ?? [],
  }, {
    enabled: request.departmentId !== undefined && workflow !== undefined
  });
  const isDarkTheme = useIsDarkTheme();
  // if the user id in the session is not in the current approvers array, return null
  if (stageApprovers?.findIndex(stageApprover => stageApprover.userId === session?.user?.id) === -1) {
    return null;
  }

  const handleReopen = async () => {
    try {
      await reopen({ id: request.id });
      toast.success("Request reopened", {
        theme: isDarkTheme ? "dark" : "light",
      });
      void onReopened();
    } catch (e) {
      const error = e as Error;
      toast.error(`Error reopening: ${error.message}`, {
        theme: isDarkTheme ? "dark" : "light",
      });
    }
  }

  if (request.status.name === "Pending") {
    return null;
  }

  return (
    <button 
      className="btn btn-block btn-neutral"
      disabled={isLoading}
      onClick={() => void handleReopen()}
    >
      {isLoading && (
        <div className="loading loading-spinner" />
      )}
      Reopen
    </button>
  )
};

export default ReopenStage;