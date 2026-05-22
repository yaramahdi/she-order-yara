"use client";

export default function PrintReportButton() {
  return (
    <button
      type="button"
      className="report-print-btn no-print"
      onClick={() => window.print()}
    >
      طباعة / حفظ PDF
    </button>
  );
}