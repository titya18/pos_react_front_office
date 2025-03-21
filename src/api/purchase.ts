const API_BASE_URL = process.env.REACT_APP_API_URL || "";

interface Product {
    id: number;
    name: string;
}

interface PurchaseDetail {
    id: number;
    productId: number;
    productVariantId: number;
    name: string;
    code: string;
    products: Product | null;
    quantity: number;
    cost: number;
    taxNet: number;
    taxMethod: string | null;
    discount: number;
    discountMethod: string | null;
    total: number;
}

export interface PurchaseData {
    id?: number;
    branchId: number;
    supplierId: number;
    branch: { id: number, name: string } | null;
    suppliers: { id: number, name: string } | null;
    ref: string;
    date?: string | null; // Format: YYYY-MM-DD
    taxRate?: string | null;
    taxNet: number | null;
    discount?: string | null;
    shipping?: string | null;
    grandTotal: number;
    paidAmount: number | null;
    status: string;
    note: string;
    purchaseDetails: PurchaseDetail[];
}

export interface PaymentData {
    branchId: number | null;
    purchaseId: number | null;
    paymentMethodId: number | null;
    amount: number | null;
    createdAt: string | null;
    paymentMethods: { name: string } | null;
}

export const upsertPurchase = async (purchaseData: PurchaseData): Promise<PurchaseData> => {
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

export const insertPurchasePayment = async (paymentData: PaymentData): Promise<PaymentData> => {
    console.log("API DAta:", paymentData);
    // const { ...data } = paymentData;
    const response = await fetch(`${API_BASE_URL}/api/purchase/payment`, {
        credentials: "include",
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(paymentData)
    });
    console.log("response:", response);
    if (!response.ok) {
        const errorResponse = await response.json();
        const customError = "Error inserting purchase payment";
        throw new Error(errorResponse.message || customError);
    }

    return response.json();
};

export const getPurchasePaymentById = async (id: number): Promise<PaymentData[]> => {
    const response = await fetch(`${API_BASE_URL}/api/purchase/payment/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching purchase payments");
    }

    return response.json();
};

export const getAllPurchases = async (
    page: number,
    searchTerm: string,
    pageSize: number,
    sortField: string | null,
    sortOrder: "asc" | "desc" | null
): Promise<{ data: PurchaseData[], total: number }> => {
    const sortParams = sortField && sortOrder ? `&sortField=${sortField}&sortOrder=${sortOrder}` : "";
    const response = await fetch(`${API_BASE_URL}/api/purchase?page=${page}&searchTerm=${searchTerm}&pageSize=${pageSize}${sortParams}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching purchase");
    }
    return response.json();
};

export const getPurchaseByid = async (id: number): Promise<PurchaseData> => {
    const response = await fetch(`${API_BASE_URL}/api/purchase/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching purchase");
    }

    return response.json();
};

export const deletePurchase = async (id: number): Promise<PurchaseData> => {
    const response = await fetch(`${API_BASE_URL}/api/purchase/${id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error deleting purchase");
    }
    return response.json();
};