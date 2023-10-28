import { PencilIcon } from "@heroicons/react/24/outline";
import { type RequestType } from "@prisma/client";
import { type NextPage } from "next";
import { type FC } from "react";
import { RequestTypeForm } from "~/components/Request/Admin/Type/Form";
import AdminBreadcrumbs from "~/components/utils/AdminBreadcrumbs";
import { api } from "~/utils/api";

export const RequestTypes: NextPage = () => {
  const { data: requestTypes, refetch } = api.requestType.getAll.useQuery();
  const { data: workflows } = api.workflow.getAll.useQuery({});

  const CreateRequestTypeModal = () => {
    return (
      <>
        <button className="btn" onClick={()=>(document.getElementById('create_request_type_modal') as HTMLDialogElement).showModal()}>
          Create New Request Type
        </button>
        <dialog id="create_request_type_modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Create Request Type</h3>
            <RequestTypeForm 
              submit="create" 
              onSubmit={() => {
                void refetch();
                (document.getElementById('create_request_type_modal') as HTMLDialogElement).close();
              }} 
            />
          </div>
        </dialog>
      </>
    )
  }

  const EditRequestTypeModal: FC<{ requestType: RequestType }> = ({ requestType }) => {
    return (
      <>
        <button className="btn btn-ghost" onClick={()=>(document.getElementById(`edit_${requestType.id}`) as HTMLDialogElement).showModal()}>
          <PencilIcon className="h-5 w-5" />
        </button>
        <dialog id={`edit_${requestType.id}`} className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Edit Request Type</h3>
            <RequestTypeForm 
              submit="update" 
              requestType={requestType}
              onSubmit={() => {
                void refetch();
                (document.getElementById(`edit_${requestType.id}`) as HTMLDialogElement).close();
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
        currentPaths={["/admin/request-types"]}
        currentPathNames={["Request Types"]}
      />
      <h1>Request Types</h1>
      <CreateRequestTypeModal />
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Workflow</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requestTypes?.map((requestType) => (
            <tr key={requestType.id}>
              <td>{requestType.name}</td>
              <td>
                {
                  workflows?.find(workflow => 
                    workflow.id === requestType.workflowId
                  )?.name ?? "N/A"
                }
              </td>
              <td>
                <EditRequestTypeModal requestType={requestType} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
};

export default RequestTypes;