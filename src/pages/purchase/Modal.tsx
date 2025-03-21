import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faClose } from '@fortawesome/free-solid-svg-icons';
import { useForm } from "react-hook-form";

interface Product {
    id: number;
    name: string;
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (
        id: number | null,
        productId: number | null,
        productVariantId: number | null,
        name: string | null,
        code: string | null,
        products: Product | null,
        quantity: number,
        cost: number,
        taxNet: number,
        taxMethod: string | null,
        discount: number,
        discountMethod: string | null,
        total: number | null,
    ) => void;
    clickData?: {
        id: number | undefined,
        productId: number | null,
        productVariantId: number | null,
        name: string | null,
        code: string | null,
        products: Product | null,
        quantity: number,
        cost: number,
        taxNet: number,
        taxMethod: string | null,
        discount: number,
        discountMethod: string | null,
        total: number | null,
    } | null;
};

export interface FormData {
    quantity: number;
    cost: number;
    taxNet: number;
    taxMethod: string | null;
    discount: number;
    discountMethod: string | null;
    total: number;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, clickData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>();

    useEffect(() => {
        if (clickData?.cost) {
            setValue('cost', clickData.cost);
            setValue('quantity', clickData.quantity);
            setValue('taxMethod', clickData.taxMethod);
            setValue('taxNet', clickData.taxNet);
            setValue('discountMethod', clickData.discountMethod);
            setValue('discount', clickData.discount);
        } else {
            reset()
        }
    }, [clickData, setValue, reset])

    const handleFormSubmit = async (data: FormData) => {
        setIsLoading(true);
        try {
            await onSubmit(
                clickData?.id ?? 0, // Default to 0 or another fallback value
                clickData?.productId ?? 0,
                clickData?.productVariantId ?? 0,
                clickData?.name ?? "",
                clickData?.code ?? "",
                clickData?.products ?? null,
                data.quantity,
                data.cost,
                data.taxNet,
                data.taxMethod ?? null,
                data.discount,
                data.discountMethod ?? null,
                clickData?.total ?? 0
            );
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
                        <h5 className="font-bold text-lg">{ clickData?.products?.name+' - '+clickData?.name }</h5>
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
                                    <label htmlFor="module">Product Cost <sup>*</sup></label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter product cost" 
                                        autoFocus
                                        className="form-input"
                                        {...register("cost", { required: "This field is required" })} 
                                    />
                                    {errors.cost && <p className='error_validate'>{errors.cost.message}</p>}
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