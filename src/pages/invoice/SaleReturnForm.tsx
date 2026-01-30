import React, { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { BranchType, CustomerType, SaleReturnType, SaleReturnDetailType, InvoiceType, InvoiceDetailType} from "@/data_types/types";
import { getAllBranches } from "@/api/branch";
import { getAllCustomers } from "@/api/customer";
import { getNextInvoiceRef } from "@/api/invoice";
import { getInvoiceByid } from "@/api/invoice";
import { upsertSaleReturn, getSaleReturnById } from "@/api/saleReturn";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAppContext } from '@/hooks/useAppContext';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import "./dateStyle.css";
import Modal from "./Modal";
import CustomerModal from "../customer/Modal";
import { upsertCustomerAction } from "@/utils/customerActions";
import { useQueryClient } from "@tanstack/react-query";
import { Undo2 } from 'lucide-react';

const SaleReturn: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user, hasPermission } = useAppContext();

    const [isLoading, setIsLoading] = useState(false);
    const [branches, setBranches] = useState<BranchType[]>([]);
    const [customers, setCustomers] = useState<CustomerType[]>([]);
    const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetailType[]>([]);
    const [grandTotal, setGrandTotal] = useState<number>(0);
    const [shipping, setShipping] = useState<number>(0);
    const [discount, setDiscount] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(0);
    const [statusValue, setStatusValue] = useState<string>("PENDING");
    const [returnQty, setReturnQty] = useState<Record<number, number>>({});
    const [returnedSoFar, setReturnedSoFar] = useState<Record<number, number>>({});
    const [returnedGrandTotal, setReturnedGrandTotal] = useState(0);
    const [clickData, setClickData] = useState<InvoiceDetailType | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [returnGrandTotal, setReturnGrandTotal] = useState<number>(0);

    const { control, register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<InvoiceType>();

    // ------------------------------
    // Fetch branches & customers
    // ------------------------------
    const fetchBranches = useCallback(async () => {
        setIsLoading(true);
        try { setBranches(await getAllBranches()); } 
        catch (e) { console.error(e); } 
        finally { setIsLoading(false); }
    }, []);

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        try { setCustomers(await getAllCustomers()); } 
        catch (e) { console.error(e); } 
        finally { setIsLoading(false); }
    }, []);

    // ------------------------------
    // Build returnQty and total
    // ------------------------------
    const buildReturnQtyFromSaleReturns = (saleReturns: SaleReturnType[]) => {
        const returned: Record<number, number> = {};
        saleReturns.forEach(sr => {
        sr.items?.forEach(item => {
            returned[item.saleItemId] = (returned[item.saleItemId] || 0) + Number(item.quantity || 0);
        });
        });
        return returned;
    };

    const calculateReturnedGrandTotal = (saleReturns: SaleReturnType[]) => {
        return saleReturns.reduce((sum, sr) => {
        return sum + (sr.items?.reduce((itemSum, item) => itemSum + Number(item.total || 0), 0) || 0);
        }, 0);
    };

    const fetchInvoice = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);

        try {
            const invoiceData = await getInvoiceByid(Number(id));
            setInvoiceDetails(invoiceData.items);

            setValue("OrderSaleType", invoiceData.OrderSaleType);
            setValue("branchId", invoiceData.branchId);
            setValue("customerId", invoiceData.customerId);
            setValue("ref", invoiceData.ref);
            setValue("orderDate", invoiceData.orderDate ? new Date(invoiceData.orderDate).toISOString() : null);
            setValue("taxRate", invoiceData.taxRate);
            setValue("shipping", invoiceData.shipping);
            setValue("discount", invoiceData.discount);
            setValue("status", invoiceData.status);

            const saleReturns = await getSaleReturnById(Number(id));

            if (saleReturns.length > 0) {
                const returned = buildReturnQtyFromSaleReturns(saleReturns);
                setReturnedSoFar(returned);

                setReturnedGrandTotal(calculateReturnedGrandTotal(saleReturns));
            }

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [id, setValue]);


    useEffect(() => {
        fetchBranches();
        fetchCustomers();
        fetchInvoice();
    }, [fetchInvoice]);

    // ------------------------------
    // Calculate returnGrandTotal for current form
    // ------------------------------
    useEffect(() => {
        const total = invoiceDetails.reduce((acc, item) => {
        const qty = Number(returnQty[item.id] || 0);
        if (!qty) return acc;
            const net = item.discountMethod === "Fixed"
                ? Number(item.price) - Number(item.discount)
                : Number(item.price) * ((100 - Number(item.discount)) / 100);
            return acc + qty * net;
        }, 0);
        setReturnGrandTotal(total);
    }, [returnQty, invoiceDetails]);

    const branchId = watch("branchId");

    useEffect(() => {
        if (id) return;
        const effectiveBranchId = user?.roleType === "USER" ? user.branchId : branchId;
        if (!effectiveBranchId) {
            setValue("ref", "");
            return;
        }
        getNextInvoiceRef(Number(effectiveBranchId))
            .then((data) => {
                const refValue = (data && typeof data === "object" && "ref" in data) ? (data as any).ref : String(data || "");
                setValue("ref", refValue);
            })
            .catch(() => {
                toast.error("Failed to generate invoice number");
            });
    }, [branchId, user, id, setValue]);

    const shippingValue = String(watch("shipping") || "0");
    const discountValue = String(watch("discount") || "0");
    const taxValue = String(watch("taxRate") || "0");

    useEffect(() => {
        if (!watch("OrderSaleType")) setValue("OrderSaleType", "RETAIL");

        const sanitizeNumber = (value: string | number) => parseFloat(String(value).replace(/^0+/, "")) || 0;
        const parsedShipping = sanitizeNumber(shippingValue);
        const parsedDiscount = sanitizeNumber(discountValue);
        const parsedTax = sanitizeNumber(taxValue);

        setShipping(parsedShipping);
        setDiscount(parsedDiscount);
        setTaxRate(parsedTax);

        const totalSum = invoiceDetails.reduce((acc, item) => acc + Number(item.total || 0), 0);
        const totalAfterDis = totalSum - parsedDiscount;
        setGrandTotal(totalAfterDis + (parsedTax / 100) * totalAfterDis + parsedShipping);
    }, [shippingValue, discountValue, taxValue, invoiceDetails, setValue]);

    const updateData = (newDetail: InvoiceDetailType) => {
        setClickData(newDetail);
        setIsModalOpen(true);
    };

    const handleAddorEditCustomer = (payload: { data: CustomerType }) => {
        return upsertCustomerAction(
            payload,
            () => queryClient.invalidateQueries({ queryKey: ["validateToken"] }),
            fetchCustomers,
            () => setIsCustomerModalOpen(false)
        );
    };

    // ------------------------------
    // Combined total for display
    // ------------------------------
    const totalReturnedAllTime = (Number(returnedGrandTotal) || 0) + (Number(returnGrandTotal) || 0);

    // ------------------------------
    // Increase / Decrease qty
    // ------------------------------
    const increaseQuantity = (index: number) => {
        const item = invoiceDetails[index];
        const alreadyReturned = returnedSoFar[item.id] || 0;
        const current = returnQty[item.id] || 0;
        const maxAllowed = item.quantity - alreadyReturned;
        if (current >= maxAllowed) { toast.warn(`You can only return ${maxAllowed} units`); return; }
        setReturnQty(prev => ({ ...prev, [item.id]: current + 1 }));
    };

    const decreaseQuantity = (index: number) => {
        const item = invoiceDetails[index];
        const current = returnQty[item.id] || 0;
        if (current <= 0) return;
        setReturnQty(prev => ({ ...prev, [item.id]: current - 1 }));
    };

    const onSubmit: SubmitHandler<InvoiceType> = async (formData) => {
        try {
            setIsLoading(true);

            const items = invoiceDetails
                .filter(item => (returnQty[item.id] || 0) > 0)
                .map(item => ({
                    orderItemId: item.id,
                    productVariantId: item.productVariantId,
                    quantity: returnQty[item.id],
                    price: item.price,
                    discount: item.discount,
                    taxNet: item.taxNet,
                    total: ((item.price - item.discount) + ((item.taxNet / 100) * (item.price - item.discount))) * (returnQty[item.id] || 0),
                    taxMethod: item.taxMethod,
                    discountMethod: item.discountMethod,
                    ItemType: item.ItemType,
                    serviceId: item.serviceId,
                    productId: item.productId
                }));

            if (items.length === 0) {
                toast.error("Please return at least one item");
                return;
            }

            const payload = {
                orderId: Number(id),
                branchId: formData.branchId,
                customerId: formData.customerId,
                orderDate: formData.orderDate,
                ref: (formData as any).ref || "",
                taxRate: formData.taxRate,
                taxNet: formData.taxNet || 0,
                shipping: formData.shipping,
                discount: formData.discount,
                delReason: "",
                totalAmount: returnGrandTotal, // <-- only returned items
                status: formData.status,
                note: formData.note,
                branch: branches.find(b => b.id === formData.branchId) || null,
                customers: customers.find(c => c.id === formData.customerId) || null,
                items
            } as unknown as SaleReturnType;

            await upsertSaleReturn(payload);

            toast.success("Sale return created successfully", {
                position: "top-right",
                autoClose: 4000,
            });

            navigate("/returnsells");

        } catch (error: any) {
            toast.error(error?.message || "Sale return failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="panel">
                <div className="mb-5">
                    <h5 className="flex items-center text-lg font-semibold dark:text-white-light">
                        <Undo2 /> Sale Return
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
                                        />
                                        <span className="ml-2 text-white-dark">Retail Price</span>
                                    </label>

                                    <label className="flex cursor-pointer items-center">
                                        <input
                                            className="form-radio"
                                            type="radio"
                                            checked={watch("OrderSaleType") === "WHOLESALE"}
                                        />
                                        <span className="ml-2 text-white-dark">Wholesale Price</span>
                                    </label>
                                </div>

                            </div>

                            <div className={`grid grid-cols-1 gap-4 ${ user?.roleType === "ADMIN" ? 'sm:grid-cols-4' : 'sm:grid-cols-3' } mb-5`}>
                                {user?.roleType === "ADMIN" &&
                                    <div>
                                        <label>Branch <span className="text-danger text-md">*</span></label>
                                        <select id="branch" className="form-input" disabled {...register("branchId", { required: "Branch is required" })}>
                                            <option value="">Select a branch</option>
                                            {branches.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                                        </select>
                                        {errors.branchId && <span className="error_validate">{errors.branchId.message}</span>}
                                    </div>
                                }

                                <div>
                                    <label>Invoice No <span className="text-danger text-md">*</span></label>
                                    <input type="text" className="form-input" readOnly {...register("ref", { required: "This invoice no is required" })} />
                                </div>
                                <div>
                                    <label>Select a Date <span className="text-danger text-md">*</span></label>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <Controller
                                            name="orderDate"
                                            control={control}
                                            rules={{ required: "Order date is required" }}
                                            render={({ field }) => (
                                                <DatePicker readOnly value={field.value ? new Date(field.value as string) : null} onChange={(date) => field.onChange(date)}
                                                    slotProps={{ textField: { fullWidth: true, error: !!errors.orderDate } }}
                                                />
                                            )}
                                        />
                                    </LocalizationProvider>
                                    {errors.orderDate && <span className="error_validate">{errors.orderDate.message}</span>}
                                </div>

                                <div>
                                    <label>Customer</label>
                                    <div className="flex">
                                        <select disabled className="form-input ltr:rounded-r-none rtl:rounded-l-none" {...register("customerId")}>
                                            <option value="">Select a customer...</option>
                                            {customers.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                                        </select>
                                        <button type="button" onClick={() => setIsCustomerModalOpen(true)} className="bg-secondary text-white flex justify-center items-center ltr:rounded-r-md rtl:rounded-l-md px-3 font-semibold border ltr:border-l-0 rtl:border-r-0 border-secondary">
                                            <FontAwesomeIcon icon={faCirclePlus} />
                                        </button>
                                    </div>
                                    {errors.customerId && <span className="error_validate">{errors.customerId.message}</span>}
                                </div>
                            </div>

                            <div className="dataTable-container">
                                <table className="whitespace-nowrap dataTable-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Product</th>
                                            <th>Net Unit Cost</th>
                                            <th>Qty Sold</th>
                                            <th>Qty Return</th>
                                            <th>Discount</th>
                                            <th>Tax</th>
                                            <th>SubTotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoiceDetails.map((detail, index) => {
                                            const alreadyReturned = returnedSoFar[detail.id] || 0;
                                            const currentReturn = returnQty[detail.id] || 0;
                                            const maxReturnable = detail.quantity - alreadyReturned;
                                            const remaining = maxReturnable - currentReturn;
                                            
                                            return (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <p>{detail.ItemType === "PRODUCT" ? `${detail.products?.name} - ${detail.productvariants?.name}` : detail.services?.name}</p>
                                                        <p className="text-center"><span className="badge badge-outline-primary rounded-full">{detail.ItemType === "PRODUCT" ? detail.productvariants?.barcode : detail.services?.serviceCode}</span></p>
                                                    </td>
                                                    <td>$ {detail.discountMethod === "Fixed" ? (detail.price - detail.discount).toFixed(2) : (detail.price * ((100 - detail.discount) / 100)).toFixed(2)}</td>
                                                    <td>{detail.quantity}</td>
                                                    <td>
                                                        <div className="inline-flex" style={{width: '40%'}}>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => decreaseQuantity(index)} 
                                                                className="flex items-center justify-center border border-r-0 border-danger bg-danger px-3 font-semibold text-white ltr:rounded-l-md rtl:rounded-r-md"
                                                                disabled={currentReturn <= 0}
                                                            >
                                                                -
                                                            </button>
                                                                <input 
                                                                    type="text" 
                                                                    value={`${currentReturn} / ${maxReturnable}`}
                                                                    className="form-input rounded-none text-center" 
                                                                    readOnly 
                                                                />
                                                            <button 
                                                                type="button" 
                                                                onClick={() => increaseQuantity(index)} 
                                                                className="flex items-center justify-center border border-l-0 border-warning bg-warning px-3 font-semibold text-white ltr:rounded-r-md rtl:rounded-l-md"
                                                                disabled={currentReturn >= maxReturnable}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        {/* Remaining text */}
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Remaining: <span className="font-medium">{remaining}</span>
                                                        </p>
                                                    </td>
                                                    <td>$ {detail.discount}</td>
                                                    <td>{detail.taxNet}%</td>
                                                    <td>$ {detail.total}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={6}></td>
                                            <td style={{padding: "8px 5px"}}><b>Return Total</b></td>
                                            <td><b>$ {(totalReturnedAllTime || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</b></td>
                                        </tr>
                                    </tfoot>

                                </table>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5 mt-5">
                                <div>
                                    <label>Order Tax</label>
                                    <input readOnly type="text" className="form-input" {...register("taxRate")} />
                                </div>
                                <div>
                                    <label>Discount</label>
                                    <input readOnly type="text" className="form-input" {...register("discount")} />
                                </div>
                                <div>
                                    <label>Status <span className="text-danger">*</span></label>
                                    <select disabled={true} className="form-input" {...register("status", { required: "Status is required" })}>
                                        <option value="">Select a status...</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="APPROVED" disabled={!hasPermission("Sale-Approve") && statusValue === "PENDING"}>Approved</option>
                                        <option value="COMPLETED" disabled={statusValue !== "COMPLETED" && statusValue !== "CANCELLED" && statusValue !== "APPROVED"}>Completed</option>
                                        <option value="CANCELLED" disabled={statusValue !== "CANCELLED" && statusValue !== "COMPLETED" && statusValue !== "APPROVED"}>Cancelled</option>
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
                            <NavLink to="/sale" type="button" className="btn btn-outline-warning">
                                <FontAwesomeIcon icon={faArrowLeft} className='mr-1' /> Go Back
                            </NavLink>
                            {hasPermission('Sale-Return') &&
                                <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={isLoading}>
                                    <FontAwesomeIcon icon={faSave} className='mr-1' /> {isLoading ? 'Saving...' : 'Save'}
                                </button>
                            }
                        </div>
                    </form>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={() => {}} clickData={clickData} />
            <CustomerModal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)} onSubmit={handleAddorEditCustomer} />
        </>
    );
};

export default SaleReturn;
