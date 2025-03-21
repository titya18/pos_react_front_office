// src/components/MainCategory.tsx
import React, { useState, useEffect } from "react";
import * as apiClient from "../../api/purchase";
import Pagination from "../components/Pagination"; // Import the Pagination component
import ShowDeleteConfirmation from "../components/ShowDeleteConfirmation";
import { useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpZA, faArrowDownAZ, faPrint } from '@fortawesome/free-solid-svg-icons';
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import { useAppContext } from "../../hooks/useAppContext";
import ModalPayment from "./ModalPayment";

interface Product {
    id: number;
    name: string;
}

export interface PurchaseDetail {
    id: number;
    productId: number;
    productVariantId: number;
    name: string;
    code: string;
    products: Product | null;
    quantity: number;
    cost: number;
    taxNet: number;
    taxMethod: string | null;
    discount: number;
    discountMethod: string | null;
    total: number;
}

export interface PurchaseData {
    id?: number;
    branchId: number;
    supplierId: number;
    branch: { id: number, name: string } | null;
    suppliers: { id: number, name: string } | null;
    ref: string;
    date?: string | null; // Format: YYYY-MM-DD
    taxRate?: string | null;
    taxNet: number | null;
    discount?: string | null;
    shipping?: string | null;
    grandTotal: number;
    paidAmount: number | null;
    status: string;
    note: string;
    purchaseDetails: PurchaseDetail[];
}

export interface PaymentData {
    branchId: number | null;
    purchaseId: number | null;
    paymentMethodId: number | null;
    paidAmount: number | null;
    amount: number | null;
    createdAt: string | null;
    paymentMethods: { name: string } | null;
}

