import { InvoiceType, OrderOnPaymentType, QuotationType, PurchaseType } from "../data_types/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface ReportInvoiceParams {
    sortField?: string | null;
    sortOrder?: "asc" | "desc" | null;
    page: number;
    pageSize: number;
    searchTerm?: string | null;

    // new filters
    startDate?: string; // YYYY-MM-DD
    endDate?: string;   // YYYY-MM-DD
    saleType?: "RETAIL" | "WHOLESALE";
    status?: string;    // PENDING, COMPLETED, etc (CANCELLED excluded in backend)
    branchId?: number;
}

interface ReportInvoiceResponse {
    data: InvoiceType[];
    total: number;
    summary: {
        totalInvoice: number;
        totalAmount: number;
        totalReceivedAmount: number;
        totalRemainAmount: number;
        totalProfit: number;
    };
}

interface ReportPaymentInvoiceResponse {
    data: OrderOnPaymentType[];
    total: number;
    summary: {
        totalPayments: number;
        totalPaid: number;
    };
}

interface ReportQuotationResponse {
    data: QuotationType[];
    total: number;
    summary: {
        totalQuotation: number;
        totalAmount: number;
    };
}

interface ReportPurchaseResponse {
    data: PurchaseType[];
    total: number;
    summary: {
        totalPurchase: number;
        grandTotalAmount: number;
        totalPaidAmount: number;
        totalRemainAmount: number;
    };
}

export const getAllReportInvoices = async ({
    sortField,
    sortOrder,
    page,
    pageSize,
    searchTerm,
    startDate,
    endDate,
    saleType,
    status,
    branchId
}: ReportInvoiceParams): Promise<ReportInvoiceResponse> => {

    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    if (searchTerm) params.set("searchTerm", searchTerm);
    if (sortField && sortOrder) {
        params.set("sortField", sortField);
        params.set("sortOrder", sortOrder);
    }

    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (saleType) params.set("saleType", saleType);
    if (status) params.set("status", status);
    if (branchId) params.set("branchId", String(branchId));

    const url = `${API_BASE_URL}/api/report/reportInvoices?${params.toString()}`;

    const response = await fetch(url, { credentials: "include" });

    if (!response.ok) {
        throw new Error("Failed to fetch invoices");
    }

    const result = await response.json();

    return {
        data: result.data || [],
        total: result.total || 0,
        summary: result.summary || {
            totalInvoice: 0,
            totalAmount: 0,
            totalReceivedAmount: 0,
            totalRemainAmount: 0,
            totalProfit: 0,
        },
    };
};

export const getAllCancelReportInvoices = async ({
    sortField,
    sortOrder,
    page,
    pageSize,
    searchTerm,
    startDate,
    endDate,
    saleType,
    status,
    branchId
}: ReportInvoiceParams): Promise<ReportInvoiceResponse> => {

    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    if (searchTerm) params.set("searchTerm", searchTerm);
    if (sortField && sortOrder) {
        params.set("sortField", sortField);
        params.set("sortOrder", sortOrder);
    }

    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (saleType) params.set("saleType", saleType);
    if (status) params.set("status", status);
    if (branchId) params.set("branchId", String(branchId));

    const url = `${API_BASE_URL}/api/report/reportCancelInvoices?${params.toString()}`;

    const response = await fetch(url, { credentials: "include" });

    if (!response.ok) {
        throw new Error("Failed to fetch invoices");
    }

    const result = await response.json();

    return {
        data: result.data || [],
        total: result.total || 0,
        summary: result.summary || {
            totalInvoice: 0,
            totalAmount: 0,
            totalReceivedAmount: 0,
            totalRemainAmount: 0,
            totalProfit: 0,
        },
    };
};

export const getAllPaymentReportInvoices = async ({
    sortField,
    sortOrder,
    page,
    pageSize,
    searchTerm,
    startDate,
    endDate,
    saleType,
    status,
    branchId
}: ReportInvoiceParams): Promise<ReportPaymentInvoiceResponse> => {

    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    if (searchTerm) params.set("searchTerm", searchTerm);
    if (sortField && sortOrder) {
        params.set("sortField", sortField);
        params.set("sortOrder", sortOrder);
    }

    const today = new Date().toISOString().split('T')[0];

    params.set("startDate", startDate || today);
    params.set("endDate", endDate || today);

    if (saleType) params.set("saleType", saleType);
    if (status) params.set("status", status);
    if (branchId) params.set("branchId", String(branchId));

    const url = `${API_BASE_URL}/api/report/reportPaymentInvoices?${params.toString()}`;

    const response = await fetch(url, { credentials: "include" });

    if (!response.ok) {
        throw new Error("Failed to fetch payment invoices");
    }

    const result = await response.json();

    return {
        data: result.data || [],
        total: result.total || 0,
        summary: result.summary || {
            totalOrders: 0,
            totalPaid: 0,
        },
    };
};

export const getAllReportQuotations = async ({
    sortField,
    sortOrder,
    page,
    pageSize,
    searchTerm,
    startDate,
    endDate,
    saleType,
    status,
    branchId
}: ReportInvoiceParams): Promise<ReportQuotationResponse> => {

    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    if (searchTerm) params.set("searchTerm", searchTerm);
    if (sortField && sortOrder) {
        params.set("sortField", sortField);
        params.set("sortOrder", sortOrder);
    }

    const today = new Date().toISOString().split('T')[0];

    params.set("startDate", startDate || today);
    params.set("endDate", endDate || today);

    if (saleType) params.set("saleType", saleType);
    if (status) params.set("status", status);
    if (branchId) params.set("branchId", String(branchId));

    const url = `${API_BASE_URL}/api/report/reportQuotations?${params.toString()}`;

    const response = await fetch(url, { credentials: "include" });

    if (!response.ok) {
        throw new Error("Failed to fetch quotation report");
    }

    const result = await response.json();

    return {
        data: result.data || [],
        total: result.total || 0,
        summary: result.summary || {
            totalQuotation: 0,
            totalAmount: 0,
        },
    };
};

export const getAllReportPurchases = async ({
    sortField,
    sortOrder,
    page,
    pageSize,
    searchTerm,
    startDate,
    endDate,
    status,
    branchId
}: ReportInvoiceParams): Promise<ReportPurchaseResponse> => {

    const params = new URLSearchParams();

    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    if (searchTerm) params.set("searchTerm", searchTerm);
    if (sortField && sortOrder) {
        params.set("sortField", sortField);
        params.set("sortOrder", sortOrder);
    }

    const today = new Date().toISOString().split('T')[0];

    params.set("startDate", startDate || today);
    params.set("endDate", endDate || today);

    if (status) params.set("status", status);
    if (branchId) params.set("branchId", String(branchId));

    const url = `${API_BASE_URL}/api/report/reportPurchases?${params.toString()}`;

    const response = await fetch(url, { credentials: "include" });

    if (!response.ok) {
        throw new Error("Failed to fetch purchase report");
    }

    const result = await response.json();

    return {
        data: result.data || [],
        total: result.total || 0,
        summary: result.summary || {
            totalPurchase: 0,
            grandTotalAmount: 0,
            totalPaidAmount: 0,
            totalRemainAmount: 0,
        },
    };
};
