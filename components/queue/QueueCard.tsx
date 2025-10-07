"use client";

import React from "react";

export type QueueEntry = {
  uhid: string;
  token: string;
  name: string;
  gender: string;
  abhaAddress: string;
};

export default function QueueCard({ entry }: { entry: QueueEntry }) {
  return (
    <div className="ui-card p-3 border rounded-lg shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-center">
        <div className="text-sm font-semibold">{entry.name}</div>
        <div className="text-xs text-gray-500">{entry.gender}</div>
      </div>
      <div className="mt-1 text-xs text-gray-700">
        UHID: <span className="font-medium">{entry.uhid}</span>
      </div>
      <div className="text-xs text-gray-700">
        Token: <span className="font-medium">{entry.token}</span>
      </div>
      <div className="text-xs text-gray-600">ABHA: {entry.abhaAddress}</div>
    </div>
  );
}
