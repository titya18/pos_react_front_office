// src/components/MainCategory.tsx
import React, { useState, useEffect, useCallback } from "react";
import * as apiClient from "@/api/report";
import { getAllBranches } from "@/api/branch";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import Pagination from "../components/Pagination"; // Import the Pagination component
import ShowDeleteConfirmation from "../components/ShowDeleteConfirmation";
import { useQueryClient } from "@tanstack/react-query";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpZA, faArrowDownAZ, faPrint, faClose, faSave } from '@fortawesome/free-solid-svg-icons';
import { toast } from "react-toastify";
import { useAppContext } from "@/hooks/useAppContext";
import { format } from 'date-fns';
import { Pencil, Trash2, BanknoteArrowUp, PrinterCheck, Plus, MessageCircleOff, NotebookText, RefreshCw } from 'lucide-react';
import { StockReturnType, BranchType } from "@/data_types/types";
import VisibleColumnsSelector from "@/components/VisibleColumnsSelector";
import ExportDropdown from "@/components/ExportDropdown";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Extend Day.js with plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const columns = [
    "No",
    "Rference",
    "Return Date",
    "Return By",
    "Branch",
    "Status",
    "Total QTY",
    "Approved At",
    "Approved By",
    "Cancelled AT",
    "Cancelled By",
    "Cancelled Reason",
    "Created At",
    "Created By",
    "Updated At",
    "Updated By",
    "Actions"
];

const sortFields: Record<string, string> = {
    "No": "id",
    "Rference": "ref",
    "Return Date": "returnDate",
    "Return By": "returnBy",
    "Branch": "branchId",
    "Status": "StatusType",
    "Total QTY": "totalQuantity",
    "Approved At": "approvedAt",
    "Approved By": "approvedBy",
    "Cancelled AT": "deletedAt",
    "Cancelled By": "deletedBy",
    "Cancelled Reason": "delReason",
    "Created At": "createdAt",
    "Created By": "createdBy",
    "Updated At": "updatedAt",
    "Updated By": "updatedBy"
};

