import { QuotationType } from "../data_types/types";
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const upsertQuotation = async (quotationData: QuotationType): Promise<QuotationType> => {
    const { id, ...data } = quotationData;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/api/quotation/${id}` : `${API_BASE_URL}/api/quotation`;

    const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        const customError = id ? "Error updating quotation" : "Error creating quotation";
        throw new Error(errorResponse.message || customError);
    }

    return response.json();
};

export const getAllQuotations = async (
    sortField: string | null,
    sortOrder: 'asc' | 'desc' | null,
    page: number,
    searchTerm: string | null,
    pageSize: number
): Promise<{ data: QuotationType[], total: number }> => {
    const sortParam =
        sortField && sortOrder
        ? `&sortField=${sortField}&sortOrder=${sortOrder}`
        : '';

    const url = `${API_BASE_URL}/api/quotation?page=${page}&searchTerm=${
        searchTerm || ''
    }&pageSize=${pageSize}${sortParam}`;

    const response = await fetch(url, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch quotations');
    }

    const result = await response.json();

    return {
        data: result.data || [],
        total: result.total || 0,
    };
};

export const getQuotationByid = async (id: number): Promise<QuotationType> => {
    const response = await fetch(`${API_BASE_URL}/api/quotation/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching quotation");
    }

    return response.json();
};

export const deleteQuotation = async (id: number, delReason: string): Promise<QuotationType> => {
    const response = await fetch(`${API_BASE_URL}/api/quotation/${id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ delReason })
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error deleting quotation");
    }
    return response.json();
};

export const convertQuotationToOrder = async (id: number): Promise<QuotationType> => {
    const response = await fetch(`${API_BASE_URL}/api/quotation/convertQTTtoINV/${id}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error sending quotation");
    }
    return response.json();
};