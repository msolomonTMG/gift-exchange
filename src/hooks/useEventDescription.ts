import { type User, type RequestEvent } from "@prisma/client";

const useEventDescription = (event: RequestEvent & { user: User }) => {
  if (event.action === "APPROVE") {
    return `${event.user.name} approved the request`;
  }
  if (event.action === "REJECT") {
    return `${event.user.name} rejected the request`;
  }
  if (event.action === "REOPEN") {
    return `${event.user.name} reopened the request`;
  }
  if (event.action === "UPDATE") {
    type UpdatedField = {
      id: number,
      name: string,
      fromValue: string,
      toValue: string,
    }
    const updatedFields = JSON.parse(event.value) as UpdatedField[];
    const updatedFieldNames = updatedFields.map((field) => field.name);
    return `${event.user.name} updated ${updatedFieldNames.join(", ")}`;
  }
  return 'No description available'
};

export default useEventDescription;