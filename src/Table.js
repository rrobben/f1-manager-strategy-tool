import React from "react";

import "./Table.css";

import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";

const Table = ({ data, columns, defaultSort, setSelectedRows, selectedRows }) => {
  const [sorting, setSorting] = React.useState(defaultSort || []);
  const [rowSelection, setRowSelection] = React.useState({});

  React.useEffect(() => {
    // console.log(rowSelection);
    setSelectedRows(Object.keys(rowSelection).map((idx) => data[parseInt(idx)].id));
    // console.log(selectedRows);
    // console.log(Object.fromEntries(selectedRows.map((id) => [data.findIndex((d) => d.id === id), true])));
    // setRowSelection(Object.fromEntries(selectedRows.map((id) => [data.findIndex((d) => d.id === id), true])));
  }, [rowSelection]);

  const table = useReactTable({
    data,
    columns,
    initialState: {
      // rowSelection: Object.fromEntries(selectedRows.map((id) => [data.findIndex((d) => d.id === id), true])),
    },
    state: {
      sorting,
      rowSelection,
    },
    // autoResetAll: false,
    // autoResetSelectedRows: false,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: process.env.NODE_ENV === "development",
  });

  return (
    <div className="w-100">
      <table className="w-100">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <th key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: `${header.column.columnDef.headerClasses || ""} ${header.column.getCanSort() ? "cursor-pointer select-none" : ""}`,
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted()] ?? null}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            return (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id} className={cell.column.columnDef.classes}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

export const IndeterminateCheckbox = ({ indeterminate, className = "", ...rest }) => {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, indeterminate]);

  return <input type="checkbox" ref={ref} className={className + " cursor-pointer"} {...rest} />;
};
