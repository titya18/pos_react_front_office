import { SaleReturnType, SaleReturnDetailType } from "../data_types/types";
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

export const getAllSaleReturnsWithPagination = async (
    sortField: string | null,
    sortOrder: 'asc' | 'desc' | null,
    page: number,
    searchTerm: string | null,
    pageSize: number
): Promise<{ data: SaleReturnType[], total: number }> => {
    const sortParam =
        sortField && sortOrder
        ? `&sortField=${sortField}&sortOrder=${sortOrder}`
        : '';

    const url = `${API_BASE_URL}/api/salereturn?page=${page}&searchTerm=${
        searchTerm || ''
    }&pageSize=${pageSize}${sortParam}`;

    const response = await fetch(url, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Failed to fetch sale returns');
    }

    const result = await response.json();

    return {
        data: result.data || [],
        total: result.total || 0,
    };
};

export const upsertSaleReturn = async (saleReturnData: SaleReturnType): Promise<SaleReturnType> => {
    const { id, ...data } = saleReturnData;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/api/salereturn/${id}` : `${API_BASE_URL}/api/salereturn`;

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
        const customError = id ? "Error updating sale return" : "Error creating sale return";
        throw new Error(errorResponse.message || customError);
    }

    return response.json();
};

export const getSaleReturnById = async (
    id: number
): Promise<SaleReturnType[]> => {
    const response = await fetch(
        `${API_BASE_URL}/api/salereturn/${id}`,
        { credentials: "include" }
    );

    if (!response.ok) {
        throw new Error("Error fetching sale return");
    }

    const data = await response.json();

    // 🔥 MAP SaleReturns → items
    return data.map((sr: any) => ({
        ...sr,
        items: sr.SaleReturns || [],
    }));
};

export const getSaleReturnByReturnId = async (id: number): Promise<SaleReturnType> => {
    const response = await fetch(`${API_BASE_URL}/api/salereturn/return/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching sale return");
    }

    const data = await response.json();

    return {
        ...data,
        items: data.SaleReturns || [], // ✅ map backend field → frontend field
    };
};

