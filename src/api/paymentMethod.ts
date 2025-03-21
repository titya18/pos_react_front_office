const API_BASE_URL = process.env.REACT_APP_API_URL || "";

export interface PaymentMethodData {
    id?: number;
    name: string;
}

export const upsertPaymentMethod = async (unitData: PaymentMethodData): Promise<PaymentMethodData> => {
    const { id, ...data } =  unitData;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/api/paymentmethod/${id}` : `${API_BASE_URL}/api/paymentmethod`;

    const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const custom_error = id ? "Error updating payment method" : "Error adding payment method";
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || custom_error);  
    }
    return response.json();
};

export const getAllPaymentMethods = async (
    page: number,
    searchTerm: string,
    pageSize: number,
    sortField: string | null,
    sortOrder: "asc" | "desc" | null
): Promise<{ data: PaymentMethodData[], total: number }> => {
    const sortParams = sortField && sortOrder ? `&sortField=${sortField}&sortOrder=${sortOrder}` : "";
    const response = await fetch(`${API_BASE_URL}/api/paymentmethod?page=${page}&searchTerm=${searchTerm}&pageSize=${pageSize}${sortParams}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching payment method");
    }
    return response.json();
};

export const getPaymentMethodById = async (id: number): Promise<PaymentMethodData> => {
    const response = await fetch(`${API_BASE_URL}/api/paymentmethod/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching payment method");
    }
    return response.json();
};

export const deletePaymentMethod = async (id: number): Promise<PaymentMethodData> => {
    const response = await fetch(`${API_BASE_URL}/api/paymentmethod/${id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error deleting payment method");
    }
    return response.json();
}