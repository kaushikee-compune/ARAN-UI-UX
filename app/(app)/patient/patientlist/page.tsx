"use client";

import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import LocalFloristIcon from "@mui/icons-material/LocalFlorist";

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
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <Paper sx={{ p: 2 }}>
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
            ) : patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No patients found.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((p) => (
                <TableRow
                  key={p.id}
                  sx={{
                    backgroundColor: "#fafafa",
                    borderRadius: 2,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.08)", // shadow                
                    "&:hover": {
                      backgroundColor: "#f0f7ff",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
                    },
                    // make spacing between strips
                    "& > *": { borderBottom: "2" },
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
                    <Typography variant="body2" fontWeight="600">
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
                    <Typography variant="body2">{p.registrationDate}</Typography>
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
    </Paper>
  );
}
