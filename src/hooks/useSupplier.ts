import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import * as apiClient from "../api/supplier";
import ShowDeleteConfirmation from "../pages/components/ShowDeleteConfirmation";

export interface SupplierData {
    id?: number;
    name: string;
    phone: string;
    email: string;
    address: string;
}

export const useSuppliers = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<SupplierData[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<SupplierData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const queryClient = useQueryClient();

    const handleAddOrEditSupplier = async (supplierData: SupplierData) => {
        try {
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });

            await apiClient.upsertSupplier(supplierData);
            toast.success(supplierData.id ? "Supplier updated successfully" : "Supplier created successfully", {
                position: "top-right",
                autoClose: 2000
            });

            fetchSuppliers();
            fetchAllSuppliers();
            setIsModalOpen(false);
        } catch (error: any) {
            toast.error(error.message || "Error adding/editing supplier", {
                position: "top-right",
                autoClose: 2000
            });
        }
    };

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            const { data, total } = await apiClient.getAllSuppliers(currentPage, searchTerm, itemsPerPage, sortField, sortOrder);
            setSuppliers(data);
            setTotalItems(total);
            setTotalPages(Math.ceil(total / itemsPerPage));
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllSuppliers = async () => {
        setIsLoading(true);
        try {
            const { data } = await apiClient.getAllSuppliers(1, "", 100, null, null);
            setAllSuppliers(data);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
        fetchAllSuppliers();
    }, [currentPage, searchTerm, itemsPerPage, sortField, sortOrder]);

    const handleSortChange = (field: string) => {
        setSortField(field);
        setSortOrder(sortField === field && sortOrder === "desc" ? "asc" : "desc");
    };

    const handlePageChange = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(1); // Reset to first page when items per page changes
    };

    const handleSearchInputChange = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1); // Reset to first page on new search
    };

    const handleEditClick = (supplier: SupplierData) => {
        setSelectedSupplier(supplier);
        setIsModalOpen(true);
    };

    const handleDeleteSupplier = async (id: number) => {
        const confirmed = await ShowDeleteConfirmation();
        if (!confirmed) return;

        try {
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
            await apiClient.deleteSupplier(id);
            toast.success("Supplier deleted successfully", { position: 'top-right', autoClose: 2000 });

            fetchSuppliers();
            setIsModalOpen(false);
            setSelectedSupplier(null);
        } catch (err: any) {
            toast.error(err.message || "Error deleting supplier", { position: 'top-right', autoClose: 2000 });
        }
    };

    return {
        suppliers,
        allSuppliers,
        isLoading,
        totalPages,
        totalItems,
        currentPage,
        itemsPerPage,
        searchTerm,
        sortField,
        sortOrder,
        isModalOpen,
        selectedSupplier,
        handleSortChange,
        handlePageChange,
        handleItemsPerPageChange,
        handleSearchInputChange,
        fetchAllSuppliers,
        handleAddOrEditSupplier,
        handleEditClick,
        handleDeleteSupplier,
        setIsModalOpen,
        setSelectedSupplier
    };
};
