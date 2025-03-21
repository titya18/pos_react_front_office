const API_BASE_URL = process.env.REACT_APP_API_URL || "";

export interface UnitData {
    id?: number;
    name: string;
}

export const upsertUnit = async (unitData: UnitData): Promise<UnitData> => {
    const { id, ...data } =  unitData;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/api/unit/${id}` : `${API_BASE_URL}/api/unit`;

    const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const custom_error = id ? "Error updating unit" : "Error adding unit";
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || custom_error);  
    }
    return response.json();
};

export const getAllUnits = async (
    page: number,
    searchTerm: string,
    pageSize: number,
    sortField: string | null,
    sortOrder: "asc" | "desc" | null
): Promise<{ data: UnitData[], total: number }> => {
    const sortParams = sortField && sortOrder ? `&sortField=${sortField}&sortOrder=${sortOrder}` : "";
    const response = await fetch(`${API_BASE_URL}/api/unit?page=${page}&searchTerm=${searchTerm}&pageSize=${pageSize}${sortParams}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching unit");
    }
    return response.json();
};

export const getCategoryById = async (id: number): Promise<UnitData> => {
    const response = await fetch(`${API_BASE_URL}/api/unit/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching unit");
    }
    return response.json();
};

export const deleteUnit = async (id: number): Promise<UnitData> => {
    const response = await fetch(`${API_BASE_URL}/api/unit/${id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error deleting unit");
    }
    return response.json();
}