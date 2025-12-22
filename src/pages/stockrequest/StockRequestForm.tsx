import React, { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { BranchType, ProductVariantType, StockRequestType, StockRequestDetailType } from "@/data_types/types";
import { getAllBranches } from "@/api/branch";
import { searchProduct } from "@/api/searchProduct";
import { upsertRequest, getStockRequestById } from "@/api/stockRequest";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAppContext } from '@/hooks/useAppContext';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useQueryClient } from "@tanstack/react-query";
import { FilePenLine, Pencil, Plus, Trash2 } from 'lucide-react';
import ShowWarningMessage from "../components/ShowWarningMessage";
import { get } from "http";
import { set } from "date-fns";

const StockRequestForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [braches, setBranches] = useState<BranchType[]>([]);
    // const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [productResults, setProductResults] = useState<ProductVariantType[]>([]);
    const [requestDetails, setRequestDetails] = useState<StockRequestDetailType[]>([]);
    const [clickData, setClickData] = useState<StockRequestDetailType | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [statusValue, setStatusValue] = useState<string>("PENDING");

    const queryClient = useQueryClient();

    const { user, hasPermission } = useAppContext();

    const navigate = useNavigate(); // Initialize useNavigate

    // const navigate = useNavigate()

    const { control, register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<StockRequestType> ();

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

    const fetchStockRequst = useCallback(async () => {
        if (id) { // Only fetch when 'id' is available and not already fetching
            setIsLoading(true);
            try {
                if (id) {
                    const requestData: StockRequestType = await getStockRequestById(parseInt(id, 10));
                    await fetchBranches();
                    setValue("branchId", requestData.branchId);
                    setValue("requestDate", requestData.requestDate
                        ? new Date(requestData.requestDate).toISOString()
                        : null
                    );
                    setValue("StatusType", requestData.StatusType);
                    setValue("note", requestData.note);
                    // Update adjustmentDetails only if it has changed
                    // if (JSON.stringify(adjustmentData.adjustmentDetails) !== JSON.stringify(adjustmentDetails)) {
                        setRequestDetails(requestData.requestDetails);
                    // }
                    // console.log("adjustmentData:", adjustmentData.adjustmentDetails);
                    setStatusValue(requestData.StatusType);
                }
            } catch (error) {
                console.error("Error fetching stock request:", error);
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
        fetchStockRequst();
    }, [fetchBranches, fetchStockRequst]);

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
    const addOrUpdateRequestDetail = async (Detail: StockRequestDetailType) => {
        // Find if the product already exists in the array
        const existingIndexData = requestDetails.findIndex(
            (item) => item.productVariantId === Detail.productVariantId
        );
        if (existingIndexData !== -1) {
            await ShowWarningMessage("Product already in cart");
            return;
        }
        // console.log("ddfd:", newDetail);

        const newDetail: StockRequestDetailType = {
            id: Detail.id ?? 0, // Default to 0 if id is null
            productId: Detail.productId ?? 0, // Provide defaults for other nullable fields
            productVariantId: Detail.productVariantId ?? 0,
            quantity: Detail.quantity ?? 1,
            products: Detail.products ?? null,
            productvariants: Detail.productvariants ?? null
        };

        const existingIndex = requestDetails.findIndex(
            (item) => item.productVariantId === newDetail.productVariantId
        );

        if (existingIndex !== -1) {
            // Product exists; update its data
            const updatedDetails = [...requestDetails];
            updatedDetails[existingIndex] = { ...newDetail }; // Replace with the new data
            setRequestDetails(updatedDetails);
        } else {
            // Product does not exist; add it
            setRequestDetails([...requestDetails, newDetail]);
        }

        setSearchTerm(""); // Clear search
        setShowSuggestions(false); // Hide suggestions
    };

    const increaseQuantity = (index: number) => {
        // Create a copy of the current purchaseDetails array
        const updatedDetails = [...requestDetails];
        
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
            setRequestDetails(updatedDetails);
        }
    };
    
    const decreaseQuantity = (index: number) => {
        const updatedDetails = [...requestDetails];
        const detail = updatedDetails[index];
        
        // Ensure quantity is a number before performing the increment
        const currentQuantity = Number(detail.quantity) || 0; // Convert to number

        if (detail.quantity > 1) {
            const updatedDetail = {
                ...detail,
                quantity: currentQuantity - 1,
            };
    
            updatedDetails[index] = updatedDetail;
            setRequestDetails(updatedDetails);
        }
    };

    const removeProductFromCart = (index: number) => {
        const updatedDetails = requestDetails.filter((_, i) => i !== index);
        setRequestDetails(updatedDetails);
    };

    const onSubmit: SubmitHandler<StockRequestType> = async (formData) => {
        setIsLoading(true);
        try {
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
            const requestData: StockRequestType = {
                id: id ? Number(id) : undefined,
                branchId: formData.branchId,
                requestBy: Number(user?.id),
                branch: { id: formData.branchId ?? 0, name: "Default Branch", address: "Default Address"},
                requestDate: formData.requestDate,
                StatusType: formData.StatusType,
                note: formData.note,
                delReason: "",
                requestDetails: requestDetails
            }
            await upsertRequest(requestData);
            toast.success(id ? "Stock Request updated successfully" : "Stock Request created successfully", {
                position: "top-right",
                autoClose: 2000
            });

            // Reset form data and purchaseDetails
            reset({
                id: undefined,
                branchId: undefined,
                requestDate: undefined,
                StatusType: undefined,
                note: undefined,
                requestDetails: []
            });

            // Redirect to the specified URL
            navigate("/stockrequest");

        } catch (err: any) {
            if (err.message) {
                toast.error(err.message, {
                    position: 'top-right',
                    autoClose: 2000
                });
            } else {
                toast.error("Error adding/editing stock request", {
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
                        { id ? " Update Stock Request" : " Add Stock Request" }
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
                            <div className={`grid grid-cols-1 gap-4 ${ user?.roleType === "ADMIN" ? 'sm:grid-cols-2' : 'sm:grid-cols-1' } mb-5`}>
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
                                <div style={wrapperStyle}>
                                    <label htmlFor="date-picker">Select a Date: <span className="text-danger text-md">*</span></label>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <Controller
                                            name="requestDate"
                                            control={control}
                                            rules={{ required: "Request date is required" }}
                                            render={({ field }) => (
                                                <DatePicker
                                                    value={field.value ? new Date(field.value as string) : null}
                                                    onChange={(date) => field.onChange(date)}
                                                    minDate={new Date()}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            error: !!errors.requestDate,
                                                        },
                                                    }}
                                                />
                                            )}
                                        />
                                    </LocalizationProvider>
                                    {errors.requestDate && <span className="error_validate">{errors.requestDate.message}</span>}
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
                                                onClick={() => addOrUpdateRequestDetail({
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
                                        {requestDetails.map((detail, index) => (
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
                                            hidden={!(hasPermission('Stock-Request-Approve') && statusValue === "PENDING")}
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
                            <NavLink to="/stockrequest" type="button" className="btn btn-outline-warning">
                                <FontAwesomeIcon icon={faArrowLeft} className='mr-1' />
                                Go Back
                            </NavLink>
                            {statusValue === 'PENDING' &&
                                (hasPermission('Stock-Request-Create') || hasPermission('Adjust-Stock-Edit')) && (
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

export default StockRequestForm;