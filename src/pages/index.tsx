import Head from "next/head";
import Link from "next/link";
import { type Column, useTable, useGlobalFilter } from "react-table";
import { api } from "~/utils/api";
import { useMemo } from "react";
import { type User, type Exchange } from "@prisma/client";
import Image from "next/image";

export default function Home() {
  const { data: exchanges } = api.exchange.getExchangesParticipating.useQuery({
    includeCreator: true
  });

  type ExchangeWithContext = Exchange & {
    creator: User;
  }

  const data = useMemo(() => {
    return exchanges as ExchangeWithContext[] ?? []
  }, [exchanges]);

  const columns: Column<ExchangeWithContext>[] = useMemo(() => [
    {
      Header: 'Name',
      accessor: (row: ExchangeWithContext) => row.name,
      Cell: ({ row } : { row: { original: ExchangeWithContext }}) => {
        return (
          <Link className="underline" href={`/${row.original.slug}`}>
            {row.original.name}
          </Link>
        )
      },
    },
    {
      Header: 'Creator',
      accessor: (row: ExchangeWithContext) => row.creator.name,
      Cell: ({ row } : { row: { original: ExchangeWithContext }}) => {
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
        <title>Solly Exchange</title>
        <meta name="description" content="Create and manage exchanges" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col gap-2">
        <h1>Exchanges</h1>
        <div className="flex items-center gap-2">
          <Link href="/exchange/create" className="btn w-fit">
            Create Exchange
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