import { type NextPage } from "next";
import AdminBreadcrumbs from "~/components/utils/AdminBreadcrumbs";
import { api } from "~/utils/api";
import { DeleteGift } from "~/components/Gift/Delete";
import Link from "next/link";
import EditGift from "~/components/Gift/Edit";

export const Gifts: NextPage = () => {
  const { data: gifts, refetch } = api.gift.getAll.useQuery();

  if (!gifts) return null;

  return (
    <div>
      <AdminBreadcrumbs
        currentPaths={["/admin/gifts"]}
        currentPathNames={["Gifts"]}
      />
      <h1>Gifts</h1>
      <div className="overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Image</th>
              <th>URL</th>
              <th>Exchange</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {gifts.map(gift => (
              <tr key={gift.id}>
                <td>
                  {gift.name}
                </td>
                <td>
                  {gift.description}
                </td>
                <td>{gift.image}</td>
                <td>{gift.url}</td>
                <td>
                  <Link
                    href={`/exchange/${gift.exchange.slug}`}
                    className="btn btn-sm flex flex-nowrap"
                  >
                    <span className="whitespace-nowrap">
                      {gift.exchange.name}
                    </span>
                  </Link>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <EditGift
                      gift={gift}
                      onGiftEdited={() => void refetch()}
                    />
                    <DeleteGift 
                      gift={gift}
                      onGiftDeleted={() => void refetch()}
                    />
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

export default Gifts;