const Purchase: React.FC = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
    const [purchaseData, setPurchaseData] = useState<PurchaseData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalPaymentOpen, setIsModalPaymentOpen] = useState(false);
    const [amountPurchase, setAmountPurchase] = useState<PaymentData | null>(null);

    const { hasPermission } = useAppContext();

    const fetchPurchase = async () => {
        setIsLoading(true);
        try {
            const { data, total } = await apiClient.getAllPurchases(currentPage, searchTerm, itemsPerPage, sortField, sortOrder);
            setPurchaseData(data);
            setTotalItems(total);
            setTotalPages(Math.ceil(total / itemsPerPage));
        } catch (error) {
            console.error("Error fetching purchase:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchase();
    }, [currentPage, searchTerm, itemsPerPage, sortField, sortOrder]);

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

    const handleDeletePurchase = async (id: number) => {
        const confirmed = await ShowDeleteConfirmation();
        if (!confirmed) {
            return;
        }

        try {
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
            await apiClient.deletePurchase(id);
            toast.success("Purchase deleted successfully", {
                position: "top-right",
                autoClose: 2500
            })

            fetchPurchase();
        } catch (err: any) {
            console.error("Error deleting purchase:", err);
            toast.error(err.message || "Error deleting purchase", {
                position: 'top-right',
                autoClose: 2000
            });
        }
    };

    const addPaymentPurchase = (paymentData: PaymentData) => {
        setAmountPurchase(paymentData);
        setIsModalPaymentOpen(true);
    };

    const handleOnSubmitPayment = async (branchId: number | null, purchaseId: number | null, paidAmount: number | null, paymentMethodId: number | null, amount: number) => {
        try {
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
            console.log("api:", paymentMethodId);
            const paymentData: PaymentData = {
                branchId: branchId,
                purchaseId: purchaseId,
                paymentMethodId: paymentMethodId,
                paidAmount: paidAmount,
                amount: amount,
                createdAt: null,
                paymentMethods: null,
            }
            await apiClient.insertPurchasePayment(paymentData);
            toast.success("Purchase payment insert successfully", {
                position: "top-right",
                autoClose: 2000
            });
            fetchPurchase();
        } catch (error: any) {
            toast.error(error.message || "Error adding payment", {
                position: "top-right",
                autoClose: 2000
            });
        }
    };

    return (
        <>
            <div className="pt-0">
                <div className="space-y-6">
                    <div className="panel">
                        <div className="relative">
                            <div className="px-0">
                                <div className="md:absolute md:top-0 ltr:md:left-0 rtl:md:right-0">
                                    <div className="mb-5 flex items-center gap-2">
                                        {hasPermission('Purchase-Create') &&
                                            <NavLink to="/addpurchase" className="btn btn-primary gap-2" >
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
                                            </NavLink>
                                        }
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
                                                    <th onClick={() => handleSortChange("no")}>
                                                        No {/* No <span>{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span> */}
                                                    </th>
                                                    <th onClick={() => handleSortChange("date")}>
                                                        Date <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th>
                                                    <th onClick={() => handleSortChange("ref")}>
                                                        Reference <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th> 
                                                    <th onClick={() => handleSortChange("supplierId")}>
                                                        Supplier <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th> 
                                                    <th onClick={() => handleSortChange("branchId")}>
                                                        Branch <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th>
                                                    <th onClick={() => handleSortChange("status")}>
                                                        Status <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th>
                                                    <th onClick={() => handleSortChange("grandTotal")}>
                                                        Grand Total <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th> 
                                                    <th onClick={() => handleSortChange("paidAmount")}>
                                                        Paid <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th> 
                                                    <th onClick={() => handleSortChange("due")}>
                                                        Due <span className="cursor-pointer">{sortOrder === "desc" ? <FontAwesomeIcon icon={faArrowDownAZ} /> :<FontAwesomeIcon icon={faArrowUpZA} />}</span>
                                                    </th> 
                                                    <th className="!text-center">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {purchaseData && purchaseData.length > 0 ? (
                                                    purchaseData.map((rows, index) => (
                                                        <tr key={index}>
                                                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                            <td>{rows.date}</td>
                                                            <td>{rows.ref}</td>
                                                            <td>{rows.suppliers ? rows.suppliers.name : ""}</td>
                                                            <td>{rows.branch ? rows.branch.name : ""}</td>
                                                            <td><span className={`badge rounded-full ${rows.status === 'Pending' ? 'bg-warning' : 'bg-primary'}`}>{rows.status}</span></td>
                                                            <td>$ { Number(rows.grandTotal).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }</td>
                                                            <td>$ { Number(rows.paidAmount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }</td>
                                                            <td>$ { Number(rows.grandTotal - (rows.paidAmount ?? 0)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }</td>
                                                            <td className="text-center">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    {hasPermission('Purchase-Update') &&
                                                                        <NavLink to={`/printpurchase/${rows.id}`} className="hover:text-warning" title="Print Purchase">
                                                                            <FontAwesomeIcon icon={ faPrint } size="lg" />
                                                                        </NavLink>
                                                                    }
                                                                    {hasPermission('Purchase-Payment') &&
                                                                        <button type="button" 
                                                                            className="hover:text-primary" 
                                                                            onClick={() => addPaymentPurchase({ 
                                                                                branchId: rows.branchId, 
                                                                                purchaseId: Number(rows.id), 
                                                                                paymentMethodId: 0, 
                                                                                paidAmount: rows.paidAmount,
                                                                                amount: rows.grandTotal,
                                                                                createdAt: null,
                                                                                paymentMethods: null, 
                                                                            })} 
                                                                            title="Payment Purchase"
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                                                                                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                                    <path strokeLinecap="round" d="M15 5H9c-2.809 0-4.213 0-5.222.674a4 4 0 0 0-1.104 1.104C2 7.787 2 9.19 2 12s0 4.213.674 5.222a4 4 0 0 0 1.104 1.104c.347.232.74.384 1.222.484M9 19h6c2.809 0 4.213 0 5.222-.674a4 4 0 0 0 1.104-1.104C22 16.213 22 14.81 22 12s0-4.213-.674-5.222a4 4 0 0 0-1.104-1.104c-.347-.232-.74-.384-1.222-.484"></path>
                                                                                    <path d="M9 9a3 3 0 1 0 0 6m6-6a3 3 0 1 1 0 6"></path><path strokeLinecap="round" d="M9 5v14m6-14v14"></path>
                                                                                </g>
                                                                            </svg>
                                                                        </button>
                                                                    }
                                                                    {hasPermission('Purchase-Update') &&
                                                                        <NavLink to={`/editpurchase/${rows.id}`} className="hover:text-warning" title="Edit">
                                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-success">
                                                                                <path d="M15.2869 3.15178L14.3601 4.07866L5.83882 12.5999L5.83881 12.5999C5.26166 13.1771 4.97308 13.4656 4.7249 13.7838C4.43213 14.1592 4.18114 14.5653 3.97634 14.995C3.80273 15.3593 3.67368 15.7465 3.41556 16.5208L2.32181 19.8021L2.05445 20.6042C1.92743 20.9852 2.0266 21.4053 2.31063 21.6894C2.59466 21.9734 3.01478 22.0726 3.39584 21.9456L4.19792 21.6782L7.47918 20.5844L7.47919 20.5844C8.25353 20.3263 8.6407 20.1973 9.00498 20.0237C9.43469 19.8189 9.84082 19.5679 10.2162 19.2751C10.5344 19.0269 10.8229 18.7383 11.4001 18.1612L11.4001 18.1612L19.9213 9.63993L20.8482 8.71306C22.3839 7.17735 22.3839 4.68748 20.8482 3.15178C19.3125 1.61607 16.8226 1.61607 15.2869 3.15178Z" stroke="currentColor" strokeWidth="1.5"></path>
                                                                                <path opacity="0.5" d="M14.36 4.07812C14.36 4.07812 14.4759 6.04774 16.2138 7.78564C17.9517 9.52354 19.9213 9.6394 19.9213 9.6394M4.19789 21.6777L2.32178 19.8015" stroke="currentColor" strokeWidth="1.5"></path>
                                                                            </svg>
                                                                        </NavLink>
                                                                    }
                                                                    {hasPermission('Purchase-Delete') &&
                                                                        <button type="button" className="hover:text-danger" onClick={() => rows.id && handleDeletePurchase(rows.id)} title="Delete">
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
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3}>No Purchase Found!</td>
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

            <ModalPayment 
                isOpen={isModalPaymentOpen}
                onClose={() => setIsModalPaymentOpen(false)}
                onSubmit={handleOnSubmitPayment}
                amountPurchase={amountPurchase}
            />
        </>
    );
};

export default Purchase;
