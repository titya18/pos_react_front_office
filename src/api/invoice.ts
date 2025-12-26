import { InvoicePaymentType, InvoiceType } from "../data_types/types";
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const upsertInvoice = async (invoiceData: InvoiceType): Promise<InvoiceType> => {
    const { id, ...data } = invoiceData;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/api/invoice/${id}` : `${API_BASE_URL}/api/invoice`;

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
        const customError = id ? "Error updating invoice" : "Error creating invoice";
        throw new Error(errorResponse.message || customError);
    }

    return response.json();
};

export const insertInvoicePayment = async (paymentData: InvoicePaymentType): Promise<InvoicePaymentType> => {
    // const { ...data } = paymentData;
    const response = await fetch(`${API_BASE_URL}/api/invoice/payment`, {
        credentials: "include",
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        const customError = "Error inserting invoice payment";
        throw new Error(errorResponse.message || customError);
    }

    return response.json();
};

export const getInvoicePaymentById = async (id: number): Promise<InvoicePaymentType[]> => {
    const response = await fetch(`${API_BASE_URL}/api/invoice/payment/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching invoice payments");
    }

    return response.json();
};

export const getAllInvoices = async (
    sortField: string | null,
    sortOrder: 'asc' | 'desc' | null,
    page: number,
    searchTerm: string | null,
    pageSize: number
): Promise<{ data: InvoiceType[], total: number }> => {
    const sortParam =
        sortField && sortOrder
        ? `&sortField=${sortField}&sortOrder=${sortOrder}`
        : '';

    const url = `${API_BASE_URL}/api/invoice?page=${page}&searchTerm=${
        searchTerm || ''
    }&pageSize=${pageSize}${sortParam}`;

    const response = await fetch(url, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch invoices');
    }

    const result = await response.json();

    return {
        data: result.data || [],
        total: result.total || 0,
    };
};

export const getInvoiceByid = async (id: number): Promise<InvoiceType> => {
    const response = await fetch(`${API_BASE_URL}/api/invoice/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching invoice");
    }

    return response.json();
};

export const delPaymentInvoice = async (id: number, delReason: string): Promise<InvoiceType> => {
    const response = await fetch(`${API_BASE_URL}/api/invoice/delpayment/${id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ delReason })
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error deleting invoice payment");
    }
    return response.json();
};

export const deleteInvoice = async (id: number, delReason: string): Promise<InvoiceType> => {
    const response = await fetch(`${API_BASE_URL}/api/invoice/${id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ delReason })
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error deleting invoice");
    }
    return response.json();
};

export const ApprovedInvoice = async (id: number): Promise<InvoiceType> => {
    const response = await fetch(`${API_BASE_URL}/api/invoice/approve/${id}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error deleting invoice");
    }
    return response.json();
};