const ReportReturn: React.FC = () => {
    const [branches, setBranches] = useState<BranchType[]>([]);
    const [returnData, setReturnData] = useState<StockReturnType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selected, setSelected] = useState<number[]>([]);
    const [visibleCols, setVisibleCols] = useState(columns);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [viewNote, setViewNote] = useState<string | null>(null);

    // FILTER STATES
    const [total, setTotal] = useState(0);
    const [searchParams, setSearchParams] = useSearchParams();
    const today = dayjs().format("YYYY-MM-DD");
    const startDate = searchParams.get("startDate") || today;
    const endDate = searchParams.get("endDate") || today;
    const adjustType = searchParams.get("adjustType") || "ALL";
    const status = searchParams.get("status") || "";
    const branchId = searchParams.get("branchId") ? parseInt(searchParams.get("branchId")!, 10) : undefined;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const sortField = searchParams.get("sortField") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "desc" ? "desc" : "asc";

    const updateParams = (params: Record<string, unknown>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([key, value]) => {
            newParams.set(key, String(value));
        });
        setSearchParams(newParams);
    };

    const { user, hasPermission } = useAppContext();
    const navigate = useNavigate();

    // Fetch branches (once)
    const fetchBranches = useCallback(async () => {
        try {
            const data = await getAllBranches();
            setBranches(data as BranchType[]);
        } catch (error) {
            console.error("Error fetching branches:", error);
        }
    }, []);

    const fetchReturns = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = {
                sortField,
                sortOrder: sortOrder as "desc" | "asc",
                page,
                pageSize,
                searchTerm: search || undefined,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                status: status || undefined,
                branchId
            };

            const { data, total: totalResult } = await apiClient.getAllReportReturns(params);
            setReturnData(data || []);
            setTotal(totalResult || 0);
            setSelected([]);
        } catch (error) {
            console.error("Error fetching return report:", error);
            toast.error("Failed to fetch return report.");
        } finally {
            setIsLoading(false);
        }
    }, [sortField, sortOrder, page, pageSize, search, startDate, endDate, status, branchId]);

    useEffect(() => {
        fetchBranches();
        fetchReturns();
    }, [fetchBranches, fetchReturns]);

    // Filter handler
    const handleClearAllFilter = () => {
        navigate("/reportReturn");
    };

    const toggleCol = (col: string) => {
        setVisibleCols(prev =>
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    const toggleSelectRow = (index: number) => {
        setSelected(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const handleSort = (col: string) => {
        const field = sortFields[col];
        if (!field) return;
        if (sortField === field) {
            updateParams({ sortOrder: sortOrder === "asc" ? "desc" : "asc" });
        } else {
            updateParams({ sortField: field, sortOrder: "asc" });
        }
    };

    const exportData = returnData.map((request, index) => ({
        "No": (page - 1) * pageSize + index + 1,
        "Rference": request.ref,
        "Return Date": request.returnDate,
        "Return By": `${request.returner?.lastName || ''} ${request.returner?.firstName || 'N/A'}`,
        "Branch": request.branch ? request.branch.name : "",
        "Status": request.StatusType,
        "Total QTY": request.totalQuantity,
        "Approved At": request.approvedAt ? dayjs.tz(request.approvedAt, "Asia/Phnom_Penh").format("DD / MMM / YYYY HH:mm:ss") : 'N/A',
        "Approved By": request.approvedAt ? `${request.approver?.lastName || ''} ${request.approver?.firstName || 'N/A'}` : '',
        "Cancelled AT": request.deletedAt ? dayjs.tz(request.deletedAt, "Asia/Phnom_Penh").format("DD / MMM / YYYY HH:mm:ss") : '',
        "Cancelled By": request.deletedAt ? `${request.deleter?.lastName || ''} ${request.deleter?.firstName || ''}` : '',
        "Cancelled Reason": request.delReason || '',
        "Created At": request.createdAt ? dayjs.tz(request.createdAt, "Asia/Phnom_Penh").format("DD / MMM / YYYY HH:mm:ss") : '',
        "Created By": `${request.creator?.lastName || ''} ${request.creator?.firstName || ''}`,
        "Updated At": request.updatedAt ? dayjs.tz(request.updatedAt, "Asia/Phnom_Penh").format("DD / MMM / YYYY HH:mm:ss") : '',
        "Updated By": `${request.updater?.lastName || ''} ${request.updater?.firstName || ''}`,
    }));

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const queryClient = useQueryClient();

    const handleViewNote = (note: string) => {
        setViewNote(note);
        setShowNoteModal(true);
    };

    return (
        <>
            <div className="pt-0">
                <div className="space-y-6">
                    <div className="panel">
                        <div className="relative">
                            {/* ---------------- FILTERS ---------------- */}
                            <div className="flex gap-2 mb-4 flex-wrap items-end">
                                <div>
                                    <label>Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            const newStart = e.target.value;
                                            let newEnd = endDate;

                                            // Reset endDate if it's before new startDate
                                            if (endDate && newEnd < newStart) {
                                                newEnd = newStart;
                                            }

                                            updateParams({ startDate: newStart, endDate: newEnd, page: 1 });
                                        }}
                                        className="form-input"
                                    />
                                </div>
                                <div>
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        min={startDate || undefined}
                                        onChange={(e) => updateParams({ endDate: e.target.value, page: 1 })}
                                        className="form-input"
                                    />
                                </div>
                                <div>
                                    <label>Status</label>
                                    <select value={status} onChange={(e) => updateParams({ status: e.target.value, page: 1 })} className="form-select">
                                        <option value="">All</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>
                                {(user?.roleType === "ADMIN" || user?.roleType === "USER") &&
                                    <div>
                                        <label>Branch</label>
                                        <select value={branchId} onChange={(e) => updateParams({ branchId: Number(e.target.value) || undefined, page: 1 })} className="form-select">
                                            <option value="">All Branches</option>
                                            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                }
                                <div>
                                    <button className="btn btn-primary" onClick={handleClearAllFilter}><RefreshCw /> Clear All Filter</button>
                                </div>
                            </div>

                            <div className="dataTable-wrapper dataTable-loading no-footer sortable searchable">
                                <div className="dataTable-top">
                                    <div className="dataTable-search">
                                        <input
                                            className="dataTable-input"
                                            type="text"
                                            placeholder="Search..."
                                            value={search}
                                            onChange={(e) => updateParams({ search: e.target.value, page: 1 })}
                                        />
                                    </div>
                                    <VisibleColumnsSelector
                                        allColumns={columns}
                                        visibleColumns={visibleCols}
                                        onToggleColumn={toggleCol}
                                    />
                                    <ExportDropdown data={exportData} prefix="Stock_Return_report" />
                                </div>
                                <div className="dataTable-container">
                                    {isLoading ? (
                                        <p>Loading...</p>
                                    ) : (
                                        <table id="myTable1" className="whitespace-nowrap dataTable-table">
                                            <thead>
                                                <tr>
                                                    {columns.map(
                                                        (col) =>
                                                        visibleCols.includes(col) && (
                                                            <th
                                                                key={col}
                                                                className="px-4 py-2 font-medium cursor-pointer select-none whitespace-normal break-words max-w-xs"
                                                                onClick={() => handleSort(col)}
                                                            >
                                                                <div className="flex items-center gap-1">
                                                                    {col}
                                                                    {sortField === sortFields[col] ? (
                                                                        sortOrder === "asc" ? (
                                                                            <FontAwesomeIcon icon={faArrowDownAZ} />
                                                                        ) : (
                                                                            <FontAwesomeIcon icon={faArrowUpZA} />
                                                                        )
                                                                    ) : (
                                                                        <FontAwesomeIcon icon={faArrowDownAZ} />
                                                                    )}
                                                                </div>
                                                            </th>
                                                        )
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {returnData && returnData.length > 0 ? (
                                                    returnData.map((rows, index) => (
                                                        <tr key={index}>
                                                            {visibleCols.includes("No") && (
                                                                <td>{(page - 1) * pageSize + index + 1}</td>
                                                            )}
                                                            {visibleCols.includes("Rference") && (
                                                                <td>{rows.ref}</td>
                                                            )}
                                                            {visibleCols.includes("Return Date") && (
                                                                <td>{rows.returnDate ? format(new Date(rows.returnDate), 'dd-MMM-yyyy') : ''}</td>
                                                            )}
                                                            {visibleCols.includes("Return By") && (
                                                                <td>{rows.returner ? `${rows.returner.lastName} ${rows.returner.firstName}` : "N/A"}</td>
                                                            )}
                                                            {visibleCols.includes("Branch") && (
                                                                <td>{rows.branch ? rows.branch.name : ""}</td>
                                                            )}
                                                            {visibleCols.includes("Status") && (
                                                                <td>
                                                                    <span className={`badge rounded-full ${rows.StatusType === 'PENDING' ? 'bg-warning' : rows.StatusType === 'APPROVED' ? 'bg-success' : 'bg-danger'}`} title={rows.delReason}>
                                                                        {rows.StatusType}
                                                                    </span>
                                                                </td>
                                                            )}
                                                            {visibleCols.includes("Total QTY") && (
                                                                <td>{rows.totalQuantity}</td>
                                                            )}
                                                            {visibleCols.includes("Approved At") && (
                                                                <td>{rows.approvedAt ? dayjs.tz(rows.approvedAt, "Asia/Phnom_Penh").format("DD / MMM / YYYY HH:mm:ss") : "N/A"}</td>
                                                            )}
                                                            {visibleCols.includes("Approved By") && (
                                                                <td>{rows.approvedAt ? `${rows.approver?.lastName} ${rows.approver?.firstName}` : "N/A"}</td>
                                                            )}
                                                            {visibleCols.includes("Cancelled AT") && (
                                                                <td>{rows.deletedAt ? dayjs.tz(rows.deletedAt, "Asia/Phnom_Penh").format("DD / MMM / YYYY HH:mm:ss") : "N/A"}</td>
                                                            )}
                                                            {visibleCols.includes("Cancelled By") && (
                                                                <td>{rows.deletedAt ? `${rows.deleter?.lastName} ${rows.deleter?.firstName}` : "N/A"}</td>
                                                            )}
                                                            {visibleCols.includes("Cancelled Reason") && (
                                                                <td>{rows.delReason || "N/A"}</td>
                                                            )}
                                                            {visibleCols.includes("Created At") && (
                                                                <td>{dayjs.tz(rows.createdAt, "Asia/Phnom_Penh").format("DD / MMM / YYYY HH:mm:ss")}</td>
                                                            )}
                                                            {visibleCols.includes("Created By") && (
                                                                <td>{rows.creator?.lastName} {rows.creator?.firstName}</td>
                                                            )}
                                                            {visibleCols.includes("Updated At") && (
                                                                <td>{dayjs.tz(rows.updatedAt, "Asia/Phnom_Penh").format("DD / MMM / YYYY HH:mm:ss")}</td>
                                                            )}
                                                            {visibleCols.includes("Updated By") && (
                                                                <td>{rows.updater?.lastName} {rows.updater?.firstName}</td>
                                                            )}
                                                            {visibleCols.includes("Actions") && (
                                                                <td className="text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        {rows.note !== null &&
                                                                            <button type="button" className="hover:text-danger" onClick={() => handleViewNote(rows.note)} title="View Note">
                                                                                <NotebookText color="pink" />
                                                                            </button>
                                                                        }
                                                                    </div>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={3}>No Stock Request Found!</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                                <Pagination
                                    page={page}
                                    pageSize={pageSize}
                                    total={total}
                                    onPageChange={(newPage) => updateParams({ page: newPage })}
                                    onPageSizeChange={(newSize) => updateParams({ pageSize: newSize, page: 1 })}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showNoteModal && (
                <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8">
                            <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                                <h5 className="flex font-bold text-lg">
                                    <NotebookText color="pink" /> View note
                                </h5>
                                <button type="button" className="text-white-dark hover:text-dark" onClick={() => setShowNoteModal(false)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </button>
                            </div>
                            <div className="p-5">
                                <div className="mb-5">
                                    {viewNote || "No note available"}
                                </div>
                                
                                <div className="flex justify-end items-center mt-8">
                                    <button type="button" className="btn btn-outline-danger" onClick={() => setShowNoteModal(false)}>
                                        <FontAwesomeIcon icon={faClose} className='mr-1' />
                                        Discard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ReportReturn;
