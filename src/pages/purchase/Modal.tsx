import React, { useEffect, useMemo, useState } from "react";
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PurchaseDetailType>();

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

  /* ============================= */
  /*  Reset When Modal Opens       */
  /* ============================= */

  useEffect(() => {
    if (!isOpen) return;

    if (clickData) {
      reset({
        unitId:
          (clickData as any)?.unitId ??
          baseUnitId ??
          unitOptions?.[0]?.id ??
          null,

        unitQty:
          Number(
            (clickData as any)?.unitQty ??
              clickData.quantity ??
              1
          ) || 1,

        cost: Number(clickData.cost ?? 0),
        taxMethod: clickData.taxMethod ?? "Include",
        taxNet: Number(clickData.taxNet ?? 0),
        discountMethod:
          clickData.discountMethod ?? "Fixed",
        discount: Number(clickData.discount ?? 0),
      });
    } else {
      reset({
        unitId: baseUnitId ?? null,
        unitQty: 1,
        cost: 0,
        taxMethod: "Include",
        taxNet: 0,
        discountMethod: "Fixed",
        discount: 0,
      });
    }
  }, [isOpen, clickData?.id]);

  /* ============================= */
  /*  Submit                       */
  /* ============================= */

  const handleFormSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      const unitId = Number(data.unitId);
      const unitQty = Number(data.unitQty);
      const baseQty = computeBaseQtyLocal(
        unitId,
        unitQty
      );
      const cost = Number(data.cost) || 0
      const costPerBaseUnit = baseQty > 0 ? cost / baseQty : 0

      const payload: PurchaseDetailType = {
        id: clickData?.id ?? 0,
        productId: (clickData as any)?.productId ?? 0,
        productVariantId:
          (clickData as any)?.productVariantId ?? 0,

        unitId,
        unitQty,
        baseQty,

        quantity: unitQty,

        cost,
        costPerBaseUnit,
        taxNet: Number(data.taxNet) || 0,
        taxMethod: data.taxMethod ?? "Include",
        discount: Number(data.discount) || 0,
        discountMethod:
          data.discountMethod ?? "Fixed",
        total: unitQty * Number(data.cost || 0),

        products:
          (clickData as any)?.products ?? null,
        productvariants:
          (clickData as any)?.productvariants ??
          null,
        stocks: (clickData as any)?.stocks ?? 0,
      };
      console.log("From Modal: ", payload);

      await onSubmit(payload);
      reset();
      onClose();
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const wUnitId = Number(watch("unitId") || 0);
  const wUnitQty = Number(watch("unitQty") || 0);

  const baseQtyPreview = computeBaseQtyLocal(
    wUnitId,
    wUnitQty
  );

  return (
    <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8">

          <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
            <h5 className="font-bold text-lg">
              {(clickData as any)?.products?.name} 
              {/* -{" "} */}
              {/* {(clickData as any)?.productvariants?.name} */}
            </h5>
            <button
              type="button"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="p-5">

              <div className="grid grid-cols-1 gap-4 mb-5 sm:grid-cols-2">
                <div>
                  <label>
                    Product Cost <span className="text-danger text-md">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input w-full"
                    {...register("cost", { required: "Cost is required" })}
                    onInput={(e: React.FormEvent<HTMLInputElement>) => {
                      const target = e.currentTarget;
                      target.value = target.value.replace(/[^0-9.]/g, "");
                      const parts = target.value.split(".");
                      if (parts.length > 2) target.value = parts[0] + "." + parts.slice(1).join("");
                    }}
                  />
                  {errors.cost && <p className="error_validate">{String(errors.cost.message)}</p>}
                </div>

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
              </div>

              {/* Unit + Qty */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5">
                <div>
                  <label>Unit <span className="text-danger text-md">*</span></label>
                  <select
                    className="form-input"
                    {...register("unitId", {
                      required: true,
                    })}
                  >
                    {unitOptions.map((u: any) => (
                      <option
                        key={u.id}
                        value={u.id}
                      >
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Quantity <span className="text-danger text-md">*</span></label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    {...register("unitQty", {
                      required: true,
                    })}
                  />
                </div>

                <div>
                  <label>
                    Base Qty ({baseUnitName || "Base"})
                  </label>
                  <input
                    className="form-input"
                    disabled
                    value={baseQtyPreview.toFixed(4)}
                  />
                </div>
              </div>

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

              {/* Buttons */}
              <div className="flex justify-end items-center mt-8">
                  <button type="button" className="btn btn-outline-danger" onClick={onClose}>
                      <FontAwesomeIcon icon={faClose} className='mr-1' />
                      Discard
                  </button>
                  <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4">
                      <FontAwesomeIcon icon={faSave} className='mr-1' />
                      {isLoading ? 'Saving...' : 'Save'}
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