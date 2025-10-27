"use client";

import React, { useMemo, useState } from "react";
import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Button,
  TextField,
  Typography,
  Box,
  Drawer,
  IconButton,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/* ---------------- Types ---------------- */
type Invoice = {
  id: string;
  patientName: string;
  patientUHID: string;
  abhaAddress: string;
  phone: string;
  date: string;
  amount: number;
  status: "Paid" | "Unpaid";
};

type Payment = {
  id: string;
  patientUHID: string;
  invoiceId: string;
  date: string;
  method: "Cash" | "Card" | "UPI" | "Insurance";
  amount: number;
};

type InvoiceItem = {
  service: string;
  qty: number;
  price: number;
};

/* ---------------- Mock Data ---------------- */
const MOCK_INVOICES: Invoice[] = [
  {
    id: "INV-1001",
    patientName: "Sampath Rao",
    patientUHID: "UHID-001",
    abhaAddress: "sampath@abdm",
    phone: "9876543210",
    date: "2025-10-07",
    amount: 1500,
    status: "Paid",
  },
  {
    id: "INV-1002",
    patientName: "Meena Kumari",
    patientUHID: "UHID-002",
    abhaAddress: "meena@abdm",
    phone: "9123456780",
    date: "2025-10-07",
    amount: 2200,
    status: "Unpaid",
  },
];

const MOCK_PAYMENTS: Payment[] = [
  {
    id: "PAY-5001",
    patientUHID: "UHID-001",
    invoiceId: "INV-1001",
    date: "2025-10-07",
    method: "UPI",
    amount: 1500,
  },
  {
    id: "PAY-5002",
    patientUHID: "UHID-002",
    invoiceId: "INV-1002",
    date: "2025-10-07",
    method: "Cash",
    amount: 2200,
  },
];

/* ---------------- Header ---------------- */
function HeaderPanel({
  date,
  onDateChange,
  search,
  onSearchChange,
  onCreateInvoice,
}: {
  date: string;
  onDateChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  onCreateInvoice: () => void;
}) {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 2,
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <TextField
        label="Date"
        type="date"
        size="small"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        sx={{ minWidth: 180 }}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        label="Search Patient"
        placeholder="Name, UHID, ABHA, Phone"
        size="small"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ flex: 1, minWidth: 220 }}
      />
      <Button
        variant="contained"
        onClick={onCreateInvoice}
        sx={{
          bgcolor: "var(--secondary)",
          "&:hover": { bgcolor: "var(--tertiary)" },
        }}
      >
        + Create Invoice
      </Button>
    </Paper>
  );
}

