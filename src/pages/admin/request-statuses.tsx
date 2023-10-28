import { PencilIcon } from "@heroicons/react/24/outline";
import { type RequestStatus } from "@prisma/client";
import { type NextPage } from "next";
import { type FC } from "react";
import RequestStatusForm from "~/components/Request/Admin/Status/Form";
import AdminBreadcrumbs from "~/components/utils/AdminBreadcrumbs";
import { api } from "~/utils/api";

export const RequestStatuses: NextPage = () => {
  const { data: requestStatuses, refetch } = api.requestStatus.getAll.useQuery();

  const CreateRequestStatusModal = () => {
    return (
      <>
        <button className="btn" onClick={()=>(document.getElementById('create_request_status_modal') as HTMLDialogElement).showModal()}>
          Create New Request Status
        </button>
        <dialog id="create_request_status_modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Create Request Type</h3>
            <RequestStatusForm 
              submit="create" 
              onSubmit={() => {
                void refetch();
                (document.getElementById('create_request_status_modal') as HTMLDialogElement).close();
              }} 
            />
          </div>
        </dialog>
      </>
    )
  }

  const EditRequestStatusModal: FC<{ requestStatus: RequestStatus }> = ({ requestStatus }) => {
    return (
      <>
        <button className="btn btn-ghost" onClick={()=>(document.getElementById(`edit_${requestStatus.id}`) as HTMLDialogElement).showModal()}>
          <PencilIcon className="h-5 w-5" />
        </button>
        <dialog id={`edit_${requestStatus.id}`} className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Edit Request Type</h3>
            <RequestStatusForm 
              submit="update" 
              requestStatus={requestStatus}
              onSubmit={() => {
                void refetch();
                (document.getElementById(`edit_${requestStatus.id}`) as HTMLDialogElement).close();
              }} 
            />
          </div>
        </dialog>
      </>
    )
  }

  return (
    <div>
      <AdminBreadcrumbs
        currentPaths={["/admin/request-statuses"]}
        currentPathNames={["Request Statuses"]}
      />
      <h1>Request Statuses</h1>
      <CreateRequestStatusModal />
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requestStatuses?.map((requestStatus) => (
            <tr key={requestStatus.id}>
              <td>{requestStatus.name}</td>
              <td>
                <EditRequestStatusModal requestStatus={requestStatus} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
};

export default RequestStatuses;