import React, { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { BranchType, ProductVariantType, StockAdjustmentType, StockAdjustmentDetailType } from "@/data_types/types";
import { getAllBranches } from "@/api/branch";
import { searchProduct } from "@/api/searchProduct";
import { upsertAdjustment, getStockAdjustmentById } from "@/api/stockAdjustment";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAppContext } from '@/hooks/useAppContext';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useQueryClient } from "@tanstack/react-query";
import { FilePenLine, Pencil, Plus, Trash2 } from 'lucide-react';
import ShowWarningMessage from "../components/ShowWarningMessage";

const StockAdjustmentForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [braches, setBranches] = useState<BranchType[]>([]);
    // const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [productResults, setProductResults] = useState<ProductVariantType[]>([]);
    const [adjustmentDetails, setAdjustmentDetails] = useState<StockAdjustmentDetailType[]>([]);
    const [clickData, setClickData] = useState<StockAdjustmentDetailType | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [statusValue, setStatusValue] = useState<string>("PENDING");

    const queryClient = useQueryClient();

    const { user, hasPermission } = useAppContext();

    const navigate = useNavigate(); // Initialize useNavigate

    // const navigate = useNavigate()

    const { control, register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<StockAdjustmentType> ();

    const fetchBranches = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAllBranches();
            setBranches(data as BranchType[]);
        } catch (error) {
            console.error("Error fetching branch:", error);
        } finally {
            setIsLoading(false);
        }
    }, [id, setValue]);

    const fetchStockAdjustment = useCallback(async () => {
        if (id) { // Only fetch when 'id' is available and not already fetching
            setIsLoading(true);
            try {
                if (id) {
                    const adjustmentData: StockAdjustmentType = await getStockAdjustmentById(parseInt(id, 10));
                    await fetchBranches();
                    // await fetchSuppliers();
                    setValue("branchId", adjustmentData.branchId);
                    setValue("AdjustMentType", adjustmentData.AdjustMentType);
                    setValue("adjustDate", adjustmentData.adjustDate
                        ? new Date(adjustmentData.adjustDate).toISOString()
                        : null
                    );
                    setValue("StatusType", adjustmentData.StatusType);
                    setValue("note", adjustmentData.note);
                    // Update adjustmentDetails only if it has changed
                    // if (JSON.stringify(adjustmentData.adjustmentDetails) !== JSON.stringify(adjustmentDetails)) {
                        setAdjustmentDetails(adjustmentData.adjustmentDetails);
                    // }
                    // console.log("adjustmentData:", adjustmentData.adjustmentDetails);
                    setStatusValue(adjustmentData.StatusType);
                }
            } catch (error) {
                console.error("Error fetching adjustment:", error);
            } finally {
                setIsLoading(false);
                // setIsFetching(false); // Reset fetching flag after completion
            }
        }
    }, [id, setValue]);

    useEffect(() => {
        // // Call all fetch functions
        // const fetchData = async () => {
        //     await Promise.all([fetchBranches(), fetchSuppliers(), fetchPurchase()]);
        // };
        // fetchData();
        fetchBranches();
        fetchStockAdjustment();
    }, [fetchBranches, fetchStockAdjustment]);

    // Fetch products as the user types
    const handleSearch = async (term: string) => {
        if (term.trim() === "") {
            setProductResults([]);
            return;
        }

        try {
            const response = await searchProduct(term);
            // const data = await response.json();
            setProductResults(response);
            setShowSuggestions(true);
        } catch (error) {
            console.error("Error fetching products:", error);
        }
    };

    const handleFocus = () => {
        // Clear suggestions when focusing on the input box
        setShowSuggestions(false);
      };

    // Handle typing in search bar
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        handleSearch(term);
    };

    // Function to add or update a product detail
    const addOrUpdateAdjustmentDetail = async (Detail: StockAdjustmentDetailType) => {
        // Find if the product already exists in the array
        const existingIndexData = adjustmentDetails.findIndex(
            (item) => item.productVariantId === Detail.productVariantId
        );
        if (existingIndexData !== -1) {
            await ShowWarningMessage("Product already in cart");
            return;
        }
        // console.log("ddfd:", newDetail);

        const newDetail: StockAdjustmentDetailType = {
            id: Detail.id ?? 0, // Default to 0 if id is null
            productId: Detail.productId ?? 0, // Provide defaults for other nullable fields
            productVariantId: Detail.productVariantId ?? 0,
            quantity: Detail.quantity ?? 1,
            products: Detail.products ?? null,
            productvariants: Detail.productvariants ?? null
        };

        const existingIndex = adjustmentDetails.findIndex(
            (item) => item.productVariantId === newDetail.productVariantId
        );

        if (existingIndex !== -1) {
            // Product exists; update its data
            const updatedDetails = [...adjustmentDetails];
            updatedDetails[existingIndex] = { ...newDetail }; // Replace with the new data
            setAdjustmentDetails(updatedDetails);
        } else {
            // Product does not exist; add it
            setAdjustmentDetails([...adjustmentDetails, newDetail]);
        }

        setSearchTerm(""); // Clear search
        setShowSuggestions(false); // Hide suggestions
    };

    // const handleOnSubmit = async (DetailData: StockAdjustmentDetailType) => {
    //     try {
    //         const newDetail: StockAdjustmentDetailType = {
    //             id: DetailData.id ?? 0, // Default to 0 if id is null
    //             productId: DetailData.productId ?? 0, // Provide defaults for other nullable fields
    //             productVariantId: DetailData.productVariantId ?? 0,
    //             quantity: DetailData.quantity ?? 1,
    //             products: DetailData.products ?? null,
    //             productvariants: DetailData.productvariants ?? null
    //         };

    //         const existingIndex = adjustmentDetails.findIndex(
    //             (item) => item.productVariantId === newDetail.productVariantId
    //         );

    //         if (existingIndex !== -1) {
    //             // Product exists; update its data
    //             const updatedDetails = [...adjustmentDetails];
    //             updatedDetails[existingIndex] = { ...newDetail }; // Replace with the new data
    //             setAdjustmentDetails(updatedDetails);
    //         } else {
    //             // Product does not exist; add it
    //             setAdjustmentDetails([...adjustmentDetails, newDetail]);
    //         }

    //         setIsModalOpen(false);
    //     } catch (error: any) {
    //         // Check if error.message is set by your API function
    //         if (error.message) {
    //             toast.error(error.message, {
    //                 position: "top-right",
    //                 autoClose: 4000
    //             });
    //         } else {
    //             toast.error("Error adding/editting adjustment", {
    //                 position: "top-right",
    //                 autoClose: 4000
    //             });
    //         }
    //     }
    // };

    const increaseQuantity = (index: number) => {
        // Create a copy of the current purchaseDetails array
        const updatedDetails = [...adjustmentDetails];
        
        // Get the current detail object
        const detail = updatedDetails[index];

        // Ensure quantity is a number before performing the increment
        const currentQuantity = Number(detail.quantity) || 0; // Convert to number
    
        // Increase the quantity if it's less than the maximum allowed (25)
        if (detail.quantity < 25) {
            // Create a new detail object with updated quantity and total
            const updatedDetail = {
                ...detail,
                quantity: currentQuantity + 1,
            };
    
            // Replace the old detail with the updated one
            updatedDetails[index] = updatedDetail;
    
            // Update the state with the new array
            setAdjustmentDetails(updatedDetails);
        }
    };
    
    const decreaseQuantity = (index: number) => {
        const updatedDetails = [...adjustmentDetails];
        const detail = updatedDetails[index];
        
        // Ensure quantity is a number before performing the increment
        const currentQuantity = Number(detail.quantity) || 0; // Convert to number

        if (detail.quantity > 1) {
            const updatedDetail = {
                ...detail,
                quantity: currentQuantity - 1,
            };
    
            updatedDetails[index] = updatedDetail;
            setAdjustmentDetails(updatedDetails);
        }
    };

    const removeProductFromCart = (index: number) => {
        const updatedDetails = adjustmentDetails.filter((_, i) => i !== index);
        setAdjustmentDetails(updatedDetails);
    };

    const onSubmit: SubmitHandler<StockAdjustmentType> = async (formData) => {
        setIsLoading(true);
        try {
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
            const adjustmentData: StockAdjustmentType = {
                id: id ? Number(id) : undefined,
                branchId: formData.branchId,
                branch: { id: formData.branchId ?? 0, name: "Default Branch", address: "Default Address"},
                adjustDate: formData.adjustDate,
                AdjustMentType: formData.AdjustMentType,
                StatusType: formData.StatusType,
                note: formData.note,
                delReason: "",
                adjustmentDetails: adjustmentDetails
            }
            console.log("adjustmentData:", adjustmentData);
            await upsertAdjustment(adjustmentData);
            toast.success(id ? "Adjustment updated successfully" : "Adjustment created successfully", {
                position: "top-right",
                autoClose: 2000
            });

            // Reset form data and purchaseDetails
            reset({
                id: undefined,
                branchId: undefined,
                adjustDate: undefined,
                AdjustMentType: undefined,
                StatusType: undefined,
                note: undefined,
                adjustmentDetails: [], // Clear adjustmentDetails
            });

            // Redirect to the specified URL
            navigate("/adjuststock");

        } catch (err: any) {
            if (err.message) {
                toast.error(err.message, {
                    position: 'top-right',
                    autoClose: 2000
                });
            } else {
                toast.error("Error adding/editing adjutment", {
                    position: 'top-right',
                    autoClose: 4000
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

    const wrapperStyle = {
        width: "100%",
    };

    return (
        <>
            <div className="panel">
                <div className="mb-5">
                    <h5 className="flex items-center text-lg font-semibold dark:text-white-light">
                        { id ? <FilePenLine /> : <Plus /> }
                        { id ? " Update Stock Adjustment" : " Add Stock Adjustment" }
                    </h5>
                </div>
                <div className="mb-5">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="mb-5">
                            {user?.roleType === "USER" && !user?.branchId &&
                                <div className="mb-5">
                                    <label>Branch <span className="text-danger text-md">*</span></label>
                                    <select 
                                        id="branch" className="form-input" 
                                        {...register("branchId", { 
                                            required: "Branch is required"
                                        })} 
                                    >
                                        <option value="">Select a branch</option>
                                        {braches.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.branchId && <span className="error_validate">{errors.branchId.message}</span>}
                                </div>
                            }
                            <div className={`grid grid-cols-1 gap-4 ${ user?.roleType === "ADMIN" ? 'sm:grid-cols-3' : 'sm:grid-cols-2' } mb-5`}>
                                {user?.roleType === "ADMIN" &&
                                    <div>
                                        <label>Branch <span className="text-danger text-md">*</span></label>
                                        <select 
                                            id="branch" className="form-input" 
                                            {...register("branchId", { 
                                                required: "Branch is required"
                                            })} 
                                        >
                                            <option value="">Select a branch</option>
                                            {braches.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.name}
                                            </option>
                                            ))}
                                        </select>
                                        {errors.branchId && <span className="error_validate">{errors.branchId.message}</span>}
                                    </div>
                                }
                                <div>
                                    <label>Adjustment Type <span className="text-danger text-md">*</span></label>
                                    <div className="flex">
                                        <select 
                                            id="AjustmentType" className="form-input" 
                                            {...register("AdjustMentType", { 
                                                required: "Adjustment type is required"
                                            })} 
                                        >
                                            <option value="">Select an adjustment type...</option>
                                            <option value="POSITIVE">Positive</option>
                                            <option value="NEGATIVE">Nagative</option>
                                        </select>
                                    </div>
                                    {errors.AdjustMentType && <span className="error_validate">{errors.AdjustMentType.message}</span>}
                                </div>
                                <div style={wrapperStyle}>
                                    <label htmlFor="date-picker">Select a Date: <span className="text-danger text-md">*</span></label>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <Controller
                                            name="adjustDate"
                                            control={control}
                                            rules={{ required: "Adjustment date is required" }}
                                            render={({ field }) => (
                                                <DatePicker
                                                    value={field.value ? new Date(field.value as string) : null}
                                                    onChange={(date) => field.onChange(date)}
                                                    minDate={new Date()}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            error: !!errors.adjustDate,
                                                        },
                                                    }}
                                                />
                                            )}
                                        />
                                    </LocalizationProvider>
                                    {errors.adjustDate && <span className="error_validate">{errors.adjustDate.message}</span>}
                                </div>
                            </div>
                            <div className="mb-5">
                                <label>Product <span className="text-danger text-md">*</span></label>
                                <div className="relative">
                                    <input type="text" placeholder="Scan/Search Product by Code Or Name" className="peer form-input bg-gray-100 placeholder:tracking-widest ltr:pl-9 ltr:pr-9 rtl:pl-9 rtl:pr-9 sm:bg-transparent ltr:sm:pr-4 rtl:sm:pl-4" value={searchTerm} onChange={handleInputChange} onFocus={handleFocus} />
                                    <button type="button" className="absolute inset-0 h-9 w-9 appearance-none peer-focus:text-primary ltr:right-auto rtl:left-auto">
                                        <svg className="mx-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5"></circle>
                                            <path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                                        </svg>
                                    </button>
                                </div>
                                {/* Dropdown for suggestions */}
                                {showSuggestions && productResults.length > 0 && (
                                    <ul
                                        style={{
                                            listStyle: "none",
                                            border: "1px solid #ccc",
                                            padding: 0,
                                            margin: 0,
                                            position: "absolute",
                                            backgroundColor: "white",
                                            zIndex: 10,
                                            maxHeight: "200px",
                                            overflowY: "auto",
                                            width: "100%",
                                        }}
                                    >
                                        {productResults.map((variants) => (
                                            <li
                                                key={variants.id}
                                                style={{
                                                    padding: "8px",
                                                    cursor: "pointer",
                                                    borderBottom: "1px solid #eee",
                                                }}
                                                onClick={() => addOrUpdateAdjustmentDetail({
                                                    id: 0, // Assign a default or unique value
                                                    productId: variants.products?.id || 0,
                                                    productVariantId: variants.id,
                                                    products: variants.products || null,
                                                    productvariants: variants,
                                                    quantity: 1, // Default quantity for a new item
                                                })}
                                            >
                                                {variants.products?.name} - {variants.name+' - '+variants.barcode}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="dataTable-container">
                                <table id="myTable1" className="whitespace-nowrap dataTable-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Product</th>
                                            {/* <th>Stock</th> */}
                                            <th>Qty</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adjustmentDetails.map((detail, index) => (
                                            <tr key={index}>
                                                <td>{ index + 1 }</td>
                                                <td>
                                                    <p>{ detail.products?.name } - { detail.productvariants?.name }</p>
                                                    <p className="text-center">
                                                        <span className="badge badge-outline-primary rounded-full">
                                                            { detail.productvariants?.barcode }
                                                        </span>
                                                    </p>
                                                </td>
                                                {/* <td>5</td> */}
                                                <td>
                                                    <div className="inline-flex" style={{width: '40%'}}>
                                                        <button type="button" onClick={() => decreaseQuantity(index)} className="flex items-center justify-center border border-r-0 border-danger bg-danger px-3 font-semibold text-white ltr:rounded-l-md rtl:rounded-r-md">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                            </svg>
                                                        </button>
                                                            <input type="text" value={detail.quantity} className="form-input rounded-none text-center" min="0" max="25" readOnly />
                                                        <button type="button" onClick={() => increaseQuantity(index)} className="flex items-center justify-center border border-l-0 border-warning bg-warning px-3 font-semibold text-white ltr:rounded-r-md rtl:rounded-l-md">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                                                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button type="button" onClick={() => removeProductFromCart(index)} className="hover:text-danger" title="Delete">
                                                        <Trash2 color="red" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5">
                                <div>
                                    <label>Status <span className="text-danger text-md">*</span></label>
                                    <select 
                                        id="status" className="form-input" 
                                        {...register("StatusType", { 
                                            required: "Status is required"
                                        })} 
                                    >
                                        <option value="">Select a status...</option>
                                        <option value="PENDING">Pending</option>
                                        <option 
                                            value="APPROVED"
                                            hidden={!(user?.roleType === "USER" && statusValue !== "PENDING")}
                                        >
                                            Approved
                                        </option>
                                        <option 
                                            value="APPROVED"
                                            hidden={!(hasPermission('Adjust-Stock-Approve') && statusValue === "PENDING")}
                                        >
                                            Approved
                                        </option>

                                    </select>
                                    {errors.StatusType && <span className="error_validate">{errors.StatusType.message}</span>}
                                </div>
                            </div>
                            <div className="mb-5">
                                <label>Note</label>
                                <textarea {...register("note")} className="form-input" rows={3}></textarea>
                            </div>
                        </div>
                        <div className="flex justify-end items-center mt-8">
                            <NavLink to="/adjuststock" type="button" className="btn btn-outline-warning">
                                <FontAwesomeIcon icon={faArrowLeft} className='mr-1' />
                                Go Back
                            </NavLink>
                            {statusValue === 'PENDING' &&
                                (hasPermission('Adjust-Stock-Create') || hasPermission('Adjust-Stock-Edit')) && (
                                    <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={isLoading}>
                                        <FontAwesomeIcon icon={faSave} className='mr-1' />
                                        {isLoading ? 'Saving...' : 'Save'}
                                    </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default StockAdjustmentForm;