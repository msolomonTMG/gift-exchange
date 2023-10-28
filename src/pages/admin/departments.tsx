import { PlusCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { type NextPage } from "next";
import { useState, type FC } from "react";
import DepartmentForm from "~/components/Department/Form";
import { api } from "~/utils/api";
import { type User, type Department as DepartmentT } from "@prisma/client";
import Image from "next/image";
import { toast } from "react-toastify";
import AdminBreadcrumbs from "~/components/utils/AdminBreadcrumbs";

type DepartmentWithRecruitersAndParticipants = DepartmentT & {
  recruiters: User[];
  participants: User[];
};

export const Department: NextPage = () => {
  const { data: users } = api.user.getAll.useQuery();
  console.log({ users })
  const { data: departments, refetch } : {
    data: DepartmentWithRecruitersAndParticipants[] | undefined;
    refetch: () => void;
  } = api.department.getAll.useQuery({
    includeRecruiters: true,
    includeParticipants: true,
  });
  const { 
    mutateAsync: updateRecruiters,
    isLoading: updateRecruitersIsLoading,
  } = api.department.updateRecruiters.useMutation({});
  const { 
    mutateAsync: updateParticipants,
    isLoading: updateParticipantsIsLoading,
  } = api.department.updateParticipants.useMutation({});

  console.log({ departments  })

  const handleRemoveRecruiter = async (
    department: DepartmentWithRecruitersAndParticipants, 
    recruiter: User
  ) => {
    console.log({ department, recruiter })
    try {
      await updateRecruiters({
        departmentId: department.id,
        userIds: department.recruiters.filter(r => r.id !== recruiter.id).map(r => r.id),
      });
      toast.success(`Recruiter removed successfully!`);
      void refetch();
    } catch (e) {
      console.error(e);
      toast.error(`Something went wrong!`);
    }
  }

  const handleRemoveParticipant = async (
    department: DepartmentWithRecruitersAndParticipants, 
    participant: User
  ) => {
    try {
      await updateParticipants({
        departmentId: department.id,
        userIds: department.participants.filter(p => p.id !== participant.id).map(p => p.id),
      });
      toast.success(`Participant removed successfully!`);
      void refetch();
    } catch (e) {
      console.error(e);
      toast.error(`Something went wrong!`);
    }
  }

  if (!departments) return null;

  const CreateDepartmentModal: FC = () => {
    return (
      <>
        <button className="btn" onClick={()=>(document.getElementById('create_department_modal') as HTMLDialogElement).showModal()}>
          Create New Department
        </button>
        <dialog id="create_department_modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Create Department</h3>
            <DepartmentForm submit="create" onSubmit={() => void refetch()} />
          </div>
        </dialog>
      </>
    )
  }

  const AddRecruiterModal: FC<{ 
    department: DepartmentWithRecruitersAndParticipants 
  }> = ({ department}) => {
    const [selectedUser, setSelectedUser] = useState<string>();
    const handeAddRecruiter = async () => {
      console.log({
        department,
        selectedUser,
      });
      const existingRecruiters = department.recruiters?.map(r => r.id) ?? [];
      await updateRecruiters({
        departmentId: department.id,
        userIds: [...existingRecruiters, selectedUser ?? ""],
      });
      void refetch();
      (document.getElementById(`add_recruiter_${department.id}_modal`) as HTMLDialogElement).close();
    };
    return (
      <>
        <button 
          className="badge badge-lg" 
          onClick={()=>
            (document.getElementById(`add_recruiter_${department.id}_modal`) as HTMLDialogElement).showModal()
          }
        >
          <div className="flex items-center gap-2">
            <div>Add Recruiter</div>
            <PlusCircleIcon className="h-5 w-5" />
          </div>
        </button>
        <dialog id={`add_recruiter_${department.id}_modal`} className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Add Recruiter</h3>
            <select
              className="select select-bordered w-full"
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Select Recruiter</option>
              {users?.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            <div className="modal-action">
              <button 
                className="btn btn-primary"
                type="submit"
                onClick={() => void handeAddRecruiter()}
              >
                {updateRecruitersIsLoading && (
                  <div className="loading loading-spinner" />
                )}
                Add Recruiter
              </button>
              <button 
                className="btn btn-ghost" 
                onClick={() => (document.getElementById(`add_recruiter_${department.id}_modal`) as HTMLDialogElement).close()}
              >
                Cancel
              </button>
            </div>
          </div>
        </dialog>
      </>
    )
  }

  const AddParticipantModal: FC<{
    department: DepartmentWithRecruitersAndParticipants;
  }> = ({ department }) => {
    const [selectedUser, setSelectedUser] = useState<string>();
    const handeAddParticipant = async () => {
      const existingParticipants = department.participants?.map(p => p.id) ?? [];
      await updateParticipants({
        departmentId: department.id,
        userIds: [...existingParticipants, selectedUser ?? ""],
      });
      void refetch();
      (document.getElementById(`add_participant_${department.id}_modal`) as HTMLDialogElement).close();
      toast.success(`Participant added successfully!`);
    };
    return (
      <>
        <button 
          className="badge badge-lg" 
          onClick={()=>
            (document.getElementById(`add_participant_${department.id}_modal`) as HTMLDialogElement).showModal()
          }
        >
          <div className="flex items-center gap-2">
            <div>Add Participant</div>
            <PlusCircleIcon className="h-5 w-5" />
          </div>
        </button>
        <dialog id={`add_participant_${department.id}_modal`} className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <h3 className="font-bold text-lg">Add Participant</h3>
            <select
              className="select select-bordered w-full"
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Select Participant</option>
              {users?.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
            <div className="modal-action">
              <button 
                className="btn btn-primary"
                type="submit"
                onClick={() => void handeAddParticipant()}
              >
                {updateParticipantsIsLoading && (
                  <div className="loading loading-spinner" />
                )}
                Add Participant
              </button>
              <button 
                className="btn btn-ghost" 
                onClick={() => (document.getElementById(`add_participant_${department.id}_modal`) as HTMLDialogElement).close()}
              >
                Cancel
              </button>
            </div>
          </div>
        </dialog>
      </>
    )
  }

  return (
    <div>
      <AdminBreadcrumbs
        currentPaths={["/admin/departments"]}
        currentPathNames={["Departments"]}
      />
      <h1>Departments</h1>
      <CreateDepartmentModal />
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Recruiters</th>
              <th>Participants</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => (
              <tr key={department.id}>
                <td>{department.name}</td>
                <td>
                  <div className="bg-base-300 p-4 rounded flex gap-2">
                    {department.recruiters.map((recruiter) => (
                      <div 
                        key={recruiter.id}
                        className="badge badge-lg"
                      >
                        <div className="flex items-center gap-1">
                          <div className="avatar">
                            <div className="w-5 rounded-full">
                              <Image
                                src={recruiter.image ?? ""}
                                alt={recruiter.name ?? ""}
                                fill
                                className="rounded-full"
                              />
                            </div>
                          </div>
                          <div>{recruiter.name}</div>
                          <button 
                            className="btn btn-circle btn-ghost btn-xs" 
                            onClick={() => void handleRemoveRecruiter(department, recruiter)}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button> 
                        </div>
                      </div>
                    ))}
                      
                    <AddRecruiterModal department={department} />
                  </div>
                </td>
                <td>
                  <div className="bg-base-300 p-4 rounded flex gap-2">
                    {department.participants.map((participant) => (
                      <div 
                        key={participant.id}
                        className="badge badge-lg"
                      >
                        <div className="flex items-center gap-1">
                          <div className="avatar">
                            <div className="w-5 rounded-full">
                              <Image
                                src={participant.image ?? ""}
                                alt={participant.name ?? ""}
                                fill
                                className="rounded-full"
                              />
                            </div>
                          </div>
                          <div>{participant.name}</div>
                          <button 
                            className="btn btn-circle btn-ghost btn-xs" 
                            onClick={() => void handleRemoveParticipant(department, participant)}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button> 
                        </div>
                      </div>
                    ))}
                      
                    <AddParticipantModal department={department} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Department;