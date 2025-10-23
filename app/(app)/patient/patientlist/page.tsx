"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  Box,
  IconButton,
  Menu,
  MenuItem as MenuOption,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/navigation";

/* ---------------------- Patient Type ---------------------- */
type Patient = {
  patientId: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  uhid: string;
  abhaNumber: string | null;
  abhaAddress: string | null;
  registrationDate: string;
  lastVisitDate?: string;
  lastVisitType?: string;
};

/* ---------------------- Component ---------------------- */
export default function PatientListPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState(false);

  // filters
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "abha" | "non-abha">("all");

  useEffect(() => {
    fetch("/data/patients.json")
      .then((res) => res.json())
      .then((data: Patient[]) => {
        // Add mock last visit fields for now
        const withVisit = data.map((p, i) => ({
          ...p,
          lastVisitDate: ["2025-10-01", "2025-09-22", "2025-09-15"][i % 3],
          lastVisitType: ["OPD", "Daycare", "Immunization"][i % 3],
        }));
        setPatients(withVisit);
      })
      .catch((err) => {
        console.error("Error loading patients:", err);
        setPatients([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return patients.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.abhaNumber || "").toLowerCase().includes(q) ||
        (p.abhaAddress || "").toLowerCase().includes(q);

      const matchesFilter =
        filter === "all"
          ? true
          : filter === "abha"
          ? !!p.abhaNumber
          : !p.abhaNumber;

      return matchesQuery && matchesFilter;
    });
  }, [patients, query, filter]);

  /* ---------------------- Menu State ---------------------- */
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, p: Patient) => {
    setAnchorEl(e.currentTarget);
    setSelectedPatient(p);
  };
  const closeMenu = () => {
    setAnchorEl(null);
    setSelectedPatient(null);
  };

  /* ---------------------- JSX ---------------------- */
  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 3,
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          gap: 2,
          alignItems: "center",
          backgroundColor: "#f9fafb",
          borderRadius: 2,
          px: 1.5,
          py: 1.2,
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <TextField
          size="small"
          placeholder="Search (name, UHID, phone, ABHA no/address)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{ flex: 1, background: "white", borderRadius: 1 }}
        />
        <TextField
          select
          size="small"
          label="Filter"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as "all" | "abha" | "non-abha")
          }
          sx={{ minWidth: 140, background: "white", borderRadius: 1 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="abha">ABHA Linked</MenuItem>
          <MenuItem value="non-abha">Non-ABHA</MenuItem>
        </TextField>

        <button
          style={{
            background: "var(--secondary, #64ac44)",
            color: "#fff",
            padding: "7px 16px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 600,
            border: "none",
          }}
          onClick={() => router.push("/patient/registration")}
        >
          Register New
        </button>
        <button
          style={{
            background: "var(--tertiary, #02066b)",
            color: "#fff",
            padding: "7px 16px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            fontWeight: 600,
            border: "none",
          }}
          onClick={() => setShowQR(true)}
        >
          Scan Desk
        </button>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>UHID</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>ABHA</TableCell>
              <TableCell>Last Visit</TableCell>
              <TableCell>Reg Date</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No patients found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow
                  key={p.patientId}
                  hover
                  sx={{
                    background: "#fff",
                    "&:hover": { background: "#f5f9ff" },
                  }}
                >
                  {/* UHID */}
                  <TableCell>
                    <Typography fontWeight={300} fontSize={14}>
                      {p.uhid}
                    </Typography>
                  </TableCell>

                  {/* Patient Info */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Typography
                        color="var(--secondary, #028090)"
                        fontWeight={600}
                      >
                        {p.name}
                      </Typography>

                      {/* NEW: Badge if patient registered within last 7 days */}
                      {(() => {
                        const reg = new Date(p.registrationDate);
                        const daysDiff =
                          (Date.now() - reg.getTime()) / (1000 * 60 * 60 * 24);
                        if (daysDiff <= 7) {
                          return (
                            <span
                              style={{
                                background: "var(--secondary, #02c39a)",
                                color: "#fff",
                                borderRadius: "12px",
                                padding: "2px 8px",
                                fontSize: "10px",
                                fontWeight: 600,
                                letterSpacing: 0.3,
                              }}
                            >
                              NEW
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <Typography variant="caption" color="text.secondary">
                      {p.age} yrs • {p.gender}
                    </Typography>
                  </TableCell>

                  {/* Phone */}
                  <TableCell>
                    <Typography fontSize={14}>{p.phone}</Typography>
                  </TableCell>

                  {/* ABHA */}
                  <TableCell>
                    {p.abhaNumber ? (
                      <>
                        <Typography fontWeight={600} fontSize={14}>
                          {p.abhaNumber}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontSize={12}
                        >
                          {p.abhaAddress}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        — Not Linked —
                      </Typography>
                    )}
                  </TableCell>

                  {/* Last Visit */}
                  <TableCell>
                    {p.lastVisitDate ? (
                      <>
                        <Typography variant="body2" fontSize={14}>
                          {p.lastVisitDate}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontSize={12}
                        >
                          {p.lastVisitType}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        —
                      </Typography>
                    )}
                  </TableCell>

                  {/* Registration Date */}
                  <TableCell>{p.registrationDate}</TableCell>

                  {/* Action Menu */}
                  <TableCell align="center">
                    <IconButton size="small" onClick={(e) => openMenu(e, p)}>
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={closeMenu}>
        <MenuOption
          onClick={() => {
            if (selectedPatient)
              router.push(`/patient/patientlist/${selectedPatient.patientId}`);
            closeMenu();
          }}
        >
          Edit
        </MenuOption>
        <MenuOption
          onClick={() => {
            alert("Upload clicked");
            closeMenu();
          }}
        >
          Upload
        </MenuOption>
        <MenuOption
          onClick={() => {
            alert("ABHA clicked");
            closeMenu();
          }}
        >
          ABHA
        </MenuOption>
        <MenuOption
          onClick={() => {
            alert("Appointment clicked");
            closeMenu();
          }}
        >
          Appointment
        </MenuOption>
      </Menu>

      {/* QR Overlay */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative bg-white rounded-xl shadow-lg p-6 w-[400px] text-center">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <div className="flex justify-center mb-4">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ABHA-DEMO-PLACEHOLDER"
                alt="ABHA QR Code"
                className="rounded-lg border"
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              ABHA QR Code
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              Scan this QR code with the ABHA app to share patient profile
            </p>
          </div>
        </div>
      )}
    </Paper>
  );
}
