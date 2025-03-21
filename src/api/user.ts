const API_BASE_URL = process.env.REACT_APP_API_URL || "";

interface RoleType {
    id: number;
    name: string;
}

interface UserData {
    id?: number;
    branchId: number | null;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    status: string;
    roleType: string;
    branch: { id: number, name: string } | null; // Define branch as an object with a name
    roles: RoleType[]; // Change roles to be an array of RoleType objects
};

export const getAllUsers = async (
    page: number,
    searchTerm: string,
    pageSize: number,
    sortField: string | null,
    sortOrder: "asc" | "desc" | null
): Promise<{ data: UserData[], total: number }> => {
    const sortParams = sortField && sortOrder ? `&sortField=${sortField}&sortOrder=${sortOrder}` : "";
    const response = await fetch(`${API_BASE_URL}/api/user?page=${page}&searchTerm=${searchTerm}&pageSize=${pageSize}${sortParams}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching User");
    }
    return response.json();
};

export const getUserById = async(id: number): Promise<UserData> => {
    const response = await fetch(`${API_BASE_URL}/api/user/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error fetching User");  
    }
    return response.json();
};

export const statusUser = async (id: number): Promise<UserData> => {
    const response = await fetch(`${API_BASE_URL}/api/user/status/${id}`, {
        credentials: "include"
    });
    if (!response.ok) {
        throw new Error("Error updating status");
    }
    return response.json();
};

export const createUser = async(user: UserData): Promise<UserData> => {
    const response = await fetch(`${API_BASE_URL}/api/user/`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify(user)
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error adding user");
    }
    return response.json();
};

export const updateUser = async(id: number, user: UserData): Promise<UserData> => {
    const response = await fetch(`${API_BASE_URL}/api/user/${id}`, {
        credentials: "include",
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error updating user");
    }
    return response.json();
};

export const deleteUser = async(id: number): Promise<UserData> => {
    const response = await fetch(`${API_BASE_URL}/api/user/${id}`, {
        credentials: "include",
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Error deleting user");
    }
    return response.json();
}