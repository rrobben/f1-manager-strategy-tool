import React from "react";

import "./Table.css";

import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";

const Table = ({ data, columns, defaultSort, setSelectedRows, selectedRows }) => {
  const [sorting, setSorting] = React.useState(defaultSort || []);
  const [rowSelection, setRowSelection] = React.useState({});

  React.useEffect(() => {
    setSelectedRows(Object.keys(rowSelection).map((idx) => data[parseInt(idx)]?.id));
  }, [rowSelection]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: process.env.NODE_ENV === "development",
  });

  React.useEffect(() => {
    // When data changes, find new indices for currently selected rows and set them selected.
    const newRowSelection = Object.fromEntries(selectedRows.map((id) => [data.findIndex((d) => d.id === id), true]));
    table.setRowSelection(newRowSelection);
  }, [data]);

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
