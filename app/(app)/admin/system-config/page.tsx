"use client";

import React, { useEffect, useState } from "react";
import { useBranch } from "@/context/BranchContext";

export default function SystemConfigPage() {
  const { selectedBranch } = useBranch();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [branchCfg, setBranchCfg] = useState<any>(null);

  // Load JSON
  useEffect(() => {
  async function load() {
    setLoading(true);

    const res = await fetch("/data/system-config.json");
    const data = await res.json();
    setConfig(data);

    // Ensure selectedBranch is always a string branchId
    const branchId = selectedBranch;
      
    if (!branchId) {
      setBranchCfg({});
    } else {
      setBranchCfg(data.branchConfigs[branchId] || {});
    }

    setLoading(false);
  }
  load();
}, [selectedBranch]);


  if (loading) return <div className="p-6">Loading...</div>;

  const updateBranchField = (key: string, value: string) => {
    setBranchCfg((prev: any) => ({ ...prev, [key]: value }));
  };

  const onSave = () => {
    console.log("SAVE SYSTEM CONFIG", {
      selectedBranch,
      branch: branchCfg,
      global: config.global,
    });

    alert("Saved (console only for now)");
  };

  const branchId = selectedBranch;
  

  return (
    <div className="space-y-6 p-6 ui-card max-w-3xl">
      <h2 className="text-lg font-semibold">System Configuration</h2>
      <p className="text-sm text-gray-600">
        Lightweight branch-based configuration. Reads from JSON and ready for future API integration.
      </p>

      {/* Global Settings (non-branch) */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-gray-800">Global Settings</h3>

        <div className="grid sm:grid-cols-2 gap-3">
          <SettingRead label="SMS Provider" value={config.global.smsProvider} />
          <SettingRead label="Email Provider" value={config.global.emailProvider} />
          <SettingRead label="Timezone" value={config.global.timezone} />
          <SettingRead label="Date Format" value={config.global.dateFormat} />
        </div>
      </section>

      {/* Branch Specific */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-gray-800">
           Branch Settings — {branchId}
        </h3>

        <div className="grid sm:grid-cols-2 gap-3">
          <SettingInput
            label="Appointment Prefix"
            value={branchCfg.appointmentPrefix || ""}
            onChange={(v) => updateBranchField("appointmentPrefix", v)}
          />

          <SettingInput
            label="Invoice Prefix"
            value={branchCfg.invoicePrefix || ""}
            onChange={(v) => updateBranchField("invoicePrefix", v)}
          />

          <SettingInput
            label="Currency"
            value={branchCfg.currency || ""}
            onChange={(v) => updateBranchField("currency", v)}
          />
        </div>
      </section>

      {/* Save */}
      <div className="pt-4">
        <button
          onClick={onSave}
          className="btn-primary px-4 py-2 rounded-md text-sm"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
}

/* ------------------- Small UI helpers ------------------- */

function SettingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <label className="text-xs text-gray-600">{label}</label>
      <input
        className="ui-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SettingRead({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <label className="text-xs text-gray-600">{label}</label>
      <div className="ui-input bg-gray-50">{value}</div>
    </div>
  );
}
