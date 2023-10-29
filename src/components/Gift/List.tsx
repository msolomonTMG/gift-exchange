import { type Gift, type Exchange, type User } from "@prisma/client";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { type FC } from "react";
import EditGift from "~/components/Gift/Edit";
import { api } from "~/utils/api";
import CreateGift from "~/components/Gift/Create";
import AddPurchaser from "./Purchasers/Add";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import RemovePurchaser from "~/components/Gift/Purchasers/Remove";
import { DeleteGift } from "~/components/Gift/Delete";

type Props = {
  exchange: Exchange & {
    participants: User[];
  };
  onGiftCreated: () => void;
}

export const GiftList: FC<Props> = ({ exchange, onGiftCreated }) => {
  const { data: session } = useSession();
  const { data: gifts, isLoading, refetch } = api.gift.getAllInExchange.useQuery({
    exchangeId: exchange.id,
    includeRequestor: true,
  });

  type GiftGroup = Record<string, Gift[]>
  const groupedGifts = gifts?.reduce((acc, gift) => {
    const requestorId = gift.requestor.id;
    if (!acc[requestorId]) {
      acc[requestorId] = [];
    }
    acc[requestorId]?.push(gift);
    return acc;
  }, {} as GiftGroup);

  const UserProfile: FC<{ userId: string }> = ({ userId }) => {
    const user = exchange.participants.find(p => p.id === userId);
    if (!user) return null;
    return (
      <div className="flex items-center gap-2">
        <div className="avatar">
          <div className="w-12 mask mask-squircle">
            <Image 
              src={user.image ?? ""} 
              alt={user.name ?? "User Image"} 
              width={100}
              height={100}
            />          
          </div>
        </div>
        <h2 className="font-bold text-xl">{user.name}</h2>
      </div>
    )
  };

  const Purchasers: FC<{ gift: Gift }> = ({ gift }) => {
    const purchaseIsForUser = gift.requestorId === session?.user?.id;
    const { data: purchase } = api.gift.getPurchaseByGift.useQuery({
      giftId: gift.id,
      includePurchasers: !purchaseIsForUser,
    }, {
      enabled: !purchaseIsForUser,
    });
    if (purchaseIsForUser) {
      return null;
    }
    return (
      <div className="bg-base-300 p-4 rounded-lg flex flex-wrap gap-2">
        {purchase?.purchasers.map(purchaser => (
          <div key={purchaser.id} className="badge badge-outline gap-2">
            <div className="avatar">
              <div className="w-4 mask mask-squircle">
                <Image 
                  src={purchaser.image ?? ""} 
                  alt={purchaser.name ?? "User Image"} 
                  width={100}
                  height={100}
                />          
              </div>
            </div>
            <span className="whitespace-nowrap">{purchaser.name}</span>
            <RemovePurchaser 
              gift={gift}
              participantUserId={purchaser.id}
              onPurchaserRemoved={() => {
                void refetch();
                void onGiftCreated();
              }}
            />
          </div>
        ))}
        <AddPurchaser gift={gift} onPurchaserAdded={() => {
          void refetch();
          void onGiftCreated();
        }} />
      </div>
    )
  };

  if (!groupedGifts && !isLoading) {
    return (
      <div className="h-full w-full flex flex-col gap-2">
        <h1 className="mb-0">Gifts Not Found</h1>
        <p>No gifts found for exchange with id {exchange.id}</p>
      </div>
    )
  }

  if (!groupedGifts && isLoading) {
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

  if (!groupedGifts) return null;

  return (
    <div className="flex flex-col gap-2">
      {Object.entries(groupedGifts).map(([requestorId, gifts]) => (
        <div key={requestorId} className="collapse collapse-arrow bg-base-200">
          <input type="checkbox" className="peer" /> 
          <div className="collapse-title">
            <UserProfile userId={requestorId} />
          </div>
          <div className="collapse-content overflow-x-auto"> 
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Link</th>
                    {requestorId === session?.user?.id && (
                      <th>Actions</th>
                    )}
                    {requestorId !== session?.user?.id && (
                      <th>Purchasers</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {gifts?.map(gift => (
                    <tr key={gift.id}>
                      <td>
                        <div className="flex items-center space-x-3">
                          {gift.image && (
                            <div className="avatar">
                              <div className="mask mask-squircle w-12 h-12">
                                <Image 
                                  src={gift.image ?? ""} 
                                  alt={gift.name ?? "Gift Image"} 
                                  width={100}
                                  height={100}
                                />
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="font-bold">{gift.name}</div>
                            <div className="text-sm opacity-50">${Number(gift.price ?? 0).toFixed(2)}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="w-full min-w-xs">
                          {gift.description}
                        </div>
                      </td>
                      <td>
                        <Link href={gift.url ?? ""} className="btn btn-sm flex flex-nowrap">
                          <span className="whitespace-nowrap">View Online</span>
                          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </Link>
                      </td>
                      {requestorId === session?.user?.id && (
                        <td>
                          <div className="flex items-center gap-2">
                            <EditGift 
                              gift={gift} 
                              onGiftEdited={() => {
                                void refetch();
                                void onGiftCreated();
                              }}
                            />
                            <DeleteGift
                              gift={gift}
                              onGiftDeleted={() => {
                                void refetch();
                                void onGiftCreated();
                              }}
                            />
                          </div>
                        </td>
                      )}
                      {requestorId !== session?.user?.id && (
                        <td>
                          <Purchasers gift={gift} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                {requestorId === session?.user?.id && (
                  <tfoot>
                    <CreateGift 
                      exchangeId={exchange.id} 
                      onGiftCreated={() => {
                        console.log("Create gift got the emission")
                        void refetch();
                        void onGiftCreated();
                      }} 
                    />
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}