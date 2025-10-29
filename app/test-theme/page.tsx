"use client";
import React, { useState } from "react";
import FilterBar, { FilterOption } from "@/components/common/FilterBar";

export default function FilterDoctorDept() {
  const [selectedDoctor, setSelectedDoctor] = useState("All");
  const [selectedDept, setSelectedDept] = useState("All");
  const [search, setSearch] = useState("");

  const doctorOptions: FilterOption[] = [
    { label: "All Doctors", value: "All" },
    { label: "Dr. Hira Mardi", value: "Hira" },
    { label: "Dr. Vasanth Shetty", value: "Vasanth" },
    { label: "Dr. Banerjee", value: "Banerjee" },
  ];

  const deptOptions: FilterOption[] = [
    { label: "All Departments", value: "All" },
    { label: "Gynecology", value: "Gynecology" },
    { label: "Orthopedics", value: "Orthopedics" },
    { label: "General Medicine", value: "General" },
  ];

  return (
    <FilterBar
      fields={[
        {
          type: "select",
          key: "doctor",
          label: "Doctor",
          options: doctorOptions,
          value: selectedDoctor,
          onChange: setSelectedDoctor,
        },
        {
          type: "select",
          key: "department",
          label: "Department",
          options: deptOptions,
          value: selectedDept,
          onChange: setSelectedDept,
        },
        {
          type: "search",
          key: "search",
          placeholder: "Search patient (name / phone / ABHA)…",
          value: search,
          onChange: setSearch,
        },
      ]}
    />
  );
}
