"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  Tooltip,
  TextField,
  MenuItem,
  Box,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";
import { useRouter } from "next/navigation";

type Patient = {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  uhid: string;
  abhaNumber: string | null;
  abhaAddress: string | null;
  registrationDate: string;
};

export default function PatientListPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  // NEW: search & filter states
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "abha" | "non-abha">("all");

  useEffect(() => {
    fetch("/data/patients.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load patients.json");
        return res.json();
      })
      .then((data: Patient[]) => setPatients(data))
      .catch((err) => {
        console.error("Error loading patients:", err);
        setPatients([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Smart filter
  const filtered = useMemo(() => {
    return patients.filter((p) => {
      // search text
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.abhaNumber || "").toLowerCase().includes(q) ||
        (p.abhaAddress || "").toLowerCase().includes(q);

      // filter type
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "abha"
          ? !!p.abhaNumber
          : !p.abhaNumber;

      return matchesQuery && matchesFilter;
    });
  }, [patients, query, filter]);

  return (
    <Paper sx={{ p: 2 }}>
      {/* Sleek strip card */}
      <Box
        sx={{
          mb: 2,
          p: 1.5,
          display: "flex",
          gap: 2,
          alignItems: "center",
          backgroundColor: "#f9fafb",
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <TextField
          size="small"
          variant="outlined"
          placeholder="Search (name, UHID, phone, ABHA no/address)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1 }}
        />

        <TextField
          select
          size="small"
          label="Filter"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as "all" | "abha" | "non-abha")
          }
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="abha">ABHA Linked</MenuItem>
          <MenuItem value="non-abha">Non-ABHA</MenuItem>
        </TextField>

        <button
          style={{
            backgroundColor: "#64ac44",
            color: "#fff",
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          onClick={() => {
            // 👉 Navigate to registration page
            router.push("/patient/registration");
          }}
        >
          Register New
        </button>
        <button
          style={{
            backgroundColor: "#02066b", // your standard brand color
            color: "#fff",
            padding: "6px 14px",
            borderRadius: "6px",
            fontSize: "0.85rem",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
          onClick={() => setShowQR(true)}
        >
          Scan Desk
        </button>
      </Box>

      <TableContainer>
        <Table>
          {/* Header */}
          <TableHead>
            <TableRow>
              <TableCell>UHID</TableCell>
              <TableCell>Name / Age / Gender</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>ABHA</TableCell>
              <TableCell>Reg Date</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          {/* Body */}
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No patients found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow
                  key={p.id}
                  sx={{
                    backgroundColor: "#fafafa",
                    borderRadius: 2,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                    "&:hover": {
                      backgroundColor: "#e7f2ff",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
                    },
                  }}
                >
                  {/* UHID */}
                  <TableCell>
                    <Typography variant="body2" fontWeight="500">
                      {p.uhid}
                    </Typography>
                  </TableCell>

                  {/* Name / Age / Gender */}
                  <TableCell>
                    <Typography variant="body2" color="green" fontWeight="600">
                      {p.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.age} yrs • {p.gender}
                    </Typography>
                  </TableCell>

                  {/* Phone */}
                  <TableCell>
                    <Typography variant="body2">{p.phone}</Typography>
                  </TableCell>

                  {/* ABHA */}
                  <TableCell>
                    {p.abhaNumber ? (
                      <>
                        <Typography variant="body2" fontWeight="600">
                          {p.abhaNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {p.abhaAddress}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        — Not Linked —
                      </Typography>
                    )}
                  </TableCell>

                  {/* Reg Date */}
                  <TableCell>
                    <Typography variant="body2">
                      {p.registrationDate}
                    </Typography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="center">
                    <Tooltip title="View">
                      <IconButton size="small" sx={{ color: "primary.main" }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" sx={{ color: "success.main" }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="ABHA">
                      <IconButton size="small" sx={{ color: "secondary.main" }}>
                        <LocalFloristIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

            {showQR && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="relative bg-white rounded-xl shadow-lg p-6 w-[400px] text-center">
      {/* Close X */}
      <button
        onClick={() => setShowQR(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
      >
        ✕
      </button>

      {/* QR Code (mock) */}
      <div className="flex justify-center mb-4">
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ABHA-DEMO-PLACEHOLDER"
          alt="ABHA QR Code"
          className="rounded-lg border"
        />
      </div>

      {/* Text */}
      <h2 className="text-lg font-semibold text-gray-800">ABHA QR Code</h2>
      <p className="text-sm text-gray-600 mt-2">
        Scan this QR code with the ABHA app to share patient profile
      </p>
    </div>
  </div>
)}

    </Paper>
  );
}
