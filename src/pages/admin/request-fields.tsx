import { PencilIcon } from "@heroicons/react/24/outline";
import { type RequestField } from "@prisma/client";
import { type NextPage } from "next";
import { type FC } from "react";
import { RequestFieldForm } from "~/components/Request/Admin/Field/Form";
import { api } from "~/utils/api";
import AdminBreadcrumbs from "~/components/utils/AdminBreadcrumbs";

export const RequestFields: NextPage = () => {
  const { data: requestFields, refetch } = api.requestField.getAll.useQuery({});

  const CreateRequestTypeModal = () => {
    return (
      <>
        <button className="btn" onClick={()=>(document.getElementById('create_request_type_modal') as HTMLDialogElement).showModal()}>
          Create New Request Field
        </button>
        <dialog id="create_request_type_modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Create Request Field</h3>
            <RequestFieldForm 
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

  const EditRequestTypeModal: FC<{ requestField: RequestField }> = ({ requestField }) => {
    return (
      <>
        <button className="btn btn-ghost" onClick={()=>(document.getElementById(`edit_${requestField.id}`) as HTMLDialogElement).showModal()}>
          <PencilIcon className="h-5 w-5" />
        </button>
        <dialog id={`edit_${requestField.id}`} className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Edit Request Field</h3>
            <RequestFieldForm 
              submit="update" 
              requestField={requestField}
              onSubmit={() => {
                void refetch();
                (document.getElementById(`edit_${requestField.id}`) as HTMLDialogElement).close();
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
        currentPaths={["/admin/request-fields"]}
        currentPathNames={["Request Fields"]}
      />
      <h1>Request Fields</h1>
      <CreateRequestTypeModal />
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requestFields?.map((requestField) => (
            <tr key={requestField.id}>
              <td>{requestField.name}</td>
              <td className="capitalize">{requestField.type.toLowerCase()}</td>
              <td>
                <EditRequestTypeModal requestField={requestField} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
};

export default RequestFields;