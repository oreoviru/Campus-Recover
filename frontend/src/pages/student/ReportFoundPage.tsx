/**
 * Campus Recover — Report Found Item Page
 */

import React from "react";
import { ItemType } from "@/types";
import { MultiStepReportForm } from "@/components/items/MultiStepReportForm";

export const ReportFoundPage: React.FC = () => {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in">
      <MultiStepReportForm initialType={ItemType.FOUND} />
    </div>
  );
};

export default ReportFoundPage;
