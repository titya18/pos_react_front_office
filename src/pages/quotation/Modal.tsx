import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faClose } from '@fortawesome/free-solid-svg-icons';
import { useForm } from "react-hook-form";
import { QuotationDetailType } from "@/data_types/types";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: QuotationDetailType) => Promise<void> | void;
    clickData?: { id: number | undefined } & Partial<QuotationDetailType> | null;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, clickData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<QuotationDetailType>();

    useEffect(() => {
        if (clickData?.cost) {
            setValue('ItemType', clickData.ItemType ?? "");
            setValue('cost', clickData.cost);
            setValue('quantity', clickData.quantity ?? 0);
            setValue('taxMethod', clickData.taxMethod ?? null);
            setValue('taxNet', clickData.taxNet ?? 0);
            setValue('discountMethod', clickData.discountMethod ?? null);
            setValue('discount', clickData.discount ?? 0);
        } else {
            reset()
        }
    }, [clickData, setValue, reset])

    const handleFormSubmit = async (data: QuotationDetailType) => {
        setIsLoading(true);
        try {
            const payload: QuotationDetailType = {
                id: clickData?.id ?? 0,
                quotationId: clickData?.quotationId ?? 0,
                productId: clickData?.productId ?? 0,
                productVariantId: clickData?.productVariantId ?? 0,
                serviceId: clickData?.serviceId ?? 0,
                ItemType: clickData?.ItemType ?? "",
                quantity: Number(data.quantity) || 0,
                cost: Number(data.cost) || 0,
                taxNet: Number(data.taxNet) || 0,
                taxMethod: (data.taxMethod as string) ?? null,
                discount: Number(data.discount) || 0,
                discountMethod: (data.discountMethod as string) ?? null,
                total: clickData?.total ?? (Number(data.quantity) || 0) * (Number(data.cost) || 0),
                products: clickData?.products ?? null,
                productvariants: clickData?.productvariants ?? null,
                services: clickData?.services ?? null,
                stocks: clickData?.stocks ?? 0,
            };

            await onSubmit(payload);
            reset();
            onClose(); 
        } catch (error) {
            console.log("Error submitting from:", error);
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
                            {
                                clickData?.ItemType === "PRODUCT"
                                    ? clickData?.products?.name+' - '+clickData?.productvariants?.name
                                    : clickData?.services?.name
                            }
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
                            <div className={"grid grid-cols-1 gap-4 mb-5" + (clickData?.ItemType === "PRODUCT" ? " sm:grid-cols-3" : " sm:grid-cols-2")}>
                                <div>
                                    <label htmlFor="module">
                                        {
                                            clickData?.ItemType === "PRODUCT"
                                                ? "Product Cost"
                                                : "Service Cost"
                                        } 
                                        <sup>*</sup>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Enter Product's cost"
                                        className="form-input w-full"
                                        {...register("cost", {
                                            required: "Product's cost is required",
                                        })}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                            const target = e.currentTarget;

                                            // Allow numbers + decimal
                                            target.value = target.value.replace(/[^0-9.]/g, "");

                                            // Prevent multiple dots
                                            const parts = target.value.split(".");
                                            if (parts.length > 2) {
                                                target.value = parts[0] + "." + parts.slice(1).join("");
                                            }
                                        }}
                                    />
                                    {errors.cost && <p className='error_validate'>{errors.cost.message}</p>}
                                </div>

                                <div>
                                    <label htmlFor="module">Quantity <sup className="text-danger text-md">*</sup></label>
                                    <input
                                        type="text"
                                        placeholder="Enter quantity"
                                        className="form-input w-full"
                                        {...register("quantity", {
                                            required: "Quantity is required",
                                        })}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                            const target = e.currentTarget;

                                            // Allow numbers + decimal
                                            target.value = target.value.replace(/[^0-9.]/g, "");

                                            // Prevent multiple dots
                                            const parts = target.value.split(".");
                                            if (parts.length > 2) {
                                                target.value = parts[0] + "." + parts.slice(1).join("");
                                            }
                                        }}
                                    />
                                    {errors.quantity && <p className='error_validate'>{errors.quantity.message}</p>}
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
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="module">Tax Type</label>
                                    <select 
                                        id="taxMethod" className="form-input" 
                                        {...register("taxMethod")} 
                                    >
                                        <option value="Include">Include</option>
                                        <option value="Exclude">Exclude</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="module">Order Tax</label>
                                    <input
                                        type="text"
                                        placeholder="0"
                                        className="form-input w-full"
                                        {...register("taxNet")}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                            const target = e.currentTarget;

                                            // Allow numbers + decimal
                                            target.value = target.value.replace(/[^0-9.]/g, "");

                                            // Prevent multiple dots
                                            const parts = target.value.split(".");
                                            if (parts.length > 2) {
                                                target.value = parts[0] + "." + parts.slice(1).join("");
                                            }
                                        }}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="module">Discount Type</label>
                                    <select 
                                        id="discountMethod" className="form-input" 
                                        {...register("discountMethod")} 
                                    >
                                        <option value="Fixed">Fixed</option>
                                        <option value="Percent">%</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="module">Discount</label>
                                    <input
                                        type="text"
                                        placeholder="0"
                                        className="form-input w-full"
                                        {...register("discount")}
                                        onInput={(e: React.FormEvent<HTMLInputElement>) => {
                                            const target = e.currentTarget;

                                            // Allow numbers + decimal
                                            target.value = target.value.replace(/[^0-9.]/g, "");

                                            // Prevent multiple dots
                                            const parts = target.value.split(".");
                                            if (parts.length > 2) {
                                                target.value = parts[0] + "." + parts.slice(1).join("");
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            
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