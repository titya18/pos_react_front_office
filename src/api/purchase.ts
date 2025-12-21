import { ProductType, PurchaseType, PurchaseDetailType, PaymentType } from "../data_types/types";
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const upsertPurchase = async (purchaseData: PurchaseType): Promise<PurchaseType> => {
    const { id, ...data } = purchaseData;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/api/purchase/${id}` : `${API_BASE_URL}/api/purchase`;

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
        const customError = id ? "Error updating purchase" : "Error creating purchase";
        throw new Error(errorResponse.message || customError);
    }

    return response.json();
};

export const insertPurchasePayment = async (paymentData: PaymentType): Promise<PaymentType> => {
    // const { ...data } = paymentData;
    const response = await fetch(`${API_BASE_URL}/api/purchase/payment`, {
        credentials: "include",
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
        const errorResponse = await response.json();
        const customError = "Error inserting purchase payment";
        throw new Error(errorResponse.message || customError);
    }

    return response.json();
};

export const getPurchasePaymentById = async (id: number): Promise<PaymentType[]> => {
    const response = await fetch(`${API_BASE_URL}/api/purchase/payment/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching purchase payments");
    }

    return response.json();
};

export const getAllPurchases = async (
    sortField: string | null,
    sortOrder: 'desc' | 'asc' | null,
    page: number,
    searchTerm: string | null,
    pageSize: number
): Promise<{ data: PurchaseType[], total: number }> => {
    const sortParam =
        sortField && sortOrder
        ? `&sortField=${sortField}&sortOrder=${sortOrder}`
        : '';

    const url = `${API_BASE_URL}/api/purchase?page=${page}&searchTerm=${
        searchTerm || ''
    }&pageSize=${pageSize}${sortParam}`;

    const response = await fetch(url, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch purchases');
    }

    const result = await response.json();

    return {
        data: result.data || [],
        total: result.total || 0,
    };
};

export const getPurchaseByid = async (id: number): Promise<PurchaseType> => {
    const response = await fetch(`${API_BASE_URL}/api/purchase/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching purchase");
    }

    return response.json();
};

export const deletePurchase = async (id: number, delReason: string): Promise<PurchaseType> => {
    const response = await fetch(`${API_BASE_URL}/api/purchase/${id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ delReason })
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error deleting purchase");
    }
    return response.json();
};