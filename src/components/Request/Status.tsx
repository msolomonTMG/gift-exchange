import { type FC } from "react";
import { type RequestStatus as RequestStatusT, type Request } from "@prisma/client"

type RequestWithStatus = Request & {
  status: RequestStatusT;
}
type Props = {
  request: RequestWithStatus;
  className?: string;
}
export const RequestStatus: FC<Props> = ({ request, className }) => {
  const badgeColor = (status: RequestStatusT) => {
    switch (status.name) {
      case "Pending":
        return "badge-info";
      case "Approved":
        return "badge-success";
      case "Rejected":
        return "badge-error";
      default:
        return "badge-neutral";
    }
  }
  return (
    <div className={`${className} badge ${badgeColor(request.status)}`}>
      {request.status.name}
    </div>
  )
};

export default RequestStatus;