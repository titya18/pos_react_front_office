const API_BASE_URL = process.env.REACT_APP_API_URL || "";

export interface BranchData {
    id?: number;
    name: string;
    address: string;
}

export const getAllBranches = async (
    page: number,
    searchTerm: string,
    pageSize: number,
    sortField: string | null,
    sortOrder: "asc" | "desc" | null
): Promise<{ data: BranchData[], total: number }> => {
    const sortParams = sortField && sortOrder ? `&sortField=${sortField}&sortOrder=${sortOrder}` : "";
    const response = await fetch(`${API_BASE_URL}/api/branch?page=${page}&searchTerm=${searchTerm}&pageSize=${pageSize}${sortParams}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching Branch");
    }
    return response.json();
};

export const getBranchById = async (id: number): Promise<BranchData> => {
    const response = await fetch(`${API_BASE_URL}/api/branch/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching Branch");
    }
    return response.json();
};

// Create or Update Branch
export const upsertBranch = async (branchData: BranchData): Promise<BranchData> => {
    const { id, ...data } = branchData;
    const method = id ? "PUT" : "POST";
    const url =  id ? `${API_BASE_URL}/api/branch/${id}` : `${API_BASE_URL}/api/branch`;

    const response = await fetch(url, {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const custom_error = id ? "Error updating branch" : "Error adding branch";
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || custom_error);
    }
    return response.json();
}