
---

# 6. 🔧 Mock Data Files (API replacements)

| File | Purpose |
|------|---------|
| `branches.json` | Branch master + IDs |
| `departments.json` | Department master |
| `caretypes.json` | Care type master |
| `staff.json` | Doctors & staff with role & branch mapping |
| `roles.json` | Role → permissions matrix |
| `schedules.json` | Doctor slot schedules |
| `inventory.json` | Billing items, unit prices |
| `invoices.json` | Invoice data |
| `patients.json` | Patient list (future) |

These will be replaced by REST/GraphQL endpoints later.

---

# 7. 🧠 Advanced Systems

## **Voice & Scribe System**
- AI classification: Complaints, Advice, Other Notes  
- Integrated with consultation form  
- Works with both streaming & final transcript chunks  

## **FHIR Bundle Engine**
- Generic endpoint: `/api/fhir/v1/prefhirbundle`  
- Generates ABDM-compliant bundles from form JSON  

## **Theme & UI Style Engine**
- Saved in localStorage (`aran_theme`, `aran_ui`)  
- Affects global CSS variables  

---

# 8. 🧭 Roadmap (Next Milestones)

- Finalize Staff UI layout  
- Integrate Schedule → Appointments sync  
- Backend API integration  
- SNOMED CT + ICD-10 mapping (phase 2)  
- OPD Billing Enhancements  
- PDF/Print templates for all HI Types  
- Mobile-responsive optimization  

---

# 9. 📜 License
© 2025 ARAN Care — All rights reserved.

---

# 10. 👤 Author / Maintainer
**Compune Digital Solutions Pvt. Ltd.**  
Product: ARAN Care  
