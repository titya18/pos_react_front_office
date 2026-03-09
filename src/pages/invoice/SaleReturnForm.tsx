import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import {
  BranchType,
  CustomerType,
  SaleReturnType,
  SaleReturnDetailType,
  InvoiceType,
  InvoiceDetailType,
} from "@/data_types/types";
import { getAllBranches } from "@/api/branch";
import { getAllCustomers } from "@/api/customer";
import { getInvoiceByid } from "@/api/invoice";
import { upsertSaleReturn, getSaleReturnById } from "@/api/saleReturn";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useAppContext } from "@/hooks/useAppContext";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import "./dateStyle.css";
import CustomerModal from "../customer/Modal";
import { upsertCustomerAction } from "@/utils/customerActions";
import { useQueryClient } from "@tanstack/react-query";
import { Undo2 } from "lucide-react";

type ReturnLineMap = Record<number, SaleReturnDetailType>;

const SaleReturn: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAppContext();

  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<BranchType[]>([]);
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetailType[]>([]);
  const [returnedSoFar, setReturnedSoFar] = useState<Record<number, number>>({});
  const [returnedGrandTotal, setReturnedGrandTotal] = useState(0);
  const [returnLines, setReturnLines] = useState<ReturnLineMap>({});
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InvoiceType>();

  const n = (v: any) => {
    const x = Number(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(x) ? x : 0;
  };

  const getLineQty = (item: Partial<InvoiceDetailType | SaleReturnDetailType>) => {
    return item.ItemType === "PRODUCT"
      ? n((item as any).unitQty ?? item.quantity)
      : n(item.quantity);
  };

  const calculateLineTotal = (detail: Partial<InvoiceDetailType>) => {
    const price = n((detail as any).price);
    const qty =
      detail.ItemType === "PRODUCT"
        ? n((detail as any).unitQty ?? detail.quantity)
        : n(detail.quantity);

    const discount = n((detail as any).discount);
    const taxRate = n((detail as any).taxNet);

    let priceAfterDiscount = price;

    if ((detail as any).discountMethod === "Percent") {
      priceAfterDiscount = price * (1 - discount / 100);
    } else if ((detail as any).discountMethod === "Fixed") {
      priceAfterDiscount = price - discount;
    }

    let unitTotal = priceAfterDiscount;

    if ((detail as any).taxMethod === "Exclude") {
      unitTotal = priceAfterDiscount + (priceAfterDiscount * taxRate) / 100;
    } else if ((detail as any).taxMethod === "Include") {
      unitTotal = priceAfterDiscount;
    }

    return unitTotal * qty;
  };

  const computeBaseQtyLocal = (
    detail: InvoiceDetailType,
    unitId: number | null,
    unitQty: number
  ) => {
    if (detail.ItemType !== "PRODUCT") return unitQty;

    const baseUnitId =
      n((detail as any)?.productvariants?.baseUnit?.id) ||
      n((detail as any)?.productvariants?.baseUnitId) ||
      n((detail as any)?.baseUnitId);

    if (!baseUnitId) return unitQty;
    if (!unitId || unitId === baseUnitId) return unitQty;

    const conversions =
      (detail as any)?.products?.unitConversions ||
      (detail as any)?.productvariants?.products?.unitConversions ||
      [];

    const conv = conversions.find(
      (c: any) =>
        n(c.fromUnitId) === n(unitId) &&
        n(c.toUnitId) === n(baseUnitId)
    );

    if (!conv) return unitQty;

    return unitQty * n(conv.multiplier);
  };

  const buildReturnLineFromInvoiceItem = (
    item: InvoiceDetailType,
    qty: number
  ): SaleReturnDetailType => {
    const isProduct = item.ItemType === "PRODUCT";

    const soldUnitId = isProduct
      ? n((item as any).unitId) ||
        n((item as any)?.productvariants?.baseUnit?.id) ||
        n((item as any)?.productvariants?.baseUnitId) ||
        null
      : null;

    const unitQty = isProduct ? qty : null;
    const baseQty = isProduct ? computeBaseQtyLocal(item, soldUnitId, qty) : null;

    return {
      id: 0,
      saleReturnId: 0,
      saleItemId: Number(item.id),

      productId: item.productId ?? undefined,
      productVariantId: item.productVariantId ?? undefined,
      serviceId: item.serviceId ?? undefined,

      ItemType: item.ItemType,
      quantity: qty,

      unitId: isProduct ? soldUnitId : null,
      unitQty: isProduct ? unitQty : null,
      baseQty: isProduct ? baseQty : null,

      price: n((item as any).price),
      taxNet: n((item as any).taxNet),
      taxMethod: (item as any).taxMethod ?? "Include",
      discount: n((item as any).discount),
      discountMethod: (item as any).discountMethod ?? "Fixed",

      total: calculateLineTotal({
        ...item,
        quantity: qty,
        unitQty: isProduct ? qty : null,
      }),

      products: item.products ?? null,
      productvariants: item.productvariants ?? null,
      services: item.services ?? null,
    };
  };

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    try {
      setBranches(await getAllBranches());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      setCustomers(await getAllCustomers());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const buildReturnedMapFromSaleReturns = (saleReturns: SaleReturnType[]) => {
    const returned: Record<number, number> = {};

    saleReturns.forEach((sr) => {
      (sr.items || []).forEach((item) => {
        const qty =
          item.ItemType === "PRODUCT"
            ? n(item.unitQty ?? item.quantity)
            : n(item.quantity);

        returned[item.saleItemId] = (returned[item.saleItemId] || 0) + qty;
      });
    });

    return returned;
  };

  const calculateReturnedGrandTotal = (saleReturns: SaleReturnType[]) => {
    return saleReturns.reduce((sum, sr) => {
      return sum + ((sr.items || []).reduce((itemSum, item) => itemSum + n(item.total), 0) || 0);
    }, 0);
  };

  const fetchInvoice = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);

    try {
      const invoiceData = await getInvoiceByid(Number(id));
      setInvoiceDetails(invoiceData.items || []);

      setValue("OrderSaleType", invoiceData.OrderSaleType);
      setValue("branchId", invoiceData.branchId);
      setValue("customerId", invoiceData.customerId);
      setValue("ref", invoiceData.ref);
      setValue(
        "orderDate",
        invoiceData.orderDate ? new Date(invoiceData.orderDate).toISOString() : null
      );
      setValue("taxRate", invoiceData.taxRate);
      setValue("shipping", invoiceData.shipping);
      setValue("discount", invoiceData.discount);
      setValue("status", invoiceData.status);
      setValue("note", invoiceData.note);

      const saleReturns = await getSaleReturnById(Number(id));
      if (saleReturns.length > 0) {
        setReturnedSoFar(buildReturnedMapFromSaleReturns(saleReturns));
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
  }, [fetchBranches, fetchCustomers, fetchInvoice]);

  useEffect(() => {
    if (!watch("OrderSaleType")) {
      setValue("OrderSaleType", "RETAIL");
    }
  }, [watch, setValue]);

  const returnGrandTotal = useMemo(() => {
    return Object.values(returnLines).reduce((acc, line) => acc + n(line.total), 0);
  }, [returnLines]);

  const totalReturnedAllTime = n(returnedGrandTotal) + n(returnGrandTotal);

  const increaseQuantity = (index: number) => {
    const item = invoiceDetails[index];
    const alreadyReturned = returnedSoFar[item.id] || 0;
    const currentLine = returnLines[item.id];
    const currentQty = currentLine ? getLineQty(currentLine) : 0;

    const soldQty = getLineQty(item);
    const maxAllowed = soldQty - alreadyReturned;

    if (currentQty >= maxAllowed) {
      toast.warn(`You can only return ${maxAllowed} unit(s)`);
      return;
    }

    const nextQty = currentQty + 1;
    const nextLine = buildReturnLineFromInvoiceItem(item, nextQty);

    setReturnLines((prev) => ({
      ...prev,
      [item.id]: nextLine,
    }));
  };

  const decreaseQuantity = (index: number) => {
    const item = invoiceDetails[index];
    const currentLine = returnLines[item.id];
    const currentQty = currentLine ? getLineQty(currentLine) : 0;

    if (currentQty <= 0) return;

    const nextQty = currentQty - 1;

    setReturnLines((prev) => {
      const clone = { ...prev };

      if (nextQty <= 0) {
        delete clone[item.id];
      } else {
        clone[item.id] = buildReturnLineFromInvoiceItem(item, nextQty);
      }

      return clone;
    });
  };

  const handleAddorEditCustomer = (payload: { data: CustomerType }) => {
    return upsertCustomerAction(
      payload,
      () => queryClient.invalidateQueries({ queryKey: ["validateToken"] }),
      fetchCustomers,
      () => setIsCustomerModalOpen(false)
    );
  };

  const onSubmit: SubmitHandler<InvoiceType> = async (formData) => {
    try {
      setIsLoading(true);

      const items = Object.values(returnLines).map((line) => ({
        id: 0,
        saleReturnId: 0,
        saleItemId: Number(line.saleItemId),

        // backend compatibility
        orderItemId: Number(line.saleItemId),

        productId: line.productId ?? undefined,
        productVariantId: line.productVariantId ?? undefined,
        serviceId: line.serviceId ?? undefined,

        ItemType: line.ItemType,
        quantity: Number(line.quantity) || 0,

        price: Number(line.price) || 0,
        taxNet: Number(line.taxNet) || 0,
        taxMethod: line.taxMethod ?? "Include",
        discount: Number(line.discount) || 0,
        discountMethod: line.discountMethod ?? "Fixed",
        total: Number(line.total) || 0,

        unitId: line.ItemType === "PRODUCT" ? (line.unitId ?? null) : null,
        unitQty: line.ItemType === "PRODUCT" ? (Number(line.unitQty) || 0) : null,
        baseQty: line.ItemType === "PRODUCT" ? (Number(line.baseQty) || 0) : null,

        products: line.products ?? null,
        productvariants: line.productvariants ?? null,
        services: line.services ?? null,
      }));

      if (items.length === 0) {
        toast.error("Please return at least one item");
        return;
      }

      const selectedCustomer =
        customers.find((c) => c.id === Number(formData.customerId)) || null;

      const selectedBranch =
        branches.find((b) => b.id === Number(formData.branchId)) || null;

      const payload: SaleReturnType = {
        orderId: Number(id),
        branchId: Number(formData.branchId),
        customerId: Number(formData.customerId),
        ref: watch("ref") || "",
        status: formData.status || "APPROVED",
        note: formData.note ?? "",
        taxRate: watch("taxRate") ?? null,
        taxNet: 0,
        shipping: watch("shipping") ?? null,
        discount: watch("discount") ?? null,
        totalAmount: returnGrandTotal,
        delReason: "",
        branch: selectedBranch,
        customer: selectedCustomer,
        customers: selectedCustomer,
        order: null,
        items: items as unknown as SaleReturnDetailType[],
      };

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
                  <label className="flex cursor-pointer items-center" style={{ marginRight: "20px" }}>
                    <input
                      className="form-radio"
                      type="radio"
                      checked={watch("OrderSaleType") === "RETAIL"}
                      readOnly
                    />
                    <span className="ml-2 text-white-dark">Retail Price</span>
                  </label>

                  <label className="flex cursor-pointer items-center">
                    <input
                      className="form-radio"
                      type="radio"
                      checked={watch("OrderSaleType") === "WHOLESALE"}
                      readOnly
                    />
                    <span className="ml-2 text-white-dark">Wholesale Price</span>
                  </label>
                </div>
              </div>

              <div
                className={`grid grid-cols-1 gap-4 ${
                  user?.roleType === "ADMIN" ? "sm:grid-cols-4" : "sm:grid-cols-3"
                } mb-5`}
              >
                {user?.roleType === "ADMIN" && (
                  <div>
                    <label>
                      Branch <span className="text-danger text-md">*</span>
                    </label>
                    <select
                      id="branch"
                      className="form-input"
                      disabled
                      {...register("branchId", { required: "Branch is required" })}
                    >
                      <option value="">Select a branch</option>
                      {branches.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    {errors.branchId && (
                      <span className="error_validate">{errors.branchId.message}</span>
                    )}
                  </div>
                )}

                <div>
                  <label>
                    Invoice No <span className="text-danger text-md">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    readOnly
                    {...register("ref", { required: "This invoice no is required" })}
                  />
                </div>

                <div>
                  <label>
                    Select a Date <span className="text-danger text-md">*</span>
                  </label>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Controller
                      name="orderDate"
                      control={control}
                      rules={{ required: "Order date is required" }}
                      render={({ field }) => (
                        <DatePicker
                          readOnly
                          value={field.value ? new Date(field.value as string) : null}
                          onChange={(date) => field.onChange(date)}
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
                  {errors.orderDate && (
                    <span className="error_validate">{errors.orderDate.message}</span>
                  )}
                </div>

                <div>
                  <label>Customer</label>
                  <div className="flex">
                    <select
                      disabled
                      className="form-input ltr:rounded-r-none rtl:rounded-l-none"
                      {...register("customerId")}
                    >
                      <option value="">Select a customer...</option>
                      {customers.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCustomerModalOpen(true)}
                      className="bg-secondary text-white flex justify-center items-center ltr:rounded-r-md rtl:rounded-l-md px-3 font-semibold border ltr:border-l-0 rtl:border-r-0 border-secondary"
                    >
                      <FontAwesomeIcon icon={faCirclePlus} />
                    </button>
                  </div>
                  {errors.customerId && (
                    <span className="error_validate">{errors.customerId.message}</span>
                  )}
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
                      const currentLine = returnLines[detail.id];
                      const currentReturn = currentLine ? getLineQty(currentLine) : 0;
                      const soldQty = getLineQty(detail);
                      const maxReturnable = soldQty - alreadyReturned;
                      const remaining = maxReturnable - currentReturn;

                      const rowSubtotal = currentLine ? n(currentLine.total) : 0;

                      const soldUnitName =
                        detail.ItemType === "PRODUCT"
                          ? (detail as any)?.unit?.name ||
                            (detail as any)?.productvariants?.baseUnit?.name ||
                            "Base"
                          : null;

                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>

                          <td>
                            <p>
                              {detail.ItemType === "PRODUCT"
                                ? detail.productvariants?.productType === "New"
                                  ? detail.products?.name
                                  : `${detail.products?.name} (${detail.productvariants?.productType})`
                                : detail.services?.name}
                            </p>
                            <p className="text-center">
                              <span className="badge badge-outline-primary rounded-full">
                                {detail.ItemType === "PRODUCT"
                                  ? detail.productvariants?.barcode
                                  : detail.services?.serviceCode}
                              </span>
                            </p>
                            {detail.ItemType === "PRODUCT" && (
                              <p className="text-xs text-gray-500 text-center mt-1">
                                Sold Unit: {soldUnitName}
                              </p>
                            )}
                          </td>

                          <td>
                            ${" "}
                            {(
                              detail.discountMethod === "Fixed"
                                ? n((detail as any).price) - n((detail as any).discount)
                                : n((detail as any).price) * ((100 - n((detail as any).discount)) / 100)
                            ).toFixed(2)}
                          </td>

                          <td>{soldQty}</td>

                          <td>
                            <div className="inline-flex" style={{ width: "40%" }}>
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

                            <p className="mt-1 text-xs text-gray-500">
                              Remaining: <span className="font-medium">{remaining}</span>
                            </p>

                            {detail.ItemType === "PRODUCT" && currentLine && (
                              <p className="mt-1 text-xs text-blue-600">
                                Base Qty Return: {n(currentLine.baseQty).toFixed(4)}
                              </p>
                            )}
                          </td>

                          <td>$ {n((detail as any).discount).toFixed(2)}</td>
                          <td>{n((detail as any).taxNet)}%</td>
                          <td>
                            $ {rowSubtotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot>
                    <tr>
                      <td colSpan={6}></td>
                      <td style={{ padding: "8px 5px" }}>
                        <b>Return Total</b>
                      </td>
                      <td>
                        <b>
                          $ {(totalReturnedAllTime || 0)
                            .toFixed(2)
                            .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                        </b>
                      </td>
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
                  <label>
                    Status <span className="text-danger">*</span>
                  </label>
                  <select
                    disabled
                    className="form-input"
                    {...register("status", { required: "Status is required" })}
                  >
                    <option value="">Select a status...</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  {errors.status && (
                    <span className="error_validate">{errors.status.message}</span>
                  )}
                </div>
              </div>

              <div className="mb-5">
                <label>Note</label>
                <textarea {...register("note")} className="form-input" rows={3}></textarea>
              </div>
            </div>

            <div className="flex justify-end items-center mt-8">
              <NavLink to="/sale" type="button" className="btn btn-outline-warning">
                <FontAwesomeIcon icon={faArrowLeft} className="mr-1" /> Go Back
              </NavLink>

              {hasPermission("Sale-Return") && (
                <button
                  type="submit"
                  className="btn btn-primary ltr:ml-4 rtl:mr-4"
                  disabled={isLoading}
                >
                  <FontAwesomeIcon icon={faSave} className="mr-1" />
                  {isLoading ? "Saving..." : "Save"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={handleAddorEditCustomer}
      />
    </>
  );
};

export default SaleReturn;