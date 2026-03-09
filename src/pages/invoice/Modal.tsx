import React, { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faClose } from '@fortawesome/free-solid-svg-icons';
import { useForm } from "react-hook-form";
import { InvoiceDetailType } from "@/data_types/types";

type UnitOption = { id: number; name: string };

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: InvoiceDetailType) => Promise<void> | void;
  clickData?: Partial<InvoiceDetailType> | null;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, clickData }) => {
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Use a form type that includes unitId/unitQty even if QuotationDetailType doesn't strongly type them as numbers
  const { register, handleSubmit, setValue, reset, watch, formState: { errors } } =
    useForm<InvoiceDetailType>();

  const isProduct = clickData?.ItemType === "PRODUCT";

  /* ============================= */
  /*  Extract base + conversions   */
  /* ============================= */

  const conversions =
    (clickData as any)?.products?.unitConversions || [];

  const baseUnit =
    (clickData as any)?.productvariants?.baseUnit || null;

  const baseUnitId = baseUnit?.id;
  const baseUnitName = baseUnit?.name;

  /* ============================= */
  /*  Build Unit Options           */
  /* ============================= */

  const unitOptions = useMemo(() => {
    if (!clickData) return [];

    const base = baseUnit
      ? [{ id: baseUnit.id, name: baseUnit.name }]
      : [];

    const fromUnits = conversions.map((c: any) => ({
      id: c.fromUnit.id,
      name: c.fromUnit.name,
    }));

    const merged = [...base, ...fromUnits];

    // remove duplicates
    return merged.filter(
      (v, i, arr) =>
        arr.findIndex((x) => x.id === v.id) === i
    );
  }, [clickData]);

  /* ============================= */
  /*  Compute Base Quantity        */
  /* ============================= */

  const computeBaseQtyLocal = (
    unitId: number,
    unitQty: number
  ) => {
    if (!baseUnitId) return unitQty;
    if (unitId === baseUnitId) return unitQty;

    const conv = conversions.find(
      (c: any) =>
        c.fromUnitId === unitId &&
        c.toUnitId === baseUnitId
    );

    if (!conv) return unitQty;

    return unitQty * Number(conv.multiplier);
  };

  // ----------------------------
  // ✅ Prefill when open
  // ----------------------------
  useEffect(() => {
    if (!clickData) {
      reset();
      return;
    }

    // Always set common fields
    setValue("ItemType", clickData.ItemType ?? "PRODUCT");
    setValue("price", Number(clickData.price ?? 0));
    setValue("taxMethod", (clickData.taxMethod as any) ?? "Include");
    setValue("taxNet", Number(clickData.taxNet ?? 0));
    setValue("discountMethod", (clickData.discountMethod as any) ?? "Fixed");
    setValue("discount", Number(clickData.discount ?? 0));

    if (clickData.ItemType === "PRODUCT") {
      const defaultUnitId =
        (clickData as any)?.unitId ??
        unitOptions?.[0]?.id ??
        (clickData as any)?.productvariants?.baseUnitId ??
        null;

      setValue("unitId", defaultUnitId as any);
      setValue("unitQty", Number((clickData as any)?.unitQty ?? clickData.quantity ?? 1) as any);

      // keep quantity in sync for your existing total logic
      setValue("quantity", Number((clickData as any)?.unitQty ?? clickData.quantity ?? 1) as any);
    } else {
      setValue("quantity", Number(clickData.quantity ?? 1));
    }
  }, [clickData, reset, setValue, unitOptions]);

  // ----------------------------
  // ✅ Base qty preview compute
  // ----------------------------
  const selectedUnitId = Number(watch("unitId") ?? 0);
  const unitQtyValue = Number((watch("unitQty") as any) ?? watch("quantity") ?? 0);

  const baseQtyPreview = useMemo(() => {
    if (!isProduct) return 0;

    const baseUnitId = Number((clickData as any)?.productvariants?.baseUnitId ?? 0);
    if (!baseUnitId) return unitQtyValue;

    if (!selectedUnitId || selectedUnitId === baseUnitId) return unitQtyValue;

    const conversions =
      (clickData as any)?.products?.unitConversions ||
      (clickData as any)?.productvariants?.products?.unitConversions ||
      [];

    // find from selected -> base
    const conv = conversions.find(
      (c: any) => Number(c.fromUnitId) === selectedUnitId && Number(c.toUnitId) === baseUnitId
    );

    if (!conv) return unitQtyValue; // fallback
    return unitQtyValue * Number(conv.multiplier ?? 1);
  }, [clickData, isProduct, selectedUnitId, unitQtyValue]);

  // ----------------------------
  // ✅ Submit
  // ----------------------------
  const n = (v: any) => {
    const x = Number(String(v ?? "").replace(/,/g, ""));
    return Number.isFinite(x) ? x : 0;
  };

  const calculateTotal = (detail: Partial<InvoiceDetailType>) => {
    const cost = n(detail.price);
    const qty = n((detail as any).unitQty ?? detail.quantity);

    const discount = n(detail.discount);
    const taxRate = n(detail.taxNet);

    let priceAfterDiscount = cost;

    if (detail.discountMethod === "Percent") {
        priceAfterDiscount = cost * (1 - discount / 100);
    } else {
        priceAfterDiscount = cost - discount;
    }

    let unitTotal = priceAfterDiscount;

    if (detail.taxMethod === "Exclude") {
        unitTotal = priceAfterDiscount + (priceAfterDiscount * taxRate) / 100;
    } else if (detail.taxMethod === "Include") {
        unitTotal = priceAfterDiscount; // tax included already
    }

    return unitTotal * qty;
  };

  const handleFormSubmit = async (data: InvoiceDetailType) => {
    setIsLoading(true);
    try {
        const isProduct = clickData?.ItemType === "PRODUCT";

        const price = n(data.price);
        const taxNet = n(data.taxNet);
        const discount = n(data.discount);

        // ✅ SERVICE qty uses quantity
        const serviceQty = n(data.quantity) || 1;

        // ✅ PRODUCT qty uses unitQty
        const unitId = isProduct ? n((data as any).unitId) : null;
        const unitQty = isProduct ? (n((data as any).unitQty) || 1) : null;

        const baseQty = isProduct && unitId
        ? computeBaseQtyLocal(unitId, unitQty ?? 1)
        : null;

        const costPerBaseUnit =
        isProduct && baseQty && baseQty > 0 ? price / baseQty : 0;

        // ✅ IMPORTANT: compute total HERE
        const total = calculateTotal({
        price,
        quantity: isProduct ? (unitQty ?? 1) : serviceQty,
        ...(isProduct ? { unitQty: unitQty ?? 1 } : {}),
        taxNet,
        taxMethod: (data.taxMethod as any) ?? "Include",
        discount,
        discountMethod: (data.discountMethod as any) ?? "Fixed",
        });

        const payload: InvoiceDetailType = {
        id: clickData?.id ?? 0,
        orderId: clickData?.orderId ?? 0,

        productId: isProduct ? (clickData?.productId ?? 0) : 0,
        productVariantId: isProduct ? (clickData?.productVariantId ?? 0) : 0,
        serviceId: !isProduct ? (clickData?.serviceId ?? 0) : 0,

        ItemType: clickData?.ItemType ?? "PRODUCT",

        // ✅ PRODUCT only
        unitId: isProduct ? unitId : null,
        unitQty: isProduct ? unitQty : null,
        baseQty: isProduct ? baseQty : null,

        // ✅ quantity always valid
        quantity: isProduct ? (unitQty ?? 1) : serviceQty,

        price,
        costPerBaseUnit: isProduct ? costPerBaseUnit : 0,

        taxNet,
        taxMethod: (data.taxMethod as any) ?? "Include",

        discount,
        discountMethod: (data.discountMethod as any) ?? "Fixed",

        total, // ✅ no more clickData.total

        products: clickData?.products ?? null,
        productvariants: clickData?.productvariants ?? null,
        services: clickData?.services ?? null,
        stocks: clickData?.stocks ?? 0,
        };

        await onSubmit(payload);
        reset();
        onClose();
    } finally {
        setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8">
          <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
            <h5 className="font-bold text-lg">
              {clickData?.ItemType === "PRODUCT"
                ? `${clickData?.products?.name ?? ""}`
                : clickData?.services?.name}
            </h5>
            <button type="button" className="text-white-dark hover:text-dark" onClick={onClose}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="p-5">
              {/* Cost */}
              <div className={"grid grid-cols-1 gap-4 mb-5" + (isProduct ? " sm:grid-cols-2" : " sm:grid-cols-2")}>
                <div>
                  <label>
                    {isProduct ? "Product Cost" : "Service Cost"} <span className="text-danger text-md">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input w-full"
                    {...register("price", { required: "Cost is required" })}
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                      const target = e.currentTarget;
                      target.value = target.value.replace(/[^0-9.]/g, "");
                      const parts = target.value.split(".");
                      if (parts.length > 2) target.value = parts[0] + "." + parts.slice(1).join("");
                    }}
                  />
                  {errors.price && <p className="error_validate">{String(errors.price.message)}</p>}
                </div>

                {clickData?.ItemType === "PRODUCT" &&
                    <div>
                        <label htmlFor="module">Stock On Hand</label>
                        <input
                            type="text"
                            placeholder="Enter quantity"
                            className="form-input w-full"
                            disabled
                            value={clickData?.stocks ?? 0}
                        />
                    </div>
                }

                {/* SERVICE qty */}
                {!isProduct && (
                  <div>
                    <label>Quantity <sup className="text-danger">*</sup></label>
                    <input
                      type="text"
                      className="form-input w-full"
                      {...register("quantity", { required: "Quantity is required" })}
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const target = e.currentTarget;
                        target.value = target.value.replace(/[^0-9.]/g, "");
                        const parts = target.value.split(".");
                        if (parts.length > 2) target.value = parts[0] + "." + parts.slice(1).join("");
                      }}
                    />
                    {errors.quantity && <p className="error_validate">{String(errors.quantity.message)}</p>}
                  </div>
                )}
              </div>

              {/* ✅ PRODUCT: Unit + Qty + Base Qty preview (your requested layout) */}
              {isProduct && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5">
                  <div>
                    <label>Unit <span className="text-danger text-md">*</span></label>
                    <select className="form-input" {...register("unitId", { required: "Unit is required" })}>
                      {unitOptions.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    {errors.unitId && <p className="error_validate">{String((errors as any).unitId?.message)}</p>}
                  </div>

                  <div>
                    <label>Quantity <span className="text-danger text-md">*</span></label>
                    <input
                      type="number"
                      step="0.0001"
                      className="form-input"
                      {...register("unitQty", { required: "Qty is required" } as any)}
                    />
                    {errors.unitQty && <p className="error_validate">{String((errors as any).unitQty?.message)}</p>}
                  </div>

                  <div>
                    <label>Base Qty ({baseUnitName || "Base"})</label>
                    <input className="form-input" disabled value={Number(baseQtyPreview).toFixed(4)} />
                  </div>
                </div>
              )}

              {/* Tax + Discount */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label>Tax Type</label>
                  <select className="form-input" {...register("taxMethod")}>
                    <option value="Include">Include</option>
                    <option value="Exclude">Exclude</option>
                  </select>
                </div>

                <div>
                  <label>Order Tax</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    {...register("taxNet")}
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                      const target = e.currentTarget;
                      target.value = target.value.replace(/[^0-9.]/g, "");
                      const parts = target.value.split(".");
                      if (parts.length > 2) target.value = parts[0] + "." + parts.slice(1).join("");
                    }}
                  />
                </div>

                <div>
                  <label>Discount Type</label>
                  <select className="form-input" {...register("discountMethod")}>
                    <option value="Fixed">Fixed</option>
                    <option value="Percent">%</option>
                  </select>
                </div>

                <div>
                  <label>Discount</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    {...register("discount")}
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                      const target = e.currentTarget;
                      target.value = target.value.replace(/[^0-9.]/g, "");
                      const parts = target.value.split(".");
                      if (parts.length > 2) target.value = parts[0] + "." + parts.slice(1).join("");
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end items-center mt-8">
                <button type="button" className="btn btn-outline-danger" onClick={onClose}>
                  <FontAwesomeIcon icon={faClose} className="mr-1" />
                  Discard
                </button>
                <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={isLoading}>
                  <FontAwesomeIcon icon={faSave} className="mr-1" />
                  {isLoading ? "Saving..." : "Save"}
                </button>
              </div>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Modal;