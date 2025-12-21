import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faClose } from '@fortawesome/free-solid-svg-icons';
import { useForm } from "react-hook-form";
import { InvoiceDetailType } from "@/data_types/types";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payload: InvoiceDetailType) => Promise<void> | void;
    clickData?: { id: number | undefined } & Partial<InvoiceDetailType> | null;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, clickData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<InvoiceDetailType>();

    useEffect(() => {
        if (clickData?.price) {
            setValue('ItemType', clickData.ItemType ?? "");
            setValue('price', clickData.price);
            setValue('quantity', clickData.quantity ?? 0);
            setValue('taxMethod', clickData.taxMethod ?? null);
            setValue('taxNet', clickData.taxNet ?? 0);
            setValue('discountMethod', clickData.discountMethod ?? null);
            setValue('discount', clickData.discount ?? 0);
        } else {
            reset()
        }
    }, [clickData, setValue, reset])

    const handleFormSubmit = async (data: InvoiceDetailType) => {
        setIsLoading(true);
        try {
            const payload: InvoiceDetailType = {
                id: clickData?.id ?? 0,
                orderId: clickData?.orderId ?? 0,
                productId: clickData?.productId ?? 0,
                productVariantId: clickData?.productVariantId ?? 0,
                serviceId: clickData?.serviceId ?? 0,
                ItemType: clickData?.ItemType ?? "",
                quantity: Number(data.quantity) || 0,
                price: Number(data.price) || 0,
                taxNet: Number(data.taxNet) || 0,
                taxMethod: (data.taxMethod as string) ?? null,
                discount: Number(data.discount) || 0,
                discountMethod: (data.discountMethod as string) ?? null,
                total: clickData?.total ?? (Number(data.quantity) || 0) * (Number(data.price) || 0),
                products: clickData?.products ?? null,
                productvariants: clickData?.productvariants ?? null,
                services: clickData?.services ?? null
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
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
                                <div>
                                    <label htmlFor="module">
                                        {
                                            clickData?.ItemType === "PRODUCT"
                                                ? "Product Cost"
                                                : "Service Cose"
                                        } 
                                        <sup>*</sup>
                                    </label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter product cost" 
                                        autoFocus
                                        className="form-input"
                                        {...register("price", { required: "This field is required" })} 
                                    />
                                    {errors.price && <p className='error_validate'>{errors.price.message}</p>}
                                </div>

                                <div>
                                    <label htmlFor="module">Quantity <sup>*</sup></label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter quantity" 
                                        className="form-input"
                                        {...register("quantity", { required: "This field is required" })} 
                                    />
                                    {errors.quantity && <p className='error_validate'>{errors.quantity.message}</p>}
                                </div>

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
                                        className="form-input"
                                        placeholder="0" 
                                        {...register("taxNet")}
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
                                        className="form-input" 
                                        {...register("discount")}
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