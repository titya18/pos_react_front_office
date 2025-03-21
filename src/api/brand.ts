const API_BASE_URL = process.env.REACT_APP_API_URL || "";

export interface BrandData {
    id?: number;
    name: string;
    description: string;
    image: File | null;
};

export const getAllBrands = async (
    page: number,
    searchTerm: string,
    pageSize: number,
    sortField: string | null,
    sortOrder: "asc" | "desc" | null
): Promise<{ data: BrandData[], total: number }> => {
    const sortParams = sortField && sortOrder ? `&sortField=${sortField}&sortOrder=${sortOrder}` : "";
    const response = await fetch(`${API_BASE_URL}/api/brand?page=${page}&searchTerm=${searchTerm}&pageSize=${pageSize}${sortParams}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching Brand");
    }
    return response.json();
};

export const getBrandById = async (id: number): Promise<BrandData> => {
    const response = await fetch(`${API_BASE_URL}/api/brand/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching brand");
    }
    return response.json();
};

export const upsertBrand = async (brandData: BrandData): Promise<BrandData> => {
    const { id, image, ...data } = brandData;
    const method = id ? "PUT" : "POST";
    const url = id ? `${API_BASE_URL}/api/brand/${id}` : `${API_BASE_URL}/api/brand`;

    // Prepare FormData
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    if (image) formData.append('image', image);
    
    const response = await fetch(url, {
        method,
        credentials: "include",
        body: formData, // Send FormData instead of JSON
    });
    
    if (!response.ok) {
        const custom_error = id ? "Error updating brand" : "Error adding brand";
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || custom_error);
    }
    return response.json();
};

export const deleteBrand = async (id: number): Promise<BrandData> => {
    const response = await fetch(`${API_BASE_URL}/api/brand/${id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error deleting brand");
    }
    return response.json();
};