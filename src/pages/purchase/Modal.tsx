import React, { useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faClose } from "@fortawesome/free-solid-svg-icons";
import { useForm } from "react-hook-form";
import { PurchaseDetailType } from "@/data_types/types";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: PurchaseDetailType) => Promise<void> | void;
  clickData?: ({ id: number | undefined } & Partial<PurchaseDetailType>) | null;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  clickData,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const prevUnitIdRef = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseDetailType>();

  const baseUnit =
    (clickData as any)?.productvariants?.baseUnit || null;

  const baseUnitId = baseUnit?.id ?? null;
  const baseUnitName = baseUnit?.name ?? "Base";

  const unitOptions = useMemo(() => {
    return Array.isArray((clickData as any)?.productvariants?.unitOptions)
      ? (clickData as any).productvariants.unitOptions.map((u: any) => ({
          id: Number(u.unitId),
          name: u.unitName,
          operationValue: Number(u.operationValue ?? 1),
          suggestedPurchaseCost: Number(u.suggestedPurchaseCost ?? 0),
          isBaseUnit: !!u.isBaseUnit,
        }))
      : [];
  }, [clickData]);

  const getSelectedUnit = (unitId: number) => {
    return unitOptions.find((u: any) => Number(u.id) === Number(unitId));
  };

  const computeBaseQtyLocal = (unitId: number, unitQty: number) => {
    const selectedUnit = getSelectedUnit(unitId);
    const operationValue = Number(selectedUnit?.operationValue ?? 1);
    return Number(unitQty || 0) * operationValue;
  };

  const computeCostPerBaseUnitLocal = (unitId: number, cost: number) => {
    const selectedUnit = getSelectedUnit(unitId);
    const operationValue = Number(selectedUnit?.operationValue ?? 1);
    return operationValue > 0 ? Number(cost || 0) / operationValue : 0;
  };

  useEffect(() => {
    if (!isOpen) return;

    const initialUnitId = Number(
      (clickData as any)?.unitId ??
      (clickData as any)?.productvariants?.defaultPurchaseUnitId ??
      (clickData as any)?.productvariants?.purchasePriceUnitId ??
      baseUnitId ??
      unitOptions?.[0]?.id ??
      0
    );

    reset({
      unitId: initialUnitId,
      unitQty: Number(
        (clickData as any)?.unitQty ??
        clickData?.quantity ??
        1
      ) || 1,
      cost: Number(
        clickData?.cost ??
        getSelectedUnit(initialUnitId)?.suggestedPurchaseCost ??
        0
      ),
      taxMethod: clickData?.taxMethod ?? "Include",
      taxNet: Number(clickData?.taxNet ?? 0),
      discountMethod: clickData?.discountMethod ?? "Fixed",
      discount: Number(clickData?.discount ?? 0),
    });

    prevUnitIdRef.current = initialUnitId;
  }, [isOpen, clickData, reset, baseUnitId, unitOptions]);

  const wUnitId = Number(watch("unitId") || 0);
  const wUnitQty = Number(watch("unitQty") || 0);
  const wCost = Number(watch("cost") || 0);
  const wTaxNet = Number(watch("taxNet") || 0);
  const wDiscount = Number(watch("discount") || 0);
  const wTaxMethod = watch("taxMethod") || "Include";
  const wDiscountMethod = watch("discountMethod") || "Fixed";

  useEffect(() => {
    if (!isOpen) return;
    if (!wUnitId) return;

    if (prevUnitIdRef.current !== null && prevUnitIdRef.current !== wUnitId) {
      const selectedUnit = getSelectedUnit(wUnitId);
      if (selectedUnit) {
        setValue("cost", Number(selectedUnit.suggestedPurchaseCost ?? 0));
      }
    }

    prevUnitIdRef.current = wUnitId;
  }, [wUnitId, isOpen, setValue]);

  const selectedUnit = getSelectedUnit(wUnitId);
  const selectedUnitName = selectedUnit?.name || "-";

  const baseQtyPreview = computeBaseQtyLocal(wUnitId, wUnitQty);
  const costPerBaseUnitPreview = computeCostPerBaseUnitLocal(wUnitId, wCost);

  const lineTotalPreview = (() => {
    let priceAfterDiscount = wCost;

    if (wDiscountMethod === "Percent") {
      priceAfterDiscount = wCost * (1 - wDiscount / 100);
    } else {
      priceAfterDiscount = wCost - wDiscount;
    }

    let unitTotal = priceAfterDiscount;

    if (wTaxMethod === "Exclude") {
      unitTotal = priceAfterDiscount + (priceAfterDiscount * wTaxNet / 100);
    }

    if (wTaxMethod === "Include") {
      unitTotal = priceAfterDiscount;
    }

    return unitTotal * wUnitQty;
  })();

  const handleFormSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      const unitId = Number(data.unitId);
      const unitQty = Number(data.unitQty);
      const cost = Number(data.cost) || 0;

      const baseQty = computeBaseQtyLocal(unitId, unitQty);
      const costPerBaseUnit = computeCostPerBaseUnitLocal(unitId, cost);

      const payload: PurchaseDetailType = {
        id: clickData?.id ?? 0,
        productId: (clickData as any)?.productId ?? 0,
        productVariantId: (clickData as any)?.productVariantId ?? 0,

        unitId,
        unitQty,
        baseQty,

        quantity: unitQty,

        cost,
        costPerBaseUnit,
        taxNet: Number(data.taxNet) || 0,
        taxMethod: data.taxMethod ?? "Include",
        discount: Number(data.discount) || 0,
        discountMethod: data.discountMethod ?? "Fixed",
        total: lineTotalPreview,

        products: (clickData as any)?.products ?? null,
        productvariants: (clickData as any)?.productvariants ?? null,
        stocks: (clickData as any)?.stocks ?? 0,
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
            <div>
              <h5 className="font-bold text-lg">
                {(clickData as any)?.products?.name}
              </h5>
              <p className="text-xs text-gray-500 mt-1">
                Base Unit: {baseUnitName}
              </p>
            </div>
            <button type="button" onClick={onClose}>✕</button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="p-5">
              <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                Enter the cost for <strong>1 selected purchase unit</strong>.  
                The system will auto-convert quantity and cost into base unit for stock and FIFO.
              </div>

              <div className="grid grid-cols-1 gap-4 mb-5 sm:grid-cols-2">
                <div>
                  <label>
                    Purchase Cost per Selected Unit <span className="text-danger text-md">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input w-full"
                    {...register("cost", { required: "Cost is required" })}
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                      const target = e.currentTarget;
                      target.value = target.value.replace(/[^0-9.]/g, "");
                      const parts = target.value.split(".");
                      if (parts.length > 2) {
                        target.value = parts[0] + "." + parts.slice(1).join("");
                      }
                    }}
                  />
                  {errors.cost && (
                    <p className="error_validate">{String(errors.cost.message)}</p>
                  )}
                </div>

                <div>
                  <label>Stock On Hand</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    disabled
                    value={`${Number(clickData?.stocks ?? 0).toFixed(4)} ${baseUnitName}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5">
                <div>
                  <label>
                    Purchase Unit <span className="text-danger text-md">*</span>
                  </label>
                  <select
                    className="form-input"
                    {...register("unitId", { required: true, valueAsNumber: true })}
                  >
                    {unitOptions.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>
                    Quantity <span className="text-danger text-md">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    {...register("unitQty", { required: true, valueAsNumber: true })}
                  />
                </div>

                <div>
                  <label>Base Qty ({baseUnitName})</label>
                  <input
                    className="form-input"
                    disabled
                    value={Number(baseQtyPreview).toFixed(4)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
                <div className="rounded-md border border-gray-200 p-3 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-700">Selected Unit</p>
                  <p className="text-lg font-bold text-primary mt-1">{selectedUnitName}</p>
                </div>

                <div className="rounded-md border border-gray-200 p-3 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-700">
                    Cost per Base Unit ({baseUnitName})
                  </p>
                  <p className="text-lg font-bold text-success mt-1">
                    {Number(costPerBaseUnitPreview).toFixed(6)}
                  </p>
                </div>
              </div>

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
                      if (parts.length > 2) {
                        target.value = parts[0] + "." + parts.slice(1).join("");
                      }
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
                      if (parts.length > 2) {
                        target.value = parts[0] + "." + parts.slice(1).join("");
                      }
                    }}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
                Line Total Preview: <strong>${Number(lineTotalPreview).toFixed(2)}</strong>
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