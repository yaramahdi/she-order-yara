"use client";

import { useState } from "react";
import { formatDate, formatMoney } from "@/lib/format";
import type { OrderSummary } from "@/lib/types";

export default function FinancialsSummary({ orders }: { orders: OrderSummary[] }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(orders.map((o) => o.id))
  );

  const allChecked = selected.size === orders.length;
  const someChecked = selected.size > 0 && !allChecked;

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedOrders = orders.filter((o) => selected.has(o.id));
  const totalIls = selectedOrders.reduce((s, o) => s + Number(o.nader_paid_ils ?? 0), 0);
  const totalUsd = selectedOrders.reduce((s, o) => s + Number(o.nader_paid_usd ?? 0), 0);
  const totalDeposit = selectedOrders.reduce((s, o) => s + Number(o.total_deposit ?? 0), 0);

  return (
    <div className="financials-wrap">
      <button className="financials-toggle-btn" onClick={() => setOpen((v) => !v)}>
        <span>{open ? "▲" : "▼"}</span>
        ملخص المدفوعات
      </button>

      {open && (
        <div className="financials-table-wrap">
          <table className="financials-table">
            <thead>
              <tr>
                <th className="financials-check-col">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={(el) => {
                      if (el) el.indeterminate = someChecked;
                    }}
                    onChange={toggleAll}
                    title="تحديد الكل"
                    className="financials-checkbox"
                  />
                </th>
                <th>اسم الطلبية</th>
                <th>التاريخ</th>
                <th>مدفوع نادر — شيكل</th>
                <th>مدفوع نادر — دولار</th>
                <th>إجمالي العربون</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const isChecked = selected.has(o.id);
                return (
                  <tr
                    key={o.id}
                    className={isChecked ? "" : "financials-row-dimmed"}
                    onClick={() => toggleOne(o.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <td className="financials-check-col" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleOne(o.id)}
                        className="financials-checkbox"
                      />
                    </td>
                    <td className="financials-name">{o.email_name}</td>
                    <td className="financials-date">{formatDate(o.created_date)}</td>
                    <td>{formatMoney(o.nader_paid_ils)}</td>
                    <td>
                      {Number(o.nader_paid_usd) > 0
                        ? `$${Number(o.nader_paid_usd).toLocaleString("ar")}`
                        : "—"}
                    </td>
                    <td>{formatMoney(o.total_deposit)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="financials-totals-row">
                <td />
                <td colSpan={2}>
                  المجموع ({selected.size} من {orders.length})
                </td>
                <td>{formatMoney(totalIls)}</td>
                <td>${totalUsd.toLocaleString("ar")}</td>
                <td>{formatMoney(totalDeposit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
