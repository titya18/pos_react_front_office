const API_BASE_URL = process.env.REACT_APP_API_URL || "";

export interface CategoryData {
    id?: number;
    code: string;
    name: string;
}

export const upsertCategory = async (categoryData: CategoryData): Promise<CategoryData> => {
    const { id, ...data } = categoryData;
    const method = id ? "PUT" : "POSt";
    const url = id ? `${API_BASE_URL}/api/category/${id}` : `${API_BASE_URL}/api/category`;

    const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const custom_error = id ? "Error updating Role" : "Error adding category";
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || custom_error);
    }
    return response.json();
};

export const getAllCategories = async (
    page: number,
    searchTerm: string,
    pageSize: number,
    sortField: string | null,
    sortOrder: "asc" | "desc" | null
): Promise<{ data: CategoryData[], total: number }> => {
    const sortParams = sortField && sortOrder ? `&sortField=${sortField}&sortOrder=${sortOrder}` : "";
    const response = await fetch(`${API_BASE_URL}/api/category?page=${page}&searchTerm=${searchTerm}&pageSize=${pageSize}${sortParams}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching category");
    }
    return response.json();
};

export const getCategoryByid = async (id: number): Promise<CategoryData> => {
    const response = await fetch(`${API_BASE_URL}/api/category/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching category");
    }

    return response.json();
};

export const deleteCategory = async (id: number): Promise<CategoryData> => {
    const response = await fetch(`${API_BASE_URL}/api/category/${id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error deleting category");
    }
    return response.json();
};