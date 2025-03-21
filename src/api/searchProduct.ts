const API_BASE_URL = process.env.REACT_APP_API_URL || "";

export const searchProduct = async (searchTerm: string) => {
    const response = await fetch(`${API_BASE_URL}/api/searchProductRoute?searchTerm=${searchTerm}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching search product");
    }

    return response.json();
};