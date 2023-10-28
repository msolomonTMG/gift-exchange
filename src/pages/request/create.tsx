import { type NextPage } from "next";
import RequestForm from "~/components/Request/Form";
import { useRouter } from "next/router";

export const CreateRequest: NextPage = () => {  
  const router = useRouter();
  return (
    <div>
      <h1>Create Request</h1>
      <RequestForm 
        submit="create" 
        onCreate={(createdRequest) => {
          void router.push(`/request/${createdRequest.id}`);
        }}
      />
    </div>
  )
};

export default CreateRequest;