"use client";

import React, { useEffect, useState } from "react";
import QueueCard, { QueueEntry } from "@/components/queue/QueueCard";

type QueueData = {
  waiting: QueueEntry[];
  current: QueueEntry[];
  completed: QueueEntry[];
};

export default function QueuePage() {
  const [data, setData] = useState<QueueData | null>(null);

  useEffect(() => {
    fetch("/data/queue.json")
      .then((res) => res.json())
      .then(setData)
      .catch((err) => console.error("Failed to load queue data", err));
  }, []);

  if (!data) {
    return <p className="text-sm text-gray-600">Loading queue data...</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: Waiting + Current */}
      <div className="space-y-4">
        <section>
          <h2 className="text-sm font-semibold text-gray-800 mb-2">
            Waiting Queue
          </h2>
          <div className="grid gap-2">
            {data.waiting.map((e) => (
              <QueueCard key={e.uhid} entry={e} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-800 mb-2">
            Current Ongoing
          </h2>
          <div className="grid gap-2">
            {data.current.map((e) => (
              <QueueCard key={e.uhid} entry={e} />
            ))}
          </div>
        </section>
      </div>

      {/* Right: Completed */}
      <div className="space-y-4">
        <section>
          <h2 className="text-sm font-semibold text-gray-800 mb-2">
            Completed
          </h2>
          <div className="grid gap-2">
            {data.completed.map((e) => (
              <QueueCard key={e.uhid} entry={e} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
