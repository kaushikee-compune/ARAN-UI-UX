"use client";
import React from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Box, Button } from "@mui/material";
import type { LabRequest } from "@/types/lab";
import LabStatusBadge from "./LabStatusBadge";

type Props = {
  data: LabRequest[];
  onUpload: (r: LabRequest) => void;
  onView: (r: LabRequest) => void;
  onCreate: () => void;
};

export default function LabRequestList({ data, onUpload, onView, onCreate }: Props) {
  const columns = React.useMemo<MRT_ColumnDef<LabRequest>[]>(
    () => [
      { accessorKey: "requestedDate", header: "Date" },
      { accessorKey: "patientName", header: "Patient" },
      { accessorKey: "doctorName", header: "Doctor" },
      {
        id: "tests",
        header: "Tests",
        Cell: ({ row }) => row.original.tests.map((t) => t.name).join(", "),
      },
      {
        id: "status",
        header: "Status",
        Cell: ({ row }) => <LabStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "Actions",
        Cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex gap-1">
              {r.status === "Requested" && (
                <Button size="small" variant="outlined" onClick={() => onUpload(r)}>
                  Upload
                </Button>
              )}
              {r.status !== "Requested" && (
                <Button size="small" variant="outlined" onClick={() => onView(r)}>
                  View
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [onUpload, onView]
  );

  return (
    <Box sx={{ p: 1 }}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold">Lab Requests</h2>
        <Button variant="contained" size="small" onClick={onCreate}>
          + New Request
        </Button>
      </div>
      <MaterialReactTable
        columns={columns}
        data={data}
        enableSorting
        enableRowSelection={false}
        enableColumnResizing
        initialState={{
          density: "comfortable",
          pagination: { pageSize: 10, pageIndex: 0 },
        }}
      />
    </Box>
  );
}
