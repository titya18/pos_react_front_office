// src/components/Pagination.tsx
import React from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    handleItemsPerPageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    totalItems: number;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    itemsPerPage,
    handleItemsPerPageChange,
    totalItems,
}) => {
    return (
        <div className="dataTable-bottom">
            <div className="dataTable-info">
                Showing{" "}
                {currentPage * itemsPerPage - itemsPerPage + 1}{" "}
                to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)}{" "}
                of {totalItems} entries
            </div>
            <div className="dataTable-dropdown">
                <label>
                    <select
                        className="dataTable-selector"
                        onChange={handleItemsPerPageChange}
                        value={itemsPerPage}
                    >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </select>
                </label>
            </div>
            <nav className="dataTable-pagination">
                <ul className="m-auto mb-4 inline-flex items-center space-x-1 rtl:space-x-reverse">
                    <li
                        className={`pager ${currentPage === 1 ? "disabled" : ""}`}
                        onClick={() => onPageChange(1)}
                    >
                        <button type="button" className="flex justify-center rounded-full bg-white-light p-2 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rtl:rotate-180">
                                <path d="M13 19L7 12L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path opacity="0.5" d="M16.9998 19L10.9998 12L16.9998 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                        </button>
                    </li>
                    <li
                        className={`pager ${currentPage === 1 ? "disabled" : ""}`}
                        onClick={() => onPageChange(currentPage - 1)}
                    >
                        <button
                            type="button"
                            className="flex justify-center rounded-full bg-white-light p-2 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary"
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 rtl:rotate-180"
                            >
                                <path
                                    d="M15 5L9 12L15 19"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                ></path>
                            </svg>
                        </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                        <li key={i}>
                            <button
                                type="button"
                                className={
                                    currentPage === i + 1
                                        ? "flex justify-center rounded-full bg-primary px-3.5 py-2 font-semibold text-white transition dark:bg-primary dark:text-white-light"
                                        : "flex justify-center rounded-full bg-white-light px-3.5 py-2 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary"
                                }
                                onClick={() => onPageChange(i + 1)}
                            >
                                {i + 1}
                            </button>
                        </li>
                    ))}
                    <li
                        className={`pager ${currentPage === totalPages ? "disabled" : ""}`}
                        onClick={() => onPageChange(currentPage + 1)}
                    >
                        <button
                            type="button"
                            className="flex justify-center rounded-full bg-white-light p-2 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary"
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 rtl:rotate-180"
                            >
                                <path
                                    d="M9 5L15 12L9 19"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                ></path>
                            </svg>
                        </button>
                    </li>
                    <li
                        className={`pager ${currentPage === totalPages ? "disabled" : ""}`}
                        onClick={() => onPageChange(totalPages)}
                    >
                        <button
                            type="button"
                            className="flex justify-center rounded-full bg-white-light p-2 font-semibold text-dark transition hover:bg-primary hover:text-white dark:bg-[#191e3a] dark:text-white-light dark:hover:bg-primary"
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 rtl:rotate-180"
                            >
                                <path
                                    d="M11 19L17 12L11 5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                ></path>
                                <path
                                    opacity="0.5"
                                    d="M6.99976 19L12.9998 12L6.99976 5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                ></path>
                            </svg>
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Pagination;
