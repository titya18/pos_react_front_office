import React, { useEffect, useState } from "react";
import * as apiClient from "../../api/productVariant";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpZA, faArrowDownAZ, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useAppContext } from "../../hooks/useAppContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import Pagination from "../components/Pagination";
import Modal from "./Modal";
import { NavLink, useParams } from "react-router-dom";

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


const ProductVariant: React.FC = () => {
    const { id: productId } = useParams<{ id: string }>(); // Assuming `:id` in your route
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [productVariant, setProductVariants] = useState<ProductVariantData[]>([]);
    const [selectProductVariant, setSelectProductVariant] = useState<{ 
        id: number | undefined, 
        productId: number | null, 
        unitId: number | null, 
        code: string, 
        name: string, 
        purchasePrice: number | string,
        retailPrice: number | string,
        wholeSalePrice: number | string, 
        isActive: string, 
        image: File[] | null 
    } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { hasPermission } = useAppContext();

    const fetchProductVariant = async () => {
       
        if (!productId) {
            console.error("Product ID is missing from URL.");
            return;
        }
        
        setIsLoading(true);
        try {
            const { data, total } = await apiClient.getAllProductVariants(parseInt(productId, 10), currentPage, searchTerm, itemsPerPage, sortField, sortOrder);
            setProductVariants(data);
            setTotalItems(total);
            setTotalPages(Math.ceil(total / itemsPerPage));
        } catch (error) {
            console.error("Error fetching prduct:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProductVariant();
    }, [productId, currentPage, searchTerm, itemsPerPage, sortField, sortOrder]);

    const handleSortChange = (field: string) => {
        if (sortField === field && sortOrder === "desc") {
            setSortOrder("asc");
        } else {
            setSortField(field);
            setSortOrder("desc");
        }
    };

    const handlePageChange = (pageNumber: number) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newItemsPerPage = parseInt(e.target.value, 10);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset to first page when items per page changes
    };

    const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page on new search
    };

    const queryClient = useQueryClient();

    const handleAddorEditProductVariant = async (
        id: number | null, 
        productId: number | null, 
        unitId: number | null, code: 
        string, name: string, 
        purchasePrice: number | string, 
        retailPrice: number | string, 
        wholeSalePrice: number | string, 
        isActive: string, 
        image: File[] | null, 
        imagesToDelete: string[]) => {
            try {
                await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
                const productVariantData: ProductVariantData = {
                    id: id ? id : undefined,
                    productId: productId ?? 0, // Fallback to 0 if null
                    unitId: unitId ?? 0, // Fallback to 0 if null
                    products: { id: productId ?? 0, name: "Default Product" }, // Provide default values
                    units: { id: unitId ?? 0, name: "Default Unit" }, // Provide default values
                    code,
                    name,
                    purchasePrice,
                    retailPrice,
                    wholeSalePrice,
                    isActive,
                    image,
                    imagesToDelete
                };

                console.log("ImagesToDelete:",imagesToDelete);

                await apiClient.upsertProductVariant(productVariantData);
                toast.success(id ? "Variant updated successfully" : "Variant created successfully", {
                    position: "top-right",
                    autoClose: 2000
                });
                fetchProductVariant();
                setIsModalOpen(false);
            } catch (error: any) {
                // Check if error.message is set by your API function
                if (error.message) {
                    toast.error(error.message, {
                        position: "top-right",
                        autoClose: 2000
                    });
                } else {
                    toast.error("Error adding/editting variant", {
                        position: "top-right",
                        autoClose: 2000
                    });
                }
            }
    };

    const handleEditClick = (productVariantData: ProductVariantData) => {
        setSelectProductVariant({
            id: productVariantData.id,
            productId: productVariantData.productId,
            unitId: productVariantData.unitId,
            code: productVariantData.code,
            name: productVariantData.name,
            purchasePrice: productVariantData.purchasePrice,
            retailPrice: productVariantData.retailPrice,
            wholeSalePrice: productVariantData.wholeSalePrice,
            isActive: productVariantData.isActive,
            image: productVariantData.image,
        });
        setIsModalOpen(true);
    };

    const showDeleteConfirmation = async (): Promise<boolean> => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });
    
        return result.isConfirmed;
    };
    
    const handleDeleteProductVariant = async (id: number) => {
        const confirmed = await showDeleteConfirmation();
        if (!confirmed) {
            return;
        }

        try {
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
            await apiClient.deleteProductVaraint(id);
            toast.success("Varaint deleted successfully", {
                position: "top-right",
                autoClose: 2000
            });

            fetchProductVariant();
        } catch (error: any) {
            console.error("Error deleting variant:", error);
            toast.error(error.message || "Error deleting variant", {
                position: "top-right",
                autoClose: 2000
            });
        }
    };

    const handleStatusChange = async (id: number) => {
        try {
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
            await apiClient.statusProductVariant(id);
            toast.success("Status changed successfully", {
                position: "top-right",
                autoClose: 2000
            });
            fetchProductVariant();
        } catch (error: any) {
            console.error("Error update status:", error);
            toast.error(error.message || "Error update status", {
                position: "top-right",
                autoClose: 2000
            });
        }
    }

    const API_BASE_URL = process.env.API_URL || "";

    return (
        <>
            <div className="pt-0">
                <div className="space-y-6">
                    <div className="panel">
                        <div className="relative">
                            <div className="px-0">
                                <div className="md:absolute md:top-0 ltr:md:left-0 rtl:md:right-0">
                                    <div className="mb-5 flex items-center gap-2">
                                        {hasPermission('User-Create') &&
                                            <button className="btn btn-primary gap-2" onClick={() => { setIsModalOpen(true); setSelectProductVariant(null) }}>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24px"
                                                    height="24px"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-5 w-5"
                                                >
                                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                                </svg>
                                                Add New
                                            </button>
                                        }
                                        <NavLink to="/products">
                                            <button className="btn btn-warning gap-2">
                                                <svg 
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24px"
                                                    height="24px"
                                                    viewBox="0 0 448 512"
                                                    fill="white"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-4 w-5"
                                                >
                                                    <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/>
                                                </svg>
                                                Back to product
                                            </button>
                                        </NavLink>
                                    </div>
                                </div>
                            </div>

                            <div className="dataTable-wrapper dataTable-loading no-footer sortable searchable">
                                <div className="dataTable-top">
                                    <div className="dataTable-search">
                                        <input
                                            className="dataTable-input"
                                            type="text"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={handleSearchInputChange}
                                        />
                                    </div>
                                </div>
                                <div className="dataTable-container">
                                    {isLoading ? (
                                        <p>Loading...</p>
                                    ) : (
                                        <table id="myTable1" className="whitespace-nowrap dataTable-table">
                                            <thead>
                                                <tr>
                                                    <th onClick={() => handleSortChange("image")}>
                                                        Image <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th>
                                                    <th onClick={() => handleSortChange("code")}>
                                                        Code <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th>
                                                    <th onClick={() => handleSortChange("name")}>
                                                        Name <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th>
                                                    <th onClick={() => handleSortChange("retailPrice")}>
                                                        Purchase Price <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th>
                                                    <th onClick={() => handleSortChange("retailPrice")}>
                                                        Retail Price <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th>
                                                    <th onClick={() => handleSortChange("wholeSalePrice")}>
                                                        Whole Sale Price <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th>
                                                    <th onClick={() => handleSortChange("productId")}>
                                                        Prodcut <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th>
                                                    <th onClick={() => handleSortChange("unitId")}>
                                                        Unit <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th>
                                                    <th>Status</th>
                                                    <th className="!text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                            {productVariant && productVariant.length > 0 ? (
                                                    productVariant.map((rows, index) => {
                                                        return (
                                                            <tr key={index}>
                                                                <td><img src={`${API_BASE_URL}/${Array.isArray(rows.image) ? rows.image[0] : rows.image}`} alt={rows.name} width="50"/></td>
                                                                <td>{rows.code}</td>
                                                                <td>{rows.name}</td>
                                                                <td>$ { Number(rows.purchasePrice).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }</td>
                                                                <td>$ { Number(rows.retailPrice).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }</td>
                                                                <td>$ { Number(rows.wholeSalePrice).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }</td>
                                                                <td>{rows.products ? rows.products.name : ""}</td>
                                                                <td>{rows.units ? rows.units.name : ""}</td>
                                                                <td>
                                                                    <button onClick={() => rows.id && handleStatusChange(rows.id)}>
                                                                        {rows.isActive == '1'
                                                                            ? <span className="badge badge-outline-success"><FontAwesomeIcon icon={faCheck} /> Actived</span>
                                                                            : <span className="badge badge-outline-danger"><FontAwesomeIcon icon={faXmark} /> DisActived</span> 
                                                                        }
                                                                    </button>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        {hasPermission('Variant-Update') &&
                                                                            <button type="button" className="hover:text-warning" onClick={() => handleEditClick(rows)} title="Edit">
                                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-success">
                                                                                    <path d="M15.2869 3.15178L14.3601 4.07866L5.83882 12.5999L5.83881 12.5999C5.26166 13.1771 4.97308 13.4656 4.7249 13.7838C4.43213 14.1592 4.18114 14.5653 3.97634 14.995C3.80273 15.3593 3.67368 15.7465 3.41556 16.5208L2.32181 19.8021L2.05445 20.6042C1.92743 20.9852 2.0266 21.4053 2.31063 21.6894C2.59466 21.9734 3.01478 22.0726 3.39584 21.9456L4.19792 21.6782L7.47918 20.5844L7.47919 20.5844C8.25353 20.3263 8.6407 20.1973 9.00498 20.0237C9.43469 19.8189 9.84082 19.5679 10.2162 19.2751C10.5344 19.0269 10.8229 18.7383 11.4001 18.1612L11.4001 18.1612L19.9213 9.63993L20.8482 8.71306C22.3839 7.17735 22.3839 4.68748 20.8482 3.15178C19.3125 1.61607 16.8226 1.61607 15.2869 3.15178Z" stroke="currentColor" strokeWidth="1.5"></path>
                                                                                    <path opacity="0.5" d="M14.36 4.07812C14.36 4.07812 14.4759 6.04774 16.2138 7.78564C17.9517 9.52354 19.9213 9.6394 19.9213 9.6394M4.19789 21.6777L2.32178 19.8015" stroke="currentColor" strokeWidth="1.5"></path>
                                                                                </svg>
                                                                            </button>
                                                                        }
                                                                        {hasPermission('Variant-Delete') &&
                                                                            <button type="button" className="hover:text-danger" onClick={() => rows.id && handleDeleteProductVariant(rows.id)} title="Delete">
                                                                                <svg
                                                                                    width="24"
                                                                                    height="24"
                                                                                    viewBox="0 0 24 24"
                                                                                    fill="none"
                                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                                    className="w-5 h-5 text-danger"
                                                                                >
                                                                                    <path
                                                                                        d="M20.5001 6H3.5"
                                                                                        stroke="currentColor"
                                                                                        strokeWidth="1.5"
                                                                                        strokeLinecap="round"
                                                                                    ></path>
                                                                                    <path
                                                                                        d="M18.8334 8.5L18.3735 15.3991C18.1965 18.054 18.108 19.3815 17.243 20.1907C16.378 21 15.0476 21 12.3868 21H11.6134C8.9526 21 7.6222 21 6.75719 20.1907C5.89218 19.3815 5.80368 18.054 5.62669 15.3991L5.16675 8.5"
                                                                                        stroke="currentColor"
                                                                                        strokeWidth="1.5"
                                                                                        strokeLinecap="round"
                                                                                    ></path>
                                                                                    <path
                                                                                        opacity="0.5"
                                                                                        d="M9.5 11L10 16"
                                                                                        stroke="currentColor"
                                                                                        strokeWidth="1.5"
                                                                                        strokeLinecap="round"
                                                                                    ></path>
                                                                                    <path
                                                                                        opacity="0.5"
                                                                                        d="M14.5 11L14 16"
                                                                                        stroke="currentColor"
                                                                                        strokeWidth="1.5"
                                                                                        strokeLinecap="round"
                                                                                    ></path>
                                                                                    <path
                                                                                        opacity="0.5"
                                                                                        d="M6.5 6C6.55588 6 6.58382 6 6.60915 5.99936C7.43259 5.97849 8.15902 5.45491 8.43922 4.68032C8.44784 4.65649 8.45667 4.62999 8.47434 4.57697L8.57143 4.28571C8.65431 4.03708 8.69575 3.91276 8.75071 3.8072C8.97001 3.38607 9.37574 3.09364 9.84461 3.01877C9.96213 3 10.0932 3 10.3553 3H13.6447C13.9068 3 14.0379 3 14.1554 3.01877C14.6243 3.09364 15.03 3.38607 15.2493 3.8072C15.3043 3.91276 15.3457 4.03708 15.4286 4.28571L15.5257 4.57697C15.5433 4.62992 15.5522 4.65651 15.5608 4.68032C15.841 5.45491 16.5674 5.97849 17.3909 5.99936C17.4162 6 17.4441 6 17.5 6"
                                                                                        stroke="currentColor"
                                                                                        strokeWidth="1.5"
                                                                                    ></path>
                                                                                </svg>
                                                                            </button>
                                                                        }
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3}>No Product Varaint Found!</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    itemsPerPage={itemsPerPage}
                                    handleItemsPerPageChange={handleItemsPerPageChange}
                                    totalItems={totalItems}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleAddorEditProductVariant}
                productVariant={selectProductVariant}
            />
        </>
    );
};

export default ProductVariant;