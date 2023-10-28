import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { type StageInWorkflow, type Workflow } from "@prisma/client";
import { type NextPage } from "next";
import { type FC } from "react";
import WorkflowForm from "~/components/Workflow/Form";
import AdminBreadcrumbs from "~/components/utils/AdminBreadcrumbs";
import { api } from "~/utils/api";

type WorkflowWithStages = Workflow & {
  stages: StageInWorkflow[];
}

export const Workflows: NextPage = () => {
  const { data: workflows, refetch } = api.workflow.getAll.useQuery({
    includeStages: true
  });
  console.log({ workflows })

  if (!workflows) return null;

  const CreateWorkflowModal: FC = () => {
    return (
      <>
        <button className="btn" onClick={()=>(document.getElementById('create_workflow_modal') as HTMLDialogElement).showModal()}>
          Create New Workflow
        </button>
        <dialog id="create_workflow_modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Create Department</h3>
            <WorkflowForm 
              submit="create" 
              onSubmit={() => {
                void refetch();
                (document.getElementById('create_workflow_modal') as HTMLDialogElement).close();
              }} 
            />
          </div>
        </dialog>
      </>
    )
  }

  const DeleteWorkflowModal: FC<{ workflow: Workflow }> = ({ workflow }) => {
    const { mutateAsync: deleteWorkflow } = api.workflow.delete.useMutation({});

    const handleDeleteWorkflow = async () => {
      await deleteWorkflow({ id: workflow.id });
      await refetch();
      (document.getElementById(`delete_${workflow.id}`) as HTMLDialogElement).close();
    }

    return (
      <>
        <button className="btn btn-ghost" onClick={()=>(document.getElementById(`delete_${workflow.id}`) as HTMLDialogElement).showModal()}>
          <TrashIcon className="h-5 w-5" />
        </button>
        <dialog id={`delete_${workflow.id}`} className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Delete Workflow</h3>
            <p>This is a permanent action that cannot be undone.</p>
            <div className="modal-action">
              <button className="btn btn-error" onClick={() => void handleDeleteWorkflow()}>Delete</button>
              <button className="btn btn-ghost" onClick={() => (document.getElementById(`delete_${workflow.id}`) as HTMLDialogElement).close()}>Cancel</button>
            </div>
          </div>
        </dialog>
      </>
    )
  }

  const EditWorkflowModal: FC<{ workflow: Workflow }> = ({ workflow }) => {
    return (
      <>
        <button className="btn btn-ghost" onClick={()=>(document.getElementById(`edit_workflow_modal_${workflow.id}`) as HTMLDialogElement).showModal()}>
          <PencilIcon className="h-5 w-5" />
        </button>
        <dialog id={`edit_workflow_modal_${workflow.id}`} className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Edit Workflow</h3>
            <WorkflowForm 
              submit="update"
              workflow={workflow as WorkflowWithStages} 
              onSubmit={() => {
                void refetch();
                (document.getElementById(`edit_workflow_modal_${workflow.id}`) as HTMLDialogElement).close();
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
        currentPaths={["/admin/stages"]}
        currentPathNames={["Stages"]}
      />
      <h1>Workflow</h1>
      <CreateWorkflowModal />
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {workflows?.map((workflow) => (
            <tr key={workflow.id}>
              <td>{workflow.name}</td>
              <td>
                <EditWorkflowModal workflow={workflow} />
                <DeleteWorkflowModal workflow={workflow} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Workflows;