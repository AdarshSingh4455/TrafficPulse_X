import React from 'react';

export default function DataTable({ 
  columns, 
  data, 
  emptyText = "No records found", 
  onRowClick 
}) {
  if (!data || data.length === 0) {
    return <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">{emptyText}</div>;
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left text-xs">
        <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
          <tr>
            {columns.map((col, index) => (
              <th key={col.key || index} className={`py-2.5 px-3 font-semibold ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {data.map((row, rowIndex) => (
            <tr 
              key={row.id || rowIndex} 
              onClick={() => onRowClick && onRowClick(row)}
              className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {columns.map((col, colIndex) => (
                <td key={col.key || colIndex} className={`py-2.5 px-3 text-slate-700 dark:text-slate-300 ${col.className || ''}`}>
                  {col.render ? col.render(row, rowIndex) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
