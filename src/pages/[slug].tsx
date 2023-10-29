import { type NextPage } from "next";
import Image from "next/image";
import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { GiftList } from "~/components/Gift/List";
import AddParticipant from "~/components/Exchange/AddParticipants";
import RemoveParticipant from "~/components/Exchange/RemoveParticipant";
import { signIn } from "next-auth/react";

export const ExchangePage: NextPage = () => {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const { data: exchange, isLoading, refetch } = api.exchange.getBySlug.useQuery({
    slug,
    includeGifts: true,
  }, {
    enabled: slug !== undefined
  });

  // if the user has loaded, check if they are a participant
  if (status === "authenticated" && !exchange) {
    // if they are not, show a login message
    return (
      <div className="h-full w-full flex flex-col gap-2">
        <h1 className="mb-0">Not a Participant</h1>
        <p>You must be a participant of this exchange to view it</p>
      </div>
    )
  }
  // if the user is not logged in, show a login button
  if (status === "unauthenticated") {
    return (
      <div className="h-full w-full flex flex-col gap-2">
        <h1 className="mb-0">Not Logged In</h1>
        <p>You must be logged in to view this exchange</p>
        <button className="btn" onClick={() => void signIn('google')}>Login</button>
      </div>
    )
  }

  if (!exchange && !isLoading) {
    return (
      <div className="h-full w-full flex flex-col gap-2">
        <h1 className="mb-0">Exchange Not Found</h1>
        <p>Exchange with slug <pre>{slug}</pre> not found</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col w-full gap-2 animate-pulse">
        <div className="h-10 w-1/2 bg-base-200 rounded-lg" />
        <div className="h-6 w-24 bg-base-200 rounded-lg" />
        <div className="grid grid-cols-12 gap-2">
          <div className="h-96 col-span-9 bg-base-200 rounded-lg" />
          <div className="h-96 col-span-3 bg-base-200 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="pb-20">
      <h1 className="mb-0">{exchange.name}</h1>
      <p className="mb-10">{exchange.description}</p>
      <div className="flex flex-col gap-8">
        <div className="w-full flex items-center flex-wrap gap-2">
          {exchange?.participants.map(participant => (
            <div key={participant.id} className="badge badge-outline gap-2">
              <div className="avatar">
                <div className="w-4 mask mask-squircle">
                  <Image 
                    src={participant.image ?? ""} 
                    alt={participant.name ?? "User Image"} 
                    width={100}
                    height={100}
                  />          
                </div>
              </div>
              <span>{participant.name}</span>
              <RemoveParticipant
                exchange={exchange}
                participantUserId={participant.id}
                onParticipantRemoved={() => void refetch()}
              />
            </div>
          ))}
          <AddParticipant exchange={exchange} onParticipantAdded={() => void refetch()} />
        </div>
        <GiftList 
          exchange={exchange} 
          onGiftCreated={() => {
            console.log('created was called')
            void refetch();
          }}
        />
      </div>
      
    </div>
  )
};

export default ExchangePage;