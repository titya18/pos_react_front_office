import { StockSummaryRow } from "@/data_types/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export interface Pagination {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// ------------------- STOCK SUMMARY -------------------
export const getStockSummary = async (
    sortField: string | null,
    sortOrder: "asc" | "desc" | null,
    page: number,
    searchTerm: string | null,
    pageSize: number,
    branchId?: number
): Promise<{ data: StockSummaryRow[]; pagination: Pagination }> => {

    const sortParams =
        sortField && sortOrder ? `&sortField=${sortField}&sortOrder=${sortOrder}` : "";

    const search =
        searchTerm ? `&searchTerm=${encodeURIComponent(searchTerm)}` : "";

    const branch =
        branchId ? `&branchId=${branchId}` : "";

    const response = await fetch(
        `${API_BASE_URL}/api/stock?page=${page}&pageSize=${pageSize}${search}${sortParams}${branch}`,
        { credentials: "include" }
    );

    if (!response.ok) throw new Error("Error fetching stock summary");
    return response.json();
};
