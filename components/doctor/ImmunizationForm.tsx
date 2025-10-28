"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function ImmunizationForm() {
  const [rows, setRows] = useState([
    { vaccine: "", doseNumber: "", dueDate: "", dateGiven: "", comments: "" },
  ]);

  const addRow = () =>
    setRows((r) => [
      ...r,
      { vaccine: "", doseNumber: "", dueDate: "", dateGiven: "", comments: "" },
    ]);
  const removeRow = (i: number) =>
    setRows((r) => r.filter((_, idx) => idx !== i));
  const updateRow = (i: number, patch: Partial<(typeof rows)[number]>) =>
    setRows((r) => {
      const next = [...r];
      next[i] = { ...next[i], ...patch };
      return next;
    });

  const onSave = () => alert("Draft saved");
  const onSubmit = () => alert("Record submitted");

  // mock patient for header
  const patient = {
    name: "Ms Shampa Goswami",
    age: "52 yrs",
    gender: "Female",
    abhaNumber: "91-5510-2061-4469",
    abhaAddress: "shampa.go@sbx",
  };

  return (
    <div className="ui-card p-4 space-y-4 text-sm text-gray-800">
      {/* ---------- Header with Patient Demography  ( use header from the console/page.tsx---------- */}
      {/* <div className="grid grid-cols-[1fr_auto_1fr] items-start">
        <div className="min-w-0 pr-3">
          <div className="text-xs text-gray-500 mb-1">Patient</div>
          <div className="text-sm font-semibold">{patient.name}</div>
          <div className="text-xs text-gray-700 mt-0.5">
            {patient.gender} • {patient.age}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            ABHA No: {patient.abhaNumber}
          </div>
          <div className="text-xs text-gray-600">
            ABHA Address: {patient.abhaAddress}
          </div>
        </div>

        <Image src="/whitelogo.png" alt="ARAN Logo" width={40} height={40} />

        <div className="flex items-start justify-end pl-3">
          <button
            className="inline-flex items-center gap-1 text-xs text-gray-700 hover:text-gray-900"
            title="Open Patient Summary"
          >
            <SummaryIcon className="w-4 h-4" />
            <span className="font-medium">Patient Summary</span>
          </button>
        </div>
      </div> */}

      <div className="border-t border-gray-200 my-2" />

      {/* ---------- Immunization Table ---------- */}

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-gray-600">
            Immunization Details
          </div>
          <button
            onClick={addRow}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50 shadow-sm"
          >
            + Add Row
          </button>
        </div>

        {/* Material UI Table */}
        <TableContainer
          component={Paper}
          sx={{
            boxShadow: "0px 2px 6px rgba(0,0,0,0.05)",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "rgba(249,250,251,1)" }}>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Vaccine Name
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Dose Number
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Due Date
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Date Given
                </TableCell>
                <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
                  Comments
                </TableCell>
                <TableCell sx={{ width: 60 }} />
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((r, i) => (
                <TableRow
                  key={i}
                  hover
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                  }}
                >
                  <TableCell>
                    <TextField
                      variant="standard"
                      fullWidth
                      placeholder="e.g., Hepatitis B"
                      value={r.vaccine}
                      onChange={(e) =>
                        updateRow(i, { vaccine: e.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      fullWidth
                      placeholder="1st / 2nd / Booster"
                      value={r.doseNumber}
                      onChange={(e) =>
                        updateRow(i, { doseNumber: e.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      type="date"
                      fullWidth
                      value={r.dueDate}
                      onChange={(e) =>
                        updateRow(i, { dueDate: e.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      type="date"
                      fullWidth
                      value={r.dateGiven}
                      onChange={(e) =>
                        updateRow(i, { dateGiven: e.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="standard"
                      fullWidth
                      placeholder="Remarks"
                      value={r.comments}
                      onChange={(e) =>
                        updateRow(i, { comments: e.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      aria-label="delete"
                      color="error"
                      onClick={() => removeRow(i)}
                      size="small"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* ---------- Footer ---------- */}
      <div className="pt-3 flex items-center gap-2">
        <button
          className="btn-accent px-3 py-1.5 text-sm rounded-md border hover:bg-gray-50"
          onClick={onSave}
        >
          Save Draft
        </button>
        <button
          className="btn-primary px-3 py-1.5 text-sm rounded-md border bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700"
          onClick={onSubmit}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

/* ---------- Small UI Helpers ---------- */
function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-2 py-1.5 text-left text-gray-700 border text-xs sm:text-sm ${className}`}
    >
      {children}
    </th>
  );
}
function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-2 py-1.5 text-gray-900 break-words whitespace-normal align-top">
      {children}
    </td>
  );
}
function SummaryIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}
