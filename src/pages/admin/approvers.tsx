import { type NextPage } from "next";
import Image from "next/image";
import { type FC } from "react";
import ApproverForm from "~/components/Approver/Form";
import { type DepartmentStageApprover, type Department, type Stage } from "@prisma/client";
import { api } from "~/utils/api";
import { PlusCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import useIsDarkTheme from "~/hooks/useIsDarkTheme";
import AdminBreadcrumbs from "~/components/utils/AdminBreadcrumbs";

export const Approvers: NextPage = () => {
  const { data: departments } = api.department.getAll.useQuery({});
  const { data: stages } = api.stage.getAll.useQuery();
  const { data: approvers, refetch } = api.departmentStageApprover.getAll.useQuery();
  console.log({ approvers, departments, stages  });

  type AddApproverModalProps = {
    department: Department;
    stage: Stage;
  };
  const AddApproverModal: FC<AddApproverModalProps> = ({ department, stage }) => {
    return (
      <>
        <button className="badge badge-lg" onClick={()=>(document.getElementById(`add_approver_modal_${department.id}_${stage.id}`) as HTMLDialogElement).showModal()}>
          <div className="flex items-center gap-2">
            <div>Add Approver</div>
            <PlusCircleIcon className="h-5 w-5" />
          </div>
        </button>
        <dialog id={`add_approver_modal_${department.id}_${stage.id}`} className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Add Approver</h3>
            <ApproverForm 
              department={department}
              stage={stage}
              onSubmit={() => void refetch()} 
            />
          </div>
        </dialog>
      </>
    )
  }
  const ApproverChip: FC<{ approver: DepartmentStageApprover }> = ({ approver }) => {
    const { data: user } = api.user.get.useQuery({ id: approver.userId });
    const { 
      mutateAsync: removeApprover, 
    } = api.departmentStageApprover.delete.useMutation({});
    const isDarkTheme = useIsDarkTheme();
  
    const handleRemoveApprover = async () => {
      await removeApprover({ 
        userId: approver.userId,
        departmentId: approver.departmentId,
        stageId: approver.stageId,
      });
      toast.success(`Approver removed successfully!`, {
        theme: isDarkTheme ? "dark" : "light",
      });
      void refetch();
    }
    console.log({ user })

    if (!user) return null;

    return (
      <div className="badge badge-lg">
        <div className="flex items-center gap-1">
          <div className="avatar">
            <div className="w-5 rounded-full">
              <Image
                src={user.image ?? ""}
                alt={user.name ?? ""}
                fill
                className="rounded-full"
              />
            </div>
          </div>
          <div>{user.name}</div>
          <button 
            className="btn btn-circle btn-ghost btn-xs" 
            onClick={() => void handleRemoveApprover()}
          >
            <XMarkIcon className="h-4 w-4" />
          </button> 
        </div>
      </div>
    )

  };

  return (
    <div>
      <AdminBreadcrumbs
        currentPaths={["/admin/advertisements"]}
        currentPathNames={["Approvers"]}
      />
      <h1>Approvers</h1>
      <div className="join join-vertical w-full">
        {departments?.map((department) => (
          <div key={department.id} className="collapse collapse-arrow join-item border border-base-300">
            <input type="radio" name={`${department.id}-accordion`} /> 
            <div className="collapse-title text-xl font-medium">
              {department.name}
            </div>
            <div className="collapse-content flex flex-col gap-2"> 
              {stages?.map((stage) => (
                <div key={stage.id} className="grid sm:grid-cols-2 gap-2">
                  <div className="text-xl">{stage.name}</div>
                  <div className="flex items-center gap-2 bg-base-300 w-full p-4 rounded">
                    {approvers?.filter(
                      approver => approver.departmentId === department.id && approver.stageId === stage.id
                    ).map(approver => (
                      <ApproverChip key={approver.id} approver={approver} />
                    ))}
                    <AddApproverModal 
                      department={department} 
                      stage={stage}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Approvers;