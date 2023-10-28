import { type NextPage } from "next";
import ExchangeForm from "~/components/Exchange/Form";
import { useRouter } from "next/router";

export const CreateExchange: NextPage = () => {  
  const router = useRouter();
  return (
    <div>
      <h1>Create Exchange</h1>
      <ExchangeForm 
        submit="create" 
        onSubmit={(createdExchange) => {
          void router.push(`/exchange/${createdExchange.id}`);
        }}
      />
    </div>
  )
};

export default CreateExchange;