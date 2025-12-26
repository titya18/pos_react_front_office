import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpZA, faArrowDownAZ } from "@fortawesome/free-solid-svg-icons";
import Pagination from "../components/Pagination";
import VisibleColumnsSelector from "@/components/VisibleColumnsSelector";
import ExportDropdown from "@/components/ExportDropdown";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { StockSummaryRow, BranchType } from "@/data_types/types";
import * as apiClient from "@/api/stock";
import { getAllBranches } from "@/api/branch";
import { useAppContext } from "@/hooks/useAppContext";

dayjs.extend(utc);
dayjs.extend(timezone);

const columns = [
  "No",
  "Product",
  "Variant",
  "Attributes",
  "SKU",
  "Barcode",
  "Branch",
  "Quantity",
  // "Created By",
  // "Created At",
  // "Updated By",
  // "Updated At",
];

const sortFields: Record<string, string> = {
  Product: "productName",
  Variant: "variantName",
  Attributes: "attributes",
  SKU: "sku",
  Barcode: "barcode",
  Branch: "branchName",
  Quantity: "quantity",
  // "Created At": "createdAt",
  // "Updated At": "updatedAt",
};

const StockSummary: React.FC = () => {
  const [rows, setRows] = useState<StockSummaryRow[]>([]);
  const [branches, setBranches] = useState<BranchType[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | "all">("all");
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [visibleCols, setVisibleCols] = useState(columns);

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);
  const sortField = searchParams.get("sortField") || "productName";
  const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

  const { user, hasPermission } = useAppContext();

  const updateParams = (params: Record<string, any>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([k, v]) => p.set(k, String(v)));
    setSearchParams(p);
  };

  const fetchBranches = useCallback(async () => {
      setLoading(true);
      try {
          const data = await getAllBranches();
          setBranches(data as BranchType[]);
      } catch (error) {
          console.error("Error fetching branch:", error);
      } finally {
          setLoading(false);
      }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.getStockSummary(
          sortField,
          sortOrder,
          page,
          search,
          pageSize,
          user?.roleType === "ADMIN" && selectedBranch !== "all"
            ? selectedBranch
            : undefined
        );

        setRows(res.data);
        setTotal(res.pagination.total);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    fetchBranches();
  }, [search, page, sortField, sortOrder, pageSize, selectedBranch]);

  const handleSort = (col: string) => {
    const field = sortFields[col];
    if (!field) return;
    updateParams({
      sortField: field,
      sortOrder: sortField === field && sortOrder === "asc" ? "desc" : "asc",
    });
  };

  const toggleCol = (col: string) =>
    setVisibleCols(prev =>
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );

  /** EXPORT */
  const exportData = rows.map((r, i) => {
    // Group attributes for export
    const groupedAttrs: Record<string, Set<string>> = {};
    r.attributes.forEach(a => {
      if (!groupedAttrs[a.attributeName]) groupedAttrs[a.attributeName] = new Set();
      groupedAttrs[a.attributeName].add(a.value);
    });

    return {
      No: i + 1,
      Product: r.productName,
      Variant: r.variantName,
      Attributes: Object.entries(groupedAttrs)
        .map(([name, values]) => `${name}: ${Array.from(values).join(", ")}`)
        .join("; "),
      SKU: r.sku,
      Barcode: r.barcode,
      Branch: r.branchName,
      Quantity: r.quantity,
      // "Created By": r.createdBy?.name,
      // "Created At": dayjs(r.createdAt).format("YYYY-MM-DD HH:mm"),
      // "Updated By": r.updatedBy?.name,
      // "Updated At": dayjs(r.updatedAt).format("YYYY-MM-DD HH:mm"),
    };
  });

  return (
    <div className="pt-0">
        <div className="space-y-6">
            <div className="panel">
                <div className="relative">
                    <div className="dataTable-wrapper dataTable-loading no-footer sortable searchable">
                        <div className="dataTable-top flex">
                            {/* Branch filter */}
                            {user?.roleType === "ADMIN" && (
                              <select
                                value={selectedBranch}
                                onChange={(e) => {
                                  const val = e.target.value === "all" ? "all" : Number(e.target.value);
                                  setSelectedBranch(val);
                                  updateParams({ branchId: val, page: 1 });
                                }}
                                className="form-select w-48"
                              >
                                <option value="all">All Branches</option>
                                {branches.map(b => (
                                  <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                              </select>
                            )}

                            {/* Search */}
                            <div className="dataTable-search flex-1">
                              <input
                                className="dataTable-input w-full"
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => updateParams({ search: e.target.value, page: 1 })}
                              />
                            </div>

                            <VisibleColumnsSelector
                              allColumns={columns}
                              visibleColumns={visibleCols}
                              onToggleColumn={toggleCol}
                            />

                            <ExportDropdown data={exportData} prefix="Stock" />
                        </div>

                        <div className="dataTable-container">
                            {loading ? (
                                <p>Loading...</p>
                            ) : (
                                <table className="dataTable-table min-w-full whitespace-nowrap">
                                    <thead>
                                        <tr>
                                            {columns.map(
                                              col =>
                                                visibleCols.includes(col) && (
                                                  <th
                                                    key={col}
                                                    onClick={() => handleSort(col)}
                                                    className="px-3 py-2 text-left font-medium cursor-pointer select-none"
                                                  >
                                                    <div className="flex items-center gap-1">
                                                      {col}
                                                      {sortField === sortFields[col] && (
                                                        <FontAwesomeIcon
                                                          icon={sortOrder === "asc" ? faArrowDownAZ : faArrowUpZA}
                                                        />
                                                      )}
                                                    </div>
                                                  </th>
                                                )
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                      {rows.length ? (
                                        rows.map((r, i) => (
                                          <tr key={`${r.variantId}-${r.branchName}`}>
                                            {visibleCols.includes("No") && <td>{(page - 1) * pageSize + i + 1}</td>}
                                            {visibleCols.includes("Product") && <td>{r.productName}</td>}
                                            {visibleCols.includes("Variant") && <td>{r.variantName}</td>}
                                            {visibleCols.includes("Attributes") && (
                                              <td className="flex flex-wrap gap-1">
                                                {(() => {
                                                  const groupedAttrs: Record<string, Set<string>> = {};
                                                  r.attributes.forEach(attr => {
                                                    if (!groupedAttrs[attr.attributeName]) groupedAttrs[attr.attributeName] = new Set();
                                                    groupedAttrs[attr.attributeName].add(attr.value);
                                                  });

                                                  return Object.entries(groupedAttrs).map(([name, values]) => (
                                                    <span
                                                      key={`${r.variantId}-${r.branchId ?? 0}-${name}`} // unique per row
                                                      className="badge bg-secondary mr-3"
                                                      title={`${name}: ${Array.from(values).join(", ")}`}
                                                    >
                                                      {name}: {Array.from(values).join(", ")}
                                                    </span>
                                                  ));
                                                })()}
                                              </td>
                                            )}
                                            {visibleCols.includes("SKU") && <td>{r.sku}</td>}
                                            {visibleCols.includes("Barcode") && <td>{r.barcode}</td>}
                                            {visibleCols.includes("Branch") && <td>{r.branchName}</td>}
                                            {visibleCols.includes("Quantity") && 
                                              <td>
                                                {r.quantity > 5 ? (
                                                  r.quantity
                                                ) : (
                                                  <span style={{ color: "red" }}>{r.quantity}</span>
                                                )}
                                              </td>
                                            }
                                            {/* {visibleCols.includes("Created By") && <td>{r.createdBy?.name}</td>}
                                            {visibleCols.includes("Created At") && (
                                              <td>{dayjs(r.createdAt).format("YYYY-MM-DD HH:mm")}</td>
                                            )}
                                            {visibleCols.includes("Updated By") && <td>{r.updatedBy?.name}</td>}
                                            {visibleCols.includes("Updated At") && (
                                              <td>{dayjs(r.updatedAt).format("YYYY-MM-DD HH:mm")}</td>
                                            )} */}
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan={columns.length}>No stock found</td>
                                        </tr>
                                      )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <Pagination
                        page={page}
                        pageSize={pageSize}
                        total={total}
                        onPageChange={p => updateParams({ page: p })}
                        onPageSizeChange={s => updateParams({ pageSize: s, page: 1 })}
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default StockSummary;
