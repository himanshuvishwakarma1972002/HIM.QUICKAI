import React from "react";
import { PricingTable } from "@clerk/react";

const Plan = () => {
  return (
    <div className="max-w-6xl mx-auto z-20 my-20 px-4">

      {/* Heading */}
      <div className="text-center">
        <h2 className="text-slate-700 text-[42px] font-semibold">
          Choose Your Plan
        </h2>

        <p className="text-gray-500 max-w-lg mx-auto">
          Start for free and scale up as you grow. Find the perfect plan for your
          content creation needs.
        </p>
      </div>

      {/* Pricing Table (Compressed) */}
      <div className="mt-14 flex justify-center">
        <div className="w-full max-w-3xl">
          <PricingTable />
        </div>
      </div>

    </div>
  );
};

export default Plan;