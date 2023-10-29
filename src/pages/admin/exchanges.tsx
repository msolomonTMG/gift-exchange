import { type NextPage } from "next";
import AdminBreadcrumbs from "~/components/utils/AdminBreadcrumbs";
import { api } from "~/utils/api";
import Link from "next/link";
import ExchangeForm from "~/components/Exchange/Form";

export const Exchanges: NextPage = () => {
  const { data: exchanges, refetch } = api.exchange.getAll.useQuery({});

  if (!exchanges) return null;

  return (
    <div>
      <AdminBreadcrumbs
        currentPaths={["/admin/exchanges"]}
        currentPathNames={["Exchanges"]}
      />
      <h1>Exchanges</h1>
      <div className="overflow-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Image</th>
              <th>URL</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {exchanges.map(exchange => (
              <tr key={exchange.id}>
                <td>
                  {exchange.name}
                </td>
                <td>
                  {exchange.description}
                </td>
                <td>
                  <Link
                    href={`/${exchange.slug}`}
                    className="btn btn-sm flex flex-nowrap"
                  >
                    <span className="whitespace-nowrap">
                      {exchange.name}
                    </span>
                  </Link>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <ExchangeForm
                      exchange={exchange}
                      submit="update"
                      onSubmit={() => void refetch()}
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

export default Exchanges;
