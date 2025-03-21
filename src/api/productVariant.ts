const API_BASE_URL = process.env.REACT_APP_API_URL || "";

export interface ProductVariantData {
    id?: number,
    productId: number,
    unitId: number,
    products: { id: number, name: string } | null,
    units: { id: number, name: string } | null,
    code: string,
    name: string,
    purchasePrice: number | string,
    retailPrice: number | string,
    wholeSalePrice: number | string,
    isActive: string,
    image: File[] | null,
    imagesToDelete: string[]
};

export const getAllProductVariants = async (
    id: number,
    page: number,
    searchTerm: string,
    pageSize: number,
    sortField: string | null,
    sortOrder: "asc" | "desc" | null
): Promise<{ data: ProductVariantData[], total: number}> => {
    const sortParams = sortField && sortOrder ? `&sortField=${sortField}&sortOrder=${sortOrder}` : "";
    const response = await fetch(`${API_BASE_URL}/api/productvariant/${id}?page=${page}&searchTerm=${searchTerm}&pageSize=${pageSize}${sortParams}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching product variant");
    }
    return response.json();
};

export const getProductVariantById = async (id: number): Promise<ProductVariantData> => {
    const response = await fetch(`${API_BASE_URL}/api/productvariant/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching product's varaint");
    }
    return response.json();
}

export const upsertProductVariant = async (productVariantData: ProductVariantData): Promise<ProductVariantData> => {
    const { id, image, imagesToDelete, ...data } = productVariantData;
    const method = id ? "PUT" : "POST";
    const url = id ?    `${API_BASE_URL}/api/productvariant/${id}` : `${API_BASE_URL}/api/productvariant`;

    const formData = new FormData();
    formData.append("productId", data.productId.toString());
    formData.append("unitId", data.unitId.toString());
    formData.append("code", data.code);
    formData.append("name", data.name);
    formData.append("purchasePrice", data.purchasePrice.toString());
    formData.append("retailPrice", data.retailPrice.toString());
    formData.append("wholeSalePrice", data.wholeSalePrice.toString());
    
    // Append images if they exist
    if (image) {
        image.forEach((image) => {
            formData.append("images[]", image); // Append each image in the array
        });
    }

    // Add imagesToDelete as a JSON string
    if (imagesToDelete && imagesToDelete.length > 0) {
        formData.append("imagesToDelete", JSON.stringify(imagesToDelete));
    }

    console.log("API Data:", formData);

    const response = await fetch(url, {
        method,
        credentials: "include",
        body: formData // Send FormData instead of JSON
    });

    if (!response.ok) {
        const custom_error = id ? "Error uupdating product's variant" : "Error adding product's varint";
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || custom_error);
    }
    return response.json();
};

export const deleteProductVaraint = async (id: number): Promise<ProductVariantData> => {
    const response = await fetch(`${API_BASE_URL}/api/productvaraint/${id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    console.log("dlete api:", id);
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error deleting product's variant");
    }
    return response.json();
};

export const statusProductVariant = async (id: number): Promise<ProductVariantData> => {
    const response = await fetch(`${API_BASE_URL}/api/productvariant/status/${id}`, {
        credentials: "include"
    });
    if (!response) {
        throw new Error("Error updating status");
    }
    return response.json();
};