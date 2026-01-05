import React, { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { BranchType, SupplierType, ProductVariantType, ProductType, PurchaseType, PurchaseDetailType } from "@/data_types/types";
import { getAllBranches } from "@/api/branch";
import { searchProduct } from "@/api/searchProduct";
import { upsertPurchase, getPurchaseByid } from "@/api/purchase";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAppContext } from '@/hooks/useAppContext';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import "./dateStyle.css";
import Modal from "./Modal";
import SupplierModal from "../supplier/Modal";
import { useSuppliers } from "@/hooks/useSupplier";
import { useQueryClient } from "@tanstack/react-query";
import { FilePenLine, Pencil, Plus, Trash2 } from 'lucide-react';
import ShowWarningMessage from "../components/ShowWarningMessage";

const PurchaseForm: React.FC = () => {
    const { allSuppliers, handleAddOrEditSupplier } = useSuppliers();
    const { id } = useParams<{ id: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [braches, setBranches] = useState<BranchType[]>([]);
    // const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [productResults, setProductResults] = useState<ProductVariantType[]>([]);
    const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetailType[]>([]);
    const [shipping, setShipping] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(0);
    const [grandTotal, setGrandTotal] = useState<number>(0);
    const [clickData, setClickData] = useState<PurchaseDetailType | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [statusValue, setStatusValue] = useState<string>("PENDING");

    const queryClient = useQueryClient();

    const { user, hasPermission } = useAppContext();

    const navigate = useNavigate(); // Initialize useNavigate

    // const navigate = useNavigate()

    const { control, register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PurchaseType> ();

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

    const fetchPurchase = useCallback(async () => {
        if (id) { // Only fetch when 'id' is available and not already fetching
            setIsLoading(true);
            try {
                if (id) {
                    const purchaseData: PurchaseType = await getPurchaseByid(parseInt(id, 10));
                    await fetchBranches();
                    // await fetchSuppliers();
                    setValue("branchId", purchaseData.branchId);
                    setValue("supplierId", purchaseData.supplierId);
                    setValue("purchaseDate", purchaseData.purchaseDate
                        ? new Date(purchaseData.purchaseDate).toISOString()
                        : null
                    );
                    setValue("taxRate", purchaseData.taxRate);
                    setValue("shipping", purchaseData.shipping);
                    setValue("discount", purchaseData.discount);
                    setGrandTotal(purchaseData.grandTotal);
                    setValue("paidAmount", purchaseData.paidAmount);
                    setValue("status", purchaseData.status);
                    setValue("note", purchaseData.note);
                    // Update purchaseDetails only if it has changed
                    // if (JSON.stringify(purchaseData.purchaseDetails) !== JSON.stringify(purchaseDetails)) {
                        setPurchaseDetails(purchaseData.purchaseDetails);
                    // }
                    // console.log("purchaseData:", purchaseData.purchaseDetails);
                    setStatusValue(purchaseData.status);
                }
            } catch (error) {
                console.error("Error fetching purchase:", error);
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
        fetchPurchase();
    }, [fetchBranches, fetchPurchase]);

    // Watch the "shipping" field
    const shippingValue = String(watch("shipping") || "0"); // Force it to be a string
    const discountValue = String(watch("discount") || "0");
    const taxValue = String(watch("taxRate") || "0");
    useEffect(() => {
        const sanitizeNumber = (value: string | number) => {
            return parseFloat(String(value).replace(/^0+/, "")) || 0;
        };
    
        const parsedShipping = sanitizeNumber(shippingValue);
        const parsedDiscount = sanitizeNumber(discountValue);
        const parsedTax = sanitizeNumber(taxValue);
    
        setShipping(parsedShipping);
        setDiscount(parsedDiscount);
        setTaxRate(parsedTax);
    
        const totalSum = sumTotal(purchaseDetails);
        const sanitizedTotalSum = sanitizeNumber(totalSum); // Sanitize totalSum here
        const totalAfterDis = sanitizedTotalSum - parsedDiscount;
        // console.log("grandTotal:", (totalAfterDis + ((parsedTax / 100) * totalAfterDis)) + parsedShipping);
        setGrandTotal((totalAfterDis + ((parsedTax / 100) * totalAfterDis)) + parsedShipping);
    }, [shippingValue, discountValue, taxValue, purchaseDetails]);

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

    // // Add product to cart
    // const addOrUpdatePurchaseDetail = (productVariant: ProductVariant) => {
    //     const existing = purchaseDetails.find((item) => item.productVariantId === productVariant.id);
    //     if (existing) {
    //         alert("Product already in cart");
    //         return;
    //     }

    //     const newDetail: PurchaseDetail = {
    //         id: 0,
    //         productId: productVariant.productId,
    //         productVariantId: productVariant.id,
    //         name: productVariant.name,
    //         code: productVariant.code,
    //         products: productVariant.products || null,
    //         cost: 0.0000,
    //         taxNet: 0,
    //         taxMethod: "",
    //         discount: 0,
    //         discountMethod: "",
    //         total: 0.0000,
    //         quantity: 1
    //     }

    //     setPurchaseDetails([...purchaseDetails, newDetail]);
    //     setSearchTerm(""); // Clear search
    //     setShowSuggestions(false); // Hide suggestions
    // };

    // Function to add or update a product detail
    const addOrUpdatePurchaseDetail = async (newDetail: PurchaseDetailType) => {
        // Find if the product already exists in the array
        const existingIndex = purchaseDetails.findIndex(
            (item) => item.productVariantId === newDetail.productVariantId
        );
        if (existingIndex !== -1) {
            await ShowWarningMessage("Product already in cart");
            return;
        }
        // console.log("ddfd:", newDetail);

        setClickData({
            ...newDetail
        });
        setIsModalOpen(true);
        setSearchTerm(""); // Clear search
        setShowSuggestions(false); // Hide suggestions
    };

    const handleOnSubmit = async (PurchaseDetailData: PurchaseDetailType) => {
        try {
            const newDetail: PurchaseDetailType = {
                id: PurchaseDetailData.id ?? 0, // Default to 0 if id is null
                productId: PurchaseDetailData.productId ?? 0, // Provide defaults for other nullable fields
                productVariantId: PurchaseDetailData.productVariantId ?? 0,
                quantity: PurchaseDetailData.quantity ?? 1,
                cost: PurchaseDetailData.cost ? PurchaseDetailData.cost : 0,
                taxNet: PurchaseDetailData.taxNet ?? 0,
                taxMethod: PurchaseDetailData.taxMethod ?? null,
                discount: PurchaseDetailData.discount ?? 0,
                discountMethod: PurchaseDetailData.discountMethod ?? null,
                products: PurchaseDetailData.products ?? null,
                productvariants: PurchaseDetailData.productvariants ?? null,
                total: calculateTotal({
                    cost: PurchaseDetailData.cost,
                    quantity: PurchaseDetailData.quantity,
                    taxNet: PurchaseDetailData.taxNet,
                    taxMethod: PurchaseDetailData.taxMethod,
                    discount: PurchaseDetailData.discount,
                    discountMethod: PurchaseDetailData.discountMethod,
                }),
            };

            const existingIndex = purchaseDetails.findIndex(
                (item) => item.productVariantId === newDetail.productVariantId
            );

            if (existingIndex !== -1) {
                // Product exists; update its data
                const updatedDetails = [...purchaseDetails];
                updatedDetails[existingIndex] = { ...newDetail }; // Replace with the new data
                setPurchaseDetails(updatedDetails);
            } else {
                // Product does not exist; add it
                setPurchaseDetails([...purchaseDetails, newDetail]);
            }

            // Recalculate grand total
            const totalSum = sumTotal([...purchaseDetails, newDetail]);
            setGrandTotal(totalSum);

            setIsModalOpen(false);
        } catch (error: any) {
            // Check if error.message is set by your API function
            if (error.message) {
                toast.error(error.message, {
                    position: "top-right",
                    autoClose: 2000
                });
            } else {
                toast.error("Error adding/editting purchase", {
                    position: "top-right",
                    autoClose: 2000
                });
            }
        }
    };

    const increaseQuantity = (index: number) => {
        // Create a copy of the current purchaseDetails array
        const updatedDetails = [...purchaseDetails];
        
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
                total: calculateTotal({ ...detail, quantity: currentQuantity + 1 }), // Recalculate total after quantity change
            };
    
            // Replace the old detail with the updated one
            updatedDetails[index] = updatedDetail;
    
            // Update the state with the new array
            setPurchaseDetails(updatedDetails);
        }
    };
    
    const decreaseQuantity = (index: number) => {
        const updatedDetails = [...purchaseDetails];
        const detail = updatedDetails[index];
        
        // Ensure quantity is a number before performing the increment
        const currentQuantity = Number(detail.quantity) || 0; // Convert to number

        if (detail.quantity > 1) {
            const updatedDetail = {
                ...detail,
                quantity: currentQuantity - 1,
                total: calculateTotal({ ...detail, quantity: currentQuantity - 1 }), // Recalculate total after quantity change
            };
    
            updatedDetails[index] = updatedDetail;
            setPurchaseDetails(updatedDetails);
        }
    };
    
    const calculateTotal = (detail: Partial<PurchaseDetailType>): number => {
        const cost = Number(detail.cost) || 0; // Product cost
        const quantity = Number(detail.quantity) || 0; // Quantity
        const discount = Number(detail.discount) || 0; // discount value
        const taxNet = Number(detail.taxNet) || 0; // Tax value
      
        // Determine discount method (default to no discount if null)
        const discountedPrice = detail.discountMethod === "Percent"
          ? cost * ((100 - discount) / 100) // Apply percentage discount
          : detail.discountMethod === "Fixed"
          ? cost - discount // Apply flat discount
          : cost; // No discount applied
      
        // Determine tax method (default to no tax if null)
        let priceAfterTax = discountedPrice;
        if (detail.taxMethod === "Include") {
          // Tax is included in the cost, no additional tax is applied
          priceAfterTax = discountedPrice;
        } else if (detail.taxMethod === "Exclude") {
          // Tax is added to the discounted price
          priceAfterTax = discountedPrice + (discountedPrice * (taxNet / 100));
        }
      
        // Calculate total
        return quantity * priceAfterTax;
    }; 
    
    const sumTotal = (details: { total: string | number }[]) => {
        return details.reduce((sum, item) => {
            const sanitizedTotal = parseFloat(String(item.total).replace(/^0+/, "")) || 0;
            return sum + sanitizedTotal;
        }, 0);
    };

    const removeProductFromCart = (index: number) => {
        const updatedDetails = purchaseDetails.filter((_, i) => i !== index);
        setPurchaseDetails(updatedDetails);
    };

    const onSubmit: SubmitHandler<PurchaseType> = async (formData) => {
        setIsLoading(true);
        try {
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
            const selectedSupplier = allSuppliers.find(s => s.id === formData.supplierId);
            console.log("selectedSupplier:", formData);
            const purchaseData: PurchaseType = {
                id: id ? Number(id) : undefined,
                branchId: formData.branchId ?? user?.branchId,
                supplierId: formData.supplierId,
                branch: { id: formData.branchId ?? 0, name: "Default Branch", address: "Default Address"},
                suppliers: selectedSupplier ?? null,
                ref: "",
                purchaseDate: formData.purchaseDate,
                taxRate: formData.taxRate ? formData.taxRate : null,
                taxNet: formData.taxNet ? formData.taxNet : null,
                discount: formData.discount ? formData.discount : null,
                shipping: formData.shipping ? formData.shipping : null,
                grandTotal: grandTotal,
                paidAmount: 0,
                status: formData.status,
                note: formData.note,
                delReason: "",
                purchaseDetails: purchaseDetails
            }
            await upsertPurchase(purchaseData);
            toast.success(id ? "Purchase updated successfully" : "Purchase created successfully", {
                position: "top-right",
                autoClose: 2000
            });

            // Reset form data and purchaseDetails
            reset({
                id: undefined,
                branchId: undefined,
                supplierId: undefined,
                taxRate: undefined,
                taxNet: undefined,
                discount: undefined,
                shipping: undefined,
                status: undefined,
                note: undefined,
                purchaseDetails: [], // Clear purchaseDetails
            });

            // Redirect to the specified URL
            navigate("/purchase");

        } catch (err: any) {
            if (err.message) {
                toast.error(err.message, {
                    position: 'top-right',
                    autoClose: 2000
                });
            } else {
                toast.error("Error adding/editing purchase", {
                    position: 'top-right',
                    autoClose: 2000
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

    const updateData = (newDetail: PurchaseDetailType) => {
        setClickData({
            id: newDetail.id,
            productId: newDetail.products?.id || 0,
            productVariantId: newDetail.productVariantId,
            products: newDetail.products || null,
            productvariants: newDetail.productvariants || null,
            quantity: newDetail.quantity,
            cost: newDetail.cost,
            taxNet: newDetail.taxNet,
            taxMethod: newDetail.taxMethod,
            discount: newDetail.discount,
            discountMethod: newDetail.discountMethod,
            total: newDetail.total
        });
        setIsModalOpen(true);
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
                        { id ? " Update Purchase" : " Add Purchase" }
                    </h5>
                </div>
                <div className="mb-5">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="mb-5">
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
                                <div style={wrapperStyle}>
                                    <label htmlFor="date-picker">Select a Date: <span className="text-danger text-md">*</span></label>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <Controller
                                            name="purchaseDate"
                                            control={control}
                                            rules={{ required: "Purchase date is required" }}
                                            render={({ field }) => (
                                                <DatePicker
                                                    value={field.value ? new Date(field.value as string) : null}
                                                    onChange={(date) => field.onChange(date)}
                                                    minDate={new Date()}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            error: !!errors.purchaseDate,
                                                        },
                                                    }}
                                                />
                                            )}
                                        />
                                    </LocalizationProvider>
                                    {errors.purchaseDate && <span className="error_validate">{errors.purchaseDate.message}</span>}
                                </div>
                                <div>
                                    <label>Supplier <span className="text-danger text-md">*</span></label>
                                    <div className="flex">
                                        <select 
                                            id="supplierId" className="form-input ltr:rounded-r-none rtl:rounded-l-none ltr:border-r-0 rtl:border-l-0" 
                                            {...register("supplierId", { 
                                                required: "Supplier is required"
                                            })} 
                                        >
                                            <option value="">Select a supplier...</option>
                                            {allSuppliers.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.name}
                                            </option>
                                            ))}
                                        </select>
                                        <button type="button" onClick={() => { setIsSupplierModalOpen(true) }} className="bg-secondary text-white flex justify-center items-center ltr:rounded-r-md rtl:rounded-l-md px-3 font-semibold border ltr:border-l-0 rtl:border-r-0 border-secondary">
                                            <FontAwesomeIcon icon={faCirclePlus} />
                                        </button>
                                    </div>
                                    {errors.supplierId && <span className="error_validate">{errors.supplierId.message}</span>}
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
                                                onClick={() => addOrUpdatePurchaseDetail({
                                                    id: 0, // Assign a default or unique value
                                                    productId: variants.products?.id || 0,
                                                    productVariantId: variants.id,
                                                    products: variants.products || null,
                                                    productvariants: variants,
                                                    quantity: 1, // Default quantity for a new item
                                                    cost: Number(variants.purchasePrice) || 0, // Default cost
                                                    taxNet: 0, // Default taxNet
                                                    taxMethod: "Include", // Default tax method
                                                    discount: 0,
                                                    discountMethod: "Fixed",
                                                    total: 0
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
                                            <th>Net Unit Cost</th>
                                            {/* <th>Stock</th> */}
                                            <th>Qty</th>
                                            <th>Discount</th>
                                            <th>Tax</th>
                                            <th>SubTotal</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchaseDetails.map((detail, index) => (
                                            <tr key={index}>
                                                <td>{ index + 1 }</td>
                                                <td>
                                                    <p>{ detail.products?.name } - { detail.productvariants?.name }</p>
                                                    <p className="text-center">
                                                        <span className="badge badge-outline-primary rounded-full">
                                                            { detail.productvariants?.barcode }
                                                        </span>
                                                        <button type="button" onClick={() => updateData(detail)} className="hover:text-warning ml-2" style={{display: "ruby"}} title="Edit">
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5 text-success">
                                                                <path d="M15.2869 3.15178L14.3601 4.07866L5.83882 12.5999L5.83881 12.5999C5.26166 13.1771 4.97308 13.4656 4.7249 13.7838C4.43213 14.1592 4.18114 14.5653 3.97634 14.995C3.80273 15.3593 3.67368 15.7465 3.41556 16.5208L2.32181 19.8021L2.05445 20.6042C1.92743 20.9852 2.0266 21.4053 2.31063 21.6894C2.59466 21.9734 3.01478 22.0726 3.39584 21.9456L4.19792 21.6782L7.47918 20.5844L7.47919 20.5844C8.25353 20.3263 8.6407 20.1973 9.00498 20.0237C9.43469 19.8189 9.84082 19.5679 10.2162 19.2751C10.5344 19.0269 10.8229 18.7383 11.4001 18.1612L11.4001 18.1612L19.9213 9.63993L20.8482 8.71306C22.3839 7.17735 22.3839 4.68748 20.8482 3.15178C19.3125 1.61607 16.8226 1.61607 15.2869 3.15178Z" stroke="currentColor" strokeWidth="1.5"></path>
                                                                <path opacity="0.5" d="M14.36 4.07812C14.36 4.07812 14.4759 6.04774 16.2138 7.78564C17.9517 9.52354 19.9213 9.6394 19.9213 9.6394M4.19789 21.6777L2.32178 19.8015" stroke="currentColor" strokeWidth="1.5"></path>
                                                            </svg>
                                                        </button>
                                                    </p>
                                                </td>
                                                <td>$&nbsp;
                                                    {
                                                        detail.discountMethod === "Fixed" 
                                                            ? Number(detail.cost - detail.discount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                                            : Number(detail.cost * ((100 - detail.discount) / 100)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                                    }
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
                                                <td>$ {
                                                        detail.discount <= 0 
                                                            ? 0
                                                            : detail.discountMethod === "Fixed" 
                                                                ? Number(detail.discount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                                                : Number(detail.cost - (detail.cost * ((100 - detail.discount) / 100))).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                                      }
                                                </td>
                                                <td>$&nbsp;
                                                    { 
                                                        detail.discountMethod === "Fixed" 
                                                        ? Number(detail.quantity * ((detail.cost - detail.discount) * (detail.taxNet / 100))).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                                        : Number(detail.quantity * ((detail.cost * ((100 - detail.discount) / 100)) * (detail.taxNet / 100))).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                                    }
                                                    <br/>
                                                    <span className="text-xs">({detail.taxMethod})</span>
                                                </td>
                                                <td>$ { Number(detail.total).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }</td>
                                                <td>
                                                    <button type="button" onClick={() => removeProductFromCart(index)} className="hover:text-danger" title="Delete">
                                                        <Trash2 color="red" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="mt-5">
                                        <tr>
                                            <td colSpan={6}></td>
                                            <td style={{padding: "8px 5px"}}>Order Tax</td>
                                            <td>{ taxRate }%</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={6}></td>
                                            <td style={{padding: "8px 5px", background: "#fff"}}>Discount</td>
                                            <td style={{background: "#fff"}}>$ { Number(discount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={6}></td>
                                            <td style={{padding: "8px 5px"}}>Shipping</td>
                                            <td>$ { Number(shipping).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }</td>
                                        </tr>
                                        <tr>
                                            <td colSpan={6}></td>
                                            <td style={{padding: "8px 5px", background: "#fff"}}><b>Grand Total</b></td>
                                            <td style={{background: "#fff"}}><b>$ { Number(grandTotal).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') }</b></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5">
                                <div>
                                    <label>Order Tax</label>
                                    <input type="text" className="form-input" 
                                        placeholder="0"
                                        {...register("taxRate")}/>
                                </div>
                                <div>
                                    <label>discount</label>
                                    <input type="text" className="form-input" 
                                        placeholder="0"
                                        {...register("discount")}/>
                                </div>
                                <div>
                                    <label>Shipping</label>
                                    <input type="text" className="form-input" 
                                        placeholder="0"
                                        {...register("shipping")}/>
                                </div>
                                <div>
                                    <label>Status <span className="text-danger text-md">*</span></label>
                                    <select 
                                        id="status" className="form-input" 
                                        {...register("status", { 
                                            required: "Status is required"
                                        })} 
                                    >
                                        <option value="">Select a status...</option>
                                        <option value="PENDING">Pending</option>
                                        <option 
                                            value="RECEIVED"
                                            hidden={!(user?.roleType === "USER" && statusValue !== "PENDING")}
                                        >
                                            Received
                                        </option>
                                        <option 
                                            value="RECEIVED"
                                            hidden={!(hasPermission('Purchase-Receive') && statusValue === "PENDING")}
                                        >
                                            Received
                                        </option>
                                        <option 
                                            value="COMPLETED" 
                                            hidden={!(user?.roleType === "ADMIN" && statusValue === "COMPLETED")}
                                        >
                                            Completed
                                        </option>

                                    </select>
                                    {errors.status && <span className="error_validate">{errors.status.message}</span>}
                                </div>
                            </div>
                            <div className="mb-5">
                                <label>Note</label>
                                <textarea {...register("note")} className="form-input" rows={3}></textarea>
                            </div>
                        </div>
                        <div className="flex justify-end items-center mt-8">
                            <NavLink to="/purchase" type="button" className="btn btn-outline-warning">
                                <FontAwesomeIcon icon={faArrowLeft} className='mr-1' />
                                Go Back
                            </NavLink>
                            {statusValue === 'PENDING' &&
                                (hasPermission('Purchase-Create') || hasPermission('Purchase-Edit')) && (
                                <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={isLoading}>
                                    <FontAwesomeIcon icon={faSave} className='mr-1' />
                                    {isLoading ? 'Saving...' : 'Save'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            <Modal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleOnSubmit}
                clickData={clickData}
            />

            <SupplierModal 
                isOpen={isSupplierModalOpen}
                onClose={() => setIsSupplierModalOpen(false)}
                onSubmit={handleAddOrEditSupplier}
            />
        </>
    );
};

export default PurchaseForm;