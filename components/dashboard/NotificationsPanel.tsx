"use client";
import React from "react";

export type Notification = {
  id: string;
  type: string;
  message: string;
};

export default function NotificationsPanel({
  notifications,
}: {
  notifications?: Notification[];
}) {
  const loading = !notifications;

  return (
    <div className="ui-card p-4">
      <h3 className="text-sm font-semibold mb-3">Alerts & Notifications</h3>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-5 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : notifications && notifications.length > 0 ? (
        <ul className="text-sm space-y-2">
          {notifications.map((n) => (
            <li key={n.id}>
              <span className="text-gray-700">{n.message}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-gray-500">No alerts.</div>
      )}
    </div>
  );
}
