import React from "react";
import { BubbleSync } from "@/components/admin/BubbleSync";

export default function Integrations() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">System Integrations</h1>
        <p className="text-gray-500 mt-2">
          Manage external data sources and integrations for BlueEarth Capital
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BubbleSync />
        
        {/* More integration cards can be added here */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm opacity-60">
          <div className="p-6">
            <h3 className="text-xl font-semibold">Other Integrations</h3>
            <p className="text-sm text-gray-500 mt-2">
              Additional integrations will be available in future updates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}