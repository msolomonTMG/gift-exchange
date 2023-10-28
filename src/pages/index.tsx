import Head from "next/head";
import Link from "next/link";
import { type Column, useTable, useGlobalFilter } from "react-table";
import { api } from "~/utils/api";
import { useMemo } from "react";
import { type User, type Request, type RequestStatus, type Department, type RequestType } from "@prisma/client";
import Image from "next/image";

export default function Home() {
  const { data: requests } = api.request.getAll.useQuery({
    includeCreator: true,
    includeRequestStatus: true,
    includeDepartment: true,
    includeRequestType: true,
  });

  type RequestInTable = Request & {
    creator: User;
    status: RequestStatus;
    department: Department;
    requestType: RequestType;
  };
  const data = useMemo(() => {
    return requests as RequestInTable[] ?? []
  }, [requests]);

  console.log({ data })

  const columns: Column<RequestInTable>[] = useMemo(() => [
    {
      Header: 'Request ID',
      accessor: (row: RequestInTable) => 'REQ-' + row.id,
      Cell: ({ row } : { row: { original: RequestInTable }}) => {
        return (
          <Link className="underline" href={`/request/${row.original.id}`}>
            REQ-{row.original.id}
          </Link>
        )
      },
    },
    {
      Header: 'Department',
      accessor: (row: RequestInTable) => row.department.name,
    },
    {
      Header: 'Type',
      accessor: (row: RequestInTable) => row.requestType.name,
    },
    {
      Header: 'Creator',
      accessor: (row: RequestInTable) => row.creator.name,
      Cell: ({ row } : { row: { original: RequestInTable }}) => {
        return (
          <div className="flex items-center gap-2">
            <Image
              src={row.original.creator.image ?? ""}
              alt="profile"
              className="rounded-full w-5 h-5"
              width={32}
              height={32}
            />
            <span>{row.original.creator.name}</span>
          </div>
        )
      },
    },
    {
      Header: 'Status',
      accessor: (row: RequestInTable) => row.status.name,
      Cell: ({ row } : { row: { original: RequestInTable }}) => {
        const badgeColor = (status: string) => {
          switch (status) {
            case "Approved":
              return "badge-success";
            case "Pending":
              return "badge-secondary";
            case "Rejected":
              return "badge-error";
            default:
              return "";
          }
        };
        return (
          <div className={`badge ${badgeColor(row.original.status.name)}`}>
            {row.original.status.name}
          </div>
        )
      },
    },
    {
      Header: 'Created At',
      accessor: 'createdAt',
      Cell: ({ value } : { value: Date }) => new Date(value).toLocaleString([], {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  ], []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    setGlobalFilter,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    state: { globalFilter },
  } = useTable({ columns, data }, useGlobalFilter);

  const renderGlobalFilter = () => {
    return (
      <input
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value={globalFilter ?? ''}
        onChange={e => setGlobalFilter(e.target.value ?? '')}
        placeholder="Search..."
        className="input input-bordered w-full"
      />
    );
  };

  return (
    <>
      <Head>
        <title>People Team</title>
        <meta name="description" content="Create and manage requests" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col gap-2">
        <h1>Requests</h1>
        <div className="flex items-center gap-2">
          <Link href="/request/create" className="btn w-fit">
            Create Request
          </Link>
          {renderGlobalFilter()}
        </div>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full" {...getTableProps()}>
            <thead>
              {headerGroups.map(headerGroup => (
                // spread props will apply the key
                // eslint-disable-next-line react/jsx-key
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    // spread props will apply the key
                    // eslint-disable-next-line react/jsx-key
                    <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()}>
              {rows.map(row => {
                prepareRow(row);
                return (
                  // spread props will apply the key
                  // eslint-disable-next-line react/jsx-key
                  <tr {...row.getRowProps()}>
                    {row.cells.map(cell => (
                      // spread props will apply the key
                      // eslint-disable-next-line react/jsx-key
                      <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}