/* ---------------- Invoice List ---------------- */
function InvoiceList({
  invoices,
  onShowHistory,
}: {
  invoices: Invoice[];
  onShowHistory: (uhid: string) => void;
}) {
  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Invoices
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "grey.100" }}>
              {[
                "Invoice",
                "Patient",
                "UHID",
                "ABHA",
                "Phone",
                "Date",
                "Amount",
                "Status",
                "Action",
              ].map((head) => (
                <TableCell key={head}>{head}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.map((inv) => (
              <TableRow key={inv.id} hover>
                <TableCell>{inv.id}</TableCell>
                <TableCell>{inv.patientName}</TableCell>
                <TableCell>{inv.patientUHID}</TableCell>
                <TableCell>{inv.abhaAddress}</TableCell>
                <TableCell>{inv.phone}</TableCell>
                <TableCell>{inv.date}</TableCell>
                <TableCell>₹{inv.amount}</TableCell>
                <TableCell
                  sx={{
                    color: inv.status === "Paid" ? "green" : "red",
                    fontWeight: 600,
                  }}
                >
                  {inv.status}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onShowHistory(inv.patientUHID)}
                  >
                    View Payments
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

/* ---------------- Payment History ---------------- */
function PaymentHistory({
  payments,
  patientUHID,
  onClose,
}: {
  payments: Payment[];
  patientUHID: string | null;
  onClose: () => void;
}) {
  if (!patientUHID) return null;
  const filtered = payments.filter((p) => p.patientUHID === patientUHID);
  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1">
          Payment History for {patientUHID}
        </Typography>
        <Button size="small" variant="outlined" onClick={onClose}>
          Close
        </Button>
      </Box>
      {filtered.length === 0 ? (
        <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
          No payments found.
        </Typography>
      ) : (
        <TableContainer sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "grey.100" }}>
                {["Payment ID", "Invoice", "Date", "Method", "Amount"].map(
                  (head) => (
                    <TableCell key={head}>{head}</TableCell>
                  )
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell>{p.id}</TableCell>
                  <TableCell>{p.invoiceId}</TableCell>
                  <TableCell>{p.date}</TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell>₹{p.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}

/* ---------------- Invoice Drawer ---------------- */
function InvoiceDrawer({
  open,
  onClose,
  patientName,
}: {
  open: boolean;
  onClose: () => void;
  patientName: string;
}) {
  const [items, setItems] = useState<InvoiceItem[]>([
    { service: "Consultation", qty: 1, price: 500 },
  ]);
  const [gst, setGst] = useState(18);
  const [discount, setDiscount] = useState(0);

  const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const gstAmount = (subtotal * gst) / 100;
  const total = subtotal + gstAmount - discount;

  const updateItem = (i: number, patch: Partial<InvoiceItem>) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: "100vw", sm: 420 }, p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Create Invoice</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" sx={{ mb: 1 }}>
          Patient: <strong>{patientName || "—"}</strong>
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Date: {new Date().toLocaleDateString()}
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: "grey.50" }}>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((it, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <TextField
                      variant="standard"
                      value={it.service}
                      onChange={(e) =>
                        updateItem(idx, { service: e.target.value })
                      }
                      fullWidth
                    />
                  </TableCell>
                  <TableCell width={60}>
                    <TextField
                      variant="standard"
                      type="number"
                      value={it.qty}
                      onChange={(e) =>
                        updateItem(idx, { qty: Number(e.target.value) })
                      }
                      inputProps={{ min: 1 }}
                    />
                  </TableCell>
                  <TableCell width={80}>
                    <TextField
                      variant="standard"
                      type="number"
                      value={it.price}
                      onChange={(e) =>
                        updateItem(idx, { price: Number(e.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>₹{it.qty * it.price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Button
          onClick={() => setItems([...items, { service: "", qty: 1, price: 0 }])}
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
        >
          + Add Item
        </Button>

        <Divider sx={{ my: 2 }} />

        <Box display="grid" gap={1}>
          <Box display="flex" justifyContent="space-between">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <span>GST (%)</span>
            <TextField
              type="number"
              size="small"
              value={gst}
              onChange={(e) => setGst(Number(e.target.value))}
              sx={{ width: 80 }}
            />
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <span>Discount</span>
            <TextField
              type="number"
              size="small"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              sx={{ width: 80 }}
            />
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" justifyContent="space-between" fontWeight={600}>
            <span>Total</span>
            <span>₹{total}</span>
          </Box>
        </Box>

        <Box textAlign="right" sx={{ mt: 3 }}>
          <Button
            variant="contained"
            sx={{
              bgcolor: "var(--secondary)",
              "&:hover": { bgcolor: "var(--tertiary)" },
            }}
          >
            Save Invoice
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}

/* ---------------- Page ---------------- */
export default function BillingPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showInvoiceDrawer, setShowInvoiceDrawer] = useState(false);

  const filteredInvoices = useMemo(() => {
    return MOCK_INVOICES.filter(
      (inv) =>
        inv.date === date &&
        (inv.patientName.toLowerCase().includes(search.toLowerCase()) ||
          inv.patientUHID.toLowerCase().includes(search.toLowerCase()) ||
          inv.abhaAddress.toLowerCase().includes(search.toLowerCase()) ||
          inv.phone.includes(search))
    );
  }, [date, search]);

  const patientName =
    search && filteredInvoices.length > 0
      ? filteredInvoices[0].patientName
      : search;

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <HeaderPanel
        date={date}
        onDateChange={setDate}
        search={search}
        onSearchChange={setSearch}
        onCreateInvoice={() => setShowInvoiceDrawer(true)}
      />
      <InvoiceList
        invoices={filteredInvoices}
        onShowHistory={setSelectedPatient}
      />
      <PaymentHistory
        payments={MOCK_PAYMENTS}
        patientUHID={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />

      <InvoiceDrawer
        open={showInvoiceDrawer}
        onClose={() => setShowInvoiceDrawer(false)}
        patientName={patientName || ""}
      />
    </Box>
  );
}
