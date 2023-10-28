import { type NextPage } from "next";
import { type FC } from "react";
import StageForm from "~/components/Stage/Form";
import AdminBreadcrumbs from "~/components/utils/AdminBreadcrumbs";
import { api } from "~/utils/api";

export const Stage: NextPage = () => {
  const { data: stages, refetch } = api.stage.getAll.useQuery();

  if (!stages) return null;

  const CreateStageModal: FC = () => {
    return (
      <>
        <button className="btn" onClick={()=>(document.getElementById('create_stage_modal') as HTMLDialogElement).showModal()}>
          Create New Stage
        </button>
        <dialog id="create_stage_modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Create Stage</h3>
            <StageForm submit="create" onSubmit={() => void refetch()} />
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
      <h1>Stages</h1>
      <CreateStageModal />
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((stage) => (
            <tr key={stage.id}>
              <td>{stage.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Stage;