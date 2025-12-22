import React, { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { BranchType, CustomerType, ProductVariantType, ProductType, ServiceType, InvoiceType, InvoiceDetailType } from "@/data_types/types";
import { getAllBranches } from "@/api/branch";
import { getAllCustomers } from "@/api/customer";
import { searchProduct } from "@/api/searchProduct";
import { searchService } from "@/api/searchService";
import { upsertInvoice, getInvoiceByid } from "@/api/invoice";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAppContext } from '@/hooks/useAppContext';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import "./dateStyle.css";
import Modal from "./Modal";
import ShowWarningMessage from "../components/ShowWarningMessage";
import ShowConfirmationMessage from "../components/ShowConfirmationMessage";
import CustomerModal from "../customer/Modal";
import { upsertCustomerAction } from "@/utils/customerActions";
// import { useSuppliers } from "@/hooks/useSupplier";
import { useQueryClient } from "@tanstack/react-query";
import { FilePenLine, Pencil, Plus, Trash2 } from 'lucide-react';
import { get } from "http";

const InvoiceForm: React.FC = () => {
    // Customer is a React component (Element); it doesn't return methods — provide a local handler for CustomerModal instead.
    const handleAddorEditCustomer = (payload: { data: CustomerType }) => {
        return upsertCustomerAction(
            payload,
            () => queryClient.invalidateQueries({ queryKey: ["validateToken"] }),
            fetchCustomers,
            () => setIsModalOpen(false)
        );
    };

    const { id } = useParams<{ id: string }>();
    const [isLoading, setIsLoading] = useState(false);
    const [braches, setBranches] = useState<BranchType[]>([]);
    const [customers, setCustomers] = useState<CustomerType[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchTermService, setSearchTermService] = useState("");
    const [productResults, setProductResults] = useState<ProductVariantType[]>([]);
    const [serviceResults, setServiceResults] = useState<ServiceType[]>([]);
    const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetailType[]>([]);
    const [shipping, setShipping] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(0);
    const [grandTotal, setGrandTotal] = useState<number>(0);
    const [clickData, setClickData] = useState<InvoiceDetailType | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showSuggestionsService, setShowSuggestionsService] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [statusValue, setStatusValue] = useState<string>("PENDING");
    const prevOrderSaleType = useRef<"RETAIL" | "WHOLESALE">("RETAIL");

    const queryClient = useQueryClient();

    const { user, hasPermission } = useAppContext();

    const navigate = useNavigate(); // Initialize useNavigate

    // const navigate = useNavigate()

    const { control, register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<InvoiceType> ();

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

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAllCustomers();
            setCustomers(data as CustomerType[]);
        } catch (error) {
            console.error("Error fetching customer:", error);
        } finally {
            setIsLoading(false);
        }
    }, [id, setValue]);

    const fetchInvoice = useCallback(async () => {
        if (id) { // Only fetch when 'id' is available and not already fetching
            setIsLoading(true);
            try {
                if (id) {
                    const invoiceData: InvoiceType = await getInvoiceByid(parseInt(id, 10));
                    await fetchBranches();
                    // await fetchSuppliers();
                    setValue("OrderSaleType", invoiceData.OrderSaleType);
                    setValue("branchId", invoiceData.branchId);
                    setValue("customerId", invoiceData.customerId);
                    setValue("orderDate", invoiceData.orderDate
                        ? new Date(invoiceData.orderDate).toISOString()
                        : null
                    );
                    setValue("taxRate", invoiceData.taxRate);
                    setValue("shipping", invoiceData.shipping);
                    setValue("discount", invoiceData.discount);
                    setGrandTotal(invoiceData.totalAmount);
                    setValue("status", invoiceData.status);
                    setValue("note", invoiceData.note);
                 
                    setInvoiceDetails(invoiceData.items);
                    setStatusValue(invoiceData.status);
                }
            } catch (error) {
                console.error("Error fetching invoice:", error);
            } finally {
                setIsLoading(false);
            }
        }
    }, [id, setValue]);

    useEffect(() => {
        fetchBranches();
        fetchCustomers();
        fetchInvoice();
    }, [fetchBranches, fetchCustomers, fetchInvoice]);

    const OrderSaleType = watch("OrderSaleType") // RETAIL || WHOLESALE;
    // Watch the "shipping" field
    const shippingValue = String(watch("shipping") || "0"); // Force it to be a string
    const discountValue = String(watch("discount") || "0");
    const taxValue = String(watch("taxRate") || "0");
    useEffect(() => {
        if (!watch("OrderSaleType")) {
            setValue("OrderSaleType", "RETAIL");
        }

        const sanitizeNumber = (value: string | number) => {
            return parseFloat(String(value).replace(/^0+/, "")) || 0;
        };
    
        const parsedShipping = sanitizeNumber(shippingValue);
        const parsedDiscount = sanitizeNumber(discountValue);
        const parsedTax = sanitizeNumber(taxValue);
    
        setShipping(parsedShipping);
        setDiscount(parsedDiscount);
        setTaxRate(parsedTax);
    
        const totalSum = sumTotal(invoiceDetails);
        const sanitizedTotalSum = sanitizeNumber(totalSum); // Sanitize totalSum here
        const totalAfterDis = sanitizedTotalSum - parsedDiscount;
        // console.log("grandTotal:", (totalAfterDis + ((parsedTax / 100) * totalAfterDis)) + parsedShipping);
        setGrandTotal((totalAfterDis + ((parsedTax / 100) * totalAfterDis)) + parsedShipping);
    }, [shippingValue, discountValue, taxValue, invoiceDetails]);

    const handleInvoiceSaleTypeChange = async (
        value: "RETAIL" | "WHOLESALE"
    ) => {
        if (prevOrderSaleType.current === value) return;

        if (invoiceDetails.length > 0) {
            const ok = await ShowConfirmationMessage(
                "change"
            );

            if (!ok) {
                // revert UI
                setValue("OrderSaleType", prevOrderSaleType.current, {
                    shouldDirty: false,
                });
                return;
            }
            setInvoiceDetails([]);

            setValue("shipping", null, { shouldDirty: false });
            setValue("discount", null, { shouldDirty: false });
            setValue("taxRate", null, { shouldDirty: false });

            setGrandTotal(0);
            setShipping(0);
            setDiscount(0);
            setTaxRate(0);
        }

        prevOrderSaleType.current = value;
        setValue("OrderSaleType", value);
    };

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

    // Fetch service as the user types
    const handleSearchService = async (term: string) => {
        if (term.trim() === "") {
            setServiceResults([]);
            return;
        }

        try {
            const response = await searchService(term);
            // const data = await response.json();
            setServiceResults(response);
            setShowSuggestionsService(true);
        } catch (error) {
            console.error("Error fetching service:", error);
        }
    };

    const handleFocus = () => {
        // Clear suggestions when focusing on the input box
        setShowSuggestions(false);
      };

    // Handle typing in search bar broduct
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTerm(term);
        handleSearch(term);
    };

    // Handle typing in search bar
    const handleInputChangeService = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value;
        setSearchTermService(term);
        handleSearchService(term);
    };

    // Function to add or update a product detail
    const addOrUpdateInvoiceDetail = async (newDetail: InvoiceDetailType) => {
        // Find if the product already exists in the array
        const existingIndex = invoiceDetails.findIndex(
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

    // Function to add or update a service detail
    const addOrUpdateServiceDetail = async (newDetail: InvoiceDetailType) => {
        // Find if the service already exists in the array
        const existingIndex = invoiceDetails.findIndex(
            (item) => item.serviceId === newDetail.serviceId
        );
        if (existingIndex !== -1) {
            await ShowWarningMessage("Service already in cart ");
            return;
        }
        // console.log("ddfd:", newDetail);

        setClickData({
            ...newDetail
        });
  
        setIsModalOpen(true);
        setSearchTermService(""); // Clear search
        setShowSuggestionsService(false); // Hide suggestions
    };

    const handleOnSubmit = async (InvoiceDetailData: InvoiceDetailType) => {
        try {
            const newDetail: InvoiceDetailType = {
                id: InvoiceDetailData.id ?? 0, // Default to 0 if id is null
                orderId: InvoiceDetailData.orderId ?? 0,
                productId: InvoiceDetailData.productId ?? 0, // Provide defaults for other nullable fields
                productVariantId: InvoiceDetailData.productVariantId ?? 0,
                serviceId: InvoiceDetailData.serviceId ?? 0,
                ItemType: InvoiceDetailData.ItemType,
                quantity: InvoiceDetailData.quantity ?? 1,
                price: InvoiceDetailData.price ? InvoiceDetailData.price : 0,
                taxNet: InvoiceDetailData.taxNet ?? 0,
                taxMethod: InvoiceDetailData.taxMethod ?? null,
                discount: InvoiceDetailData.discount ?? 0,
                discountMethod: InvoiceDetailData.discountMethod ?? null,
                products: InvoiceDetailData.products ?? null,
                productvariants: InvoiceDetailData.productvariants ?? null,
                services: InvoiceDetailData.services ?? null,
                total: calculateTotal({
                    price: InvoiceDetailData.price,
                    quantity: InvoiceDetailData.quantity,
                    taxNet: InvoiceDetailData.taxNet,
                    taxMethod: InvoiceDetailData.taxMethod,
                    discount: InvoiceDetailData.discount,
                    discountMethod: InvoiceDetailData.discountMethod,
                }),
            };
            
            var existingIndex = 0;
            if (newDetail.ItemType === "PRODUCT") {
                var existingIndex = invoiceDetails.findIndex(
                    (item) => item.productVariantId === newDetail.productVariantId
                );
            }

            if (newDetail.ItemType === "SERVICE") {
                var existingIndex = invoiceDetails.findIndex(
                    (item) => item.serviceId === newDetail.serviceId
                );
            }

            if (existingIndex !== -1) {
                // Product exists; update its data
                const updatedDetails = [...invoiceDetails];
                updatedDetails[existingIndex] = { ...newDetail }; // Replace with the new data
                setInvoiceDetails(updatedDetails);
            } else {
                // Product does not exist; add it
                setInvoiceDetails([...invoiceDetails, newDetail]);
            }

            // Recalculate grand total
            const totalSum = sumTotal([...invoiceDetails, newDetail]);
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
                toast.error("Error adding/editting invoice", {
                    position: "top-right",
                    autoClose: 2000
                });
            }
        }
    };

    const increaseQuantity = (index: number) => {
        // Create a copy of the current invoiceDetails array
        const updatedDetails = [...invoiceDetails];
        
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
            setInvoiceDetails(updatedDetails);
        }
    };
    
    const decreaseQuantity = (index: number) => {
        const updatedDetails = [...invoiceDetails];
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
            setInvoiceDetails(updatedDetails);
        }
    };
    
    const calculateTotal = (detail: Partial<InvoiceDetailType>): number => {
        const price = Number(detail.price) || 0; // Product cost
        const quantity = Number(detail.quantity) || 0; // Quantity
        const discount = Number(detail.discount) || 0; // discount value
        const taxNet = Number(detail.taxNet) || 0; // Tax value
      
        // Determine discount method (default to no discount if null)
        const discountedPrice = detail.discountMethod === "Percent"
          ? price * ((100 - discount) / 100) // Apply percentage discount
          : detail.discountMethod === "Fixed"
          ? price - discount // Apply flat discount
          : price; // No discount applied
      
        // Determine tax method (default to no tax if null)
        let priceAfterTax = discountedPrice;
        if (detail.taxMethod === "Include") {
          // Tax is included in the price, no additional tax is applied
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
        const updatedDetails = invoiceDetails.filter((_, i) => i !== index);
        setInvoiceDetails(updatedDetails);
    };

    const onSubmit: SubmitHandler<InvoiceType> = async (formData) => {
        setIsLoading(true);
        try {
            await queryClient.invalidateQueries({ queryKey: ["validateToken"] });
            const invoiceData: InvoiceType = {
                id: id ? Number(id) : undefined,
                branchId: formData.branchId,
                customerId: formData.customerId,
                branch: { id: formData.branchId ?? 0, name: "Default Branch", address: "Default Address"},
                customers: { id: formData.customerId ?? 0, name: "Default Customer", address: "Default Address"},
                ref: "",
                OrderSaleType: formData.OrderSaleType,
                orderDate: formData.orderDate,
                taxRate: formData.taxRate ? formData.taxRate : null,
                taxNet: formData.taxNet ? formData.taxNet : null,
                discount: formData.discount ? formData.discount : null,
                shipping: formData.shipping ? formData.shipping : null,
                totalAmount: grandTotal,
                paidAmount: 0,
                status: formData.status,
                note: formData.note,
                delReason: "",
                items: invoiceDetails
            }
            await upsertInvoice(invoiceData);
            toast.success(id ? "Invoice updated successfully" : "Invoice created successfully", {
                position: "top-right",
                autoClose: 4000
            });

            // Reset form data and purchaseDetails
            reset({
                id: undefined,
                OrderSaleType: undefined,
                orderDate: undefined,
                branchId: undefined,
                customerId: undefined,
                taxRate: undefined,
                taxNet: undefined,
                discount: undefined,
                shipping: undefined,
                status: undefined,
                note: undefined,
                items: [], // Clear invoiceDetails
            });

            // Redirect to the specified URL
            navigate("/invoice");
        } catch (err: any) {
            if (err.message) {
                toast.error(err.message, {
                    position: 'top-right',
                    autoClose: 4000
                });
            } else {
                toast.error("Error adding/editing invoice", {
                    position: 'top-right',
                    autoClose: 4000
                });
            }
        } finally {
            setIsLoading(false);
        }
    }

    const updateData = (newDetail: InvoiceDetailType) => {
        setClickData({
            id: newDetail.id,
            orderId: newDetail.orderId,
            productId: newDetail.products?.id || 0,
            productVariantId: newDetail.productVariantId,
            products: newDetail.products || null,
            productvariants: newDetail.productvariants || null,
            services: newDetail.services || null,
            serviceId: newDetail.serviceId || 0,
            ItemType: newDetail.ItemType,
            quantity: newDetail.quantity,
            price: newDetail.price,
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
                        { id ? " Update Invoice" : " Add Invoice" }
                    </h5>
                </div>
                <div className="mb-5">
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="mb-5">
                            <div className="mb-5">
                                <div className="flex flex-wrap">
                                    <label className="flex cursor-pointer items-center" style={{ marginRight: '20px'}}>
                                        <input
                                            className="form-radio"
                                            type="radio"
                                            checked={watch("OrderSaleType") === "RETAIL"}
                                            onChange={() => handleInvoiceSaleTypeChange("RETAIL")}
                                        />
                                        <span className="ml-2 text-white-dark">Retail Price</span>
                                    </label>

                                    <label className="flex cursor-pointer items-center">
                                        <input
                                            className="form-radio"
                                            type="radio"
                                            checked={watch("OrderSaleType") === "WHOLESALE"}
                                            onChange={() => handleInvoiceSaleTypeChange("WHOLESALE")}
                                        />
                                        <span className="ml-2 text-white-dark">Wholesale Price</span>
                                    </label>
                                </div>

                            </div>
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
                                <div style={wrapperStyle}>
                                    <label htmlFor="date-picker">Select a Date: <span className="text-danger text-md">*</span></label>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <Controller
                                            name="orderDate"
                                            control={control}
                                            rules={{ required: "Order date is required" }}
                                            render={({ field }) => (
                                                <DatePicker
                                                    value={field.value ? new Date(field.value as string) : null}
                                                    onChange={(date) => field.onChange(date)}
                                                    minDate={new Date()}
                                                    slotProps={{
                                                        textField: {
                                                            fullWidth: true,
                                                            error: !!errors.orderDate,
                                                        },
                                                    }}
                                                />
                                            )}
                                        />
                                    </LocalizationProvider>
                                    {errors.orderDate && <span className="error_validate">{errors.orderDate.message}</span>}
                                </div>
                                <div>
                                    <label>Customer</label>
                                    <div className="flex">
                                        <select 
                                            id="customerId" className="form-input ltr:rounded-r-none rtl:rounded-l-none ltr:border-r-0 rtl:border-l-0" 
                                            {...register("customerId")} 
                                        >
                                            <option value="">Select a customer...</option>
                                            {customers.map((option) => (
                                            <option key={option.id} value={option.id}>
                                                {option.name}
                                            </option>
                                            ))}
                                        </select>
                                        <button type="button" onClick={() => { setIsCustomerModalOpen(true) }} className="bg-secondary text-white flex justify-center items-center ltr:rounded-r-md rtl:rounded-l-md px-3 font-semibold border ltr:border-l-0 rtl:border-r-0 border-secondary">
                                            <FontAwesomeIcon icon={faCirclePlus} />
                                        </button>
                                    </div>
                                    {errors.customerId && <span className="error_validate">{errors.customerId.message}</span>}
                                </div>
                            </div>
                            <div className="mb-5">
                                <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5`}>
                                    <div>
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
                                                        onClick={() => addOrUpdateInvoiceDetail({
                                                            id: 0, // Assign a default or unique value
                                                            orderId: 0, // Assign a default or unique value
                                                            productId: variants.products?.id || 0,
                                                            productVariantId: variants.id,
                                                            products: variants.products || null,
                                                            productvariants: variants,
                                                            ItemType: "PRODUCT",
                                                            quantity: 1, // Default quantity for a new item
                                                            price: OrderSaleType === "RETAIL" ? Number(variants.retailPrice) : Number(variants.wholeSalePrice) || 0, // Default cost
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

                                    <div>
                                        <label>Service <span className="text-danger text-md">*</span></label>
                                        <div className="relative">
                                            <input type="text" placeholder="Scan/Search Service by Code Or Name" className="peer form-input bg-gray-100 placeholder:tracking-widest ltr:pl-9 ltr:pr-9 rtl:pl-9 rtl:pr-9 sm:bg-transparent ltr:sm:pr-4 rtl:sm:pl-4" value={searchTermService} onChange={handleInputChangeService} />
                                            <button type="button" className="absolute inset-0 h-9 w-9 appearance-none peer-focus:text-primary ltr:right-auto rtl:left-auto">
                                                <svg className="mx-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <circle cx="11.5" cy="11.5" r="9.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5"></circle>
                                                    <path d="M18.5 18.5L22 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"></path>
                                                </svg>
                                            </button>
                                        </div>
                                        {/* Dropdown for suggestions */}
                                        {showSuggestionsService && serviceResults.length > 0 && (
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
                                                {serviceResults.map((service) => (
                                                    <li
                                                        key={service.id}
                                                        style={{
                                                            padding: "8px",
                                                            cursor: "pointer",
                                                            borderBottom: "1px solid #eee",
                                                        }}
                                                        onClick={() => addOrUpdateServiceDetail({
                                                            id: 0, // Assign a default or unique value
                                                            orderId: 0, // Assign a default or unique value
                                                            serviceId: service.id || 0,
                                                            services: service,
                                                            ItemType: "SERVICE",
                                                            quantity: 1, // Default quantity for a new item
                                                            price: Number(service.price) || 0, // Default cost
                                                            taxNet: 0, // Default taxNet
                                                            taxMethod: "Include", // Default tax method
                                                            discount: 0,
                                                            discountMethod: "Fixed",
                                                            total: 0
                                                        })}
                                                    >
                                                        {service.name} - {service.serviceCode}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
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
                                        {invoiceDetails.map((detail, index) => (
                                            <tr key={index}>
                                                <td>{ index + 1 }</td>
                                                <td>
                                                    <p>
                                                        {detail.ItemType === "PRODUCT" ?
                                                            <>
                                                                { detail.products?.name } - { detail.productvariants?.name }
                                                            </>
                                                            :
                                                            <>
                                                                { detail.services?.name }
                                                            </>
                                                        }
                                                    </p>
                                                    <p className="text-center">
                                                        <span className="badge badge-outline-primary rounded-full">
                                                            {detail.ItemType === "PRODUCT" ?
                                                                <>
                                                                    { detail.productvariants?.barcode }
                                                                </>
                                                                :
                                                                <>
                                                                    { detail.services?.serviceCode }
                                                                </>
                                                            }
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
                                                            ? Number(detail.price - detail.discount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                                            : Number(detail.price * ((100 - detail.discount) / 100)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
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
                                                                : Number(detail.price - (detail.price * ((100 - detail.discount) / 100))).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                                      }
                                                </td>
                                                <td>$&nbsp;
                                                    { 
                                                        detail.discountMethod === "Fixed" 
                                                        ? Number(detail.quantity * ((detail.price - detail.discount) * (detail.taxNet / 100))).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                                                        : Number(detail.quantity * ((detail.price * ((100 - detail.discount) / 100)) * (detail.taxNet / 100))).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
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
                                            value="APPROVED"
                                            hidden={!(hasPermission('Invoice-Approve') && statusValue === "PENDING")}
                                        >
                                            Approved
                                        </option>
                                        <option 
                                            value="APPROVED"
                                            hidden={!(user?.roleType === "USER" && statusValue !== "PENDING")}
                                        >
                                            Approved
                                        </option>
                                        <option 
                                            value="APPROVED"
                                            hidden={!(user?.roleType === "USER" && statusValue === "APPROVED")}
                                        >
                                            Approved
                                        </option>
                                        <option 
                                            value="CANCELLED"
                                            hidden={!(user?.roleType === "USER" && statusValue === "CANCELLED")}
                                        >
                                            Cancelled
                                        </option>
                                        <option 
                                            value="COMPLETED"
                                            hidden={!(user?.roleType === "USER" && statusValue === "COMPLETED")}
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
                            <NavLink to="/invoice" type="button" className="btn btn-outline-warning">
                                <FontAwesomeIcon icon={faArrowLeft} className='mr-1' />
                                Go Back
                            </NavLink>
                            {statusValue === 'PENDING' &&
                                (hasPermission('Invoice-Create') || hasPermission('Invoice-Edit')) && (
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

            <CustomerModal 
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSubmit={handleAddorEditCustomer}
            />
        </>
    );
};

export default InvoiceForm;