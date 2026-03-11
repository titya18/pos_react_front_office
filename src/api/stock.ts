import { StockSummaryRow } from "@/data_types/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export interface Pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StockSummaryResponse {
  data: StockSummaryRow[];
  summary: {
    totalItems: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
  };
  pagination: Pagination;
}

export const getStockSummary = async (
  sortField: string | null,
  sortOrder: "asc" | "desc" | null,
  page: number,
  searchTerm: string | null,
  pageSize: number,
  branchId?: number,
  stockStatus?: string,
  lowStockOnly?: boolean
): Promise<StockSummaryResponse> => {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("pageSize", String(pageSize));

  if (sortField) params.set("sortField", sortField);
  if (sortOrder) params.set("sortOrder", sortOrder);
  if (searchTerm) params.set("searchTerm", searchTerm);
  if (branchId) params.set("branchId", String(branchId));
  if (stockStatus) params.set("stockStatus", stockStatus);
  if (lowStockOnly) params.set("lowStockOnly", "true");

  const response = await fetch(`${API_BASE_URL}/api/stock?${params.toString()}`, {
    credentials: "include",
  });

  if (!response.ok) throw new Error("Error fetching stock summary");
  return response.json();
};