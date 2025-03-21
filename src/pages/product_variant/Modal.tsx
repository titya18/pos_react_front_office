import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faClose } from '@fortawesome/free-solid-svg-icons';
import { useAppContext } from "../../hooks/useAppContext";
import { useForm } from "react-hook-form";
import { getAllUnits } from "../../api/unit";
import { FileRejection, useDropzone } from "react-dropzone";
import { useParams } from "react-router-dom";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number | null, productId: number | null, unitId: number | null, code: string, name: string, purchasePrice: number | string, retailPrice: number | string, wholeSalePrice: number | string, isActive: string, image: File[] | null, imagesToDelete: string[]) => void;
    productVariant?: { id: number | undefined, productId: number | null, unitId: number | null, code: string, name: string, purchasePrice: number | string, retailPrice: number | string, wholeSalePrice: number | string, isActive: string, image: File | File[] | string | null } | null;
};

export interface ProductFormData {
    productId: number | null,
    unitId: number | null,
    code: string,
    name: string,
    purchasePrice: number | string,
    retailPrice: number | string,
    wholeSalePrice: number | string,
    isActive: string,
    image: File | File[] | string | null;
};

export interface UnitData {
    id: number;
    name: string;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, productVariant }) => {
    const [units, setUnits] = useState<UnitData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string[] | null>(null);
    const [existingImages, setExistingImages] = useState<string[]>([]); // Existing images
    const [newImages, setNewImages] = useState<File[]>([]); // New images
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [resetKey, setResetKey] = useState(0); // Key to re-render the dropzone

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ProductFormData>();

    const { id } = useParams<{ id: string }>(); // Extract productId from the URL
    const numericProductId = id ? parseInt(id, 10) : null; // Convert to number, or null if not present

    const { hasPermission } = useAppContext();
    const API_BASE_URL = process.env.API_URL || "";

    useEffect(() => {
        const fetchUnits = async () => {
            setIsLoading(true);
            try {
                const { data } = await getAllUnits(1, "", 100, null, null);
                setUnits(data as UnitData[]);
            } catch (error) {
                console.error("Error fetching unit:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUnits();
        
        if (productVariant) {
            setValue('productId', productVariant.productId);
            setValue('unitId', productVariant.unitId);
            setValue('code', productVariant.code);
            setValue('name', productVariant.name);
            setValue("purchasePrice", productVariant.purchasePrice);
            setValue("retailPrice", productVariant.retailPrice);
            setValue("wholeSalePrice", productVariant.wholeSalePrice);
    
            if (productVariant.image) {
                if (typeof productVariant.image === 'string') {
                    // If it's a single string, wrap it in an array
                    setExistingImages([productVariant.image]);

                    setImagePreview([`${API_BASE_URL}/${productVariant.image}`]);
                } else if (Array.isArray(productVariant.image)) {
                    // If it's an array of File or string objects
                    const images = productVariant.image.map(item =>
                        typeof item === "string" ? item : URL.createObjectURL(item)
                    );
                    setExistingImages(images);

                    setImagePreview(productVariant.image.map(image => `${API_BASE_URL}/${image}`)); // array of images, no extra array wrapping
                } else if (productVariant.image instanceof File) {
                    // If it's a single File object
                    const imageUrl = URL.createObjectURL(productVariant.image);
                    setExistingImages([imageUrl]);

                    setImagePreview([URL.createObjectURL(productVariant.image)]);
                }
            } else {
                setImagePreview(null);
            }
    
            // Reset form with the current product details
            reset({
                productId: productVariant?.productId ?? null,
                unitId: productVariant?.unitId ?? null,
                code: productVariant?.code ?? '',
                name: productVariant?.name ?? '',
                purchasePrice: productVariant?.purchasePrice ?? '',
                retailPrice: productVariant?.retailPrice ?? '',
                wholeSalePrice: productVariant?.wholeSalePrice ?? '',
                image: productVariant?.image ?? null,
            });
        } else {
            reset({
                unitId: null,
                code: "",
                name: "",
                purchasePrice: "",
                retailPrice: "",
                wholeSalePrice: "",
                image: null,
            });
            setImagePreview(null);
        }
    }, [productVariant, setValue, reset]);

    // Reset dropzone states and input
    const resetDropzoneOrFormData = () => {
        reset();
        setNewImages([]);
        setImagePreview([]);
        setResetKey((prev) => prev + 1); // Force re-render the dropzone
    };

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    const onDrop = (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        const validFiles = acceptedFiles.filter((file) => file.size <= MAX_FILE_SIZE);

        if (rejectedFiles.length > 0 || validFiles.length < acceptedFiles.length) {
            alert("Some files were too large or invalid. Maximum size is 5 MB.");
            resetDropzoneOrFormData();
            return;
        }

        const previews = acceptedFiles.map(file => URL.createObjectURL(file));
        setNewImages(prev => [...prev, ...acceptedFiles]);
        setImagePreview(prev => (prev ? [...prev, ...previews] : previews));
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { "image/*": [] },
        multiple: true,
    });

    const removeImage = (index: number, type: "existing" | "new") => {
        if (type === "existing") {
            const removedImage = existingImages[index];
            setImagesToDelete((prev) => [...prev, removedImage]);

            setExistingImages(prev => prev ? prev.filter((_, i) => i !== index) : []); // Guard for null
            setImagePreview(prev => prev ? prev.filter((_, i) => i !== index) : []);  // Guard for null
        } else if (type === "new") {
            setNewImages(prev => prev ? prev.filter((_, i) => i !== index - (existingImages?.length || 0)) : []);
            setImagePreview(prev => prev ? prev.filter((_, i) => i !== index) : []);
        }
    };
    
    const convertExistingImagesPaths = async (): Promise<File[]> => {
        const imageFiles: File[] = [];
        for (const url of existingImages) {
            const filename = url.split("\\").pop() || "file";
            const cleanedPath = `./${filename}`;
    
            // Fetch the image content
            const response = await fetch(url);
            const blob = await response.blob(); // Get the Blob from the response
    
            // Create the File object with actual image content
            const file = new File([blob], filename, { type: "image/*" });
    
            // Set path and relativePath for your internal handling
            Object.assign(file, {
                path: cleanedPath,
                relativePath: cleanedPath,
            });
    
            imageFiles.push(file);
        }
        return imageFiles;
    };

    const handleFormSubmit = async (data: ProductFormData) => {
        setIsLoading(true);
        try {
            // Convert existing image paths to File objects
            const convertedExistingImages = await convertExistingImagesPaths(); // await for async function

            // Combine converted existing images and new images
            const combinedImages = [...convertedExistingImages, ...newImages];
    
            await onSubmit(productVariant?.id || null, numericProductId, data.unitId, data.code, data.name, data.purchasePrice, data.retailPrice, data.wholeSalePrice, data.isActive, combinedImages, imagesToDelete);
    
            resetDropzoneOrFormData();
            onClose();
        } catch (error: any) {
            console.log("Error submitting form:", error);
            resetDropzoneOrFormData();
            document.querySelector('form')?.reset(); // Reset HTML form if needed
        } finally {
            resetDropzoneOrFormData();
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-[black]/60 z-[999] overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg my-8">
                    <div className="flex bg-[#fbfbfb] dark:bg-[#121c2c] items-center justify-between px-5 py-3">
                        <h5 className="font-bold text-lg">{productVariant ? "Edit Product's Variant" : "Add New Product's Variant"}</h5>
                        <button type="button" className="text-white-dark hover:text-dark" onClick={onClose}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <form onSubmit={handleSubmit(handleFormSubmit)} encType="multipart/form-data">
                        <div className="p-5">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                                <div>
                                    <label>Unit <span className="text-danger text-md">*</span></label>
                                    <select 
                                        id="unitId" className="form-input" 
                                        {...register("unitId", { 
                                            required: "Unit is required"
                                        })} 
                                    >
                                        <option value="">Select a Unit...</option>
                                        {units.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                        ))}
                                    </select>
                                    {errors.unitId && <span className="error_validate">{errors.unitId.message}</span>}
                                </div>
                                <div>
                                    <label htmlFor="module">code <span className="text-danger text-md">*</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter Variant's code" 
                                        className="form-input"
                                        {...register("code", { required: "This field is required" })} 
                                    />
                                    {errors.name && <p className='error_validate'>{errors.name.message}</p>}
                                </div>
                            </div>
                            <div className="dark:text-white-dark/70 text-base font-medium text-[#1f2937] mb-4">
                                <label htmlFor="module">Variant's Name <span className="text-danger text-md">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="Enter Product's name" 
                                    className="form-input"
                                    {...register("name", { required: "This field is required" })} 
                                />
                                {errors.name && <p className='error_validate'>{errors.name.message}</p>}
                            </div>
                            <div className="dark:text-white-dark/70 text-base font-medium text-[#1f2937] mb-4">
                                <label htmlFor="module">Purchase Price <span className="text-danger text-md">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="Enter Purchase Price" 
                                    className="form-input"
                                    {...register("purchasePrice", { required: "This field is required" })} 
                                />
                                {errors.name && <p className='error_validate'>{errors.name.message}</p>}
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
                                <div>
                                    <label htmlFor="module">Whole Sale Price <span className="text-danger text-md">*</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter Whole Sale Price" 
                                        className="form-input"
                                        {...register("wholeSalePrice", { required: "This field is required" })} 
                                    />
                                    {errors.wholeSalePrice && <p className='error_validate'>{errors.wholeSalePrice.message}</p>}
                                </div>
                                <div>
                                    <label htmlFor="module">Retail Price <span className="text-danger text-md">*</span></label>
                                    <input 
                                        type="text" 
                                        placeholder="Enter Retail Price" 
                                        className="form-input"
                                        {...register("retailPrice", { required: "This field is required" })} 
                                    />
                                    {errors.retailPrice && <p className='error_validate'>{errors.retailPrice.message}</p>}
                                </div>
                            </div>
                            <div className="dark:text-white-dark/70 text-base font-medium text-[#1f2937] mt-5">
                                <label htmlFor="module">Product's Image</label>
                                {/* Drag-and-Drop File Upload */}
                                <div
                                    key={resetKey}
                                    {...getRootProps()}
                                    style={{
                                        border: "2px dashed #ccc",
                                        padding: "20px",
                                        textAlign: "center",
                                        margin: "20px 0",
                                    }}
                                >
                                    <input {...getInputProps()} />
                                    <p>Drag & drop some files here, or click to select files</p>
                                </div>
                                {/* Image Previews */}
                                <div className="flex gap-2 mt-3 flex-wrap">
                                    {imagePreview?.map((img, index) => (
                                        <div key={index} className="relative group">
                                            <img
                                                src={img}
                                                alt={`preview-${index}`}
                                                className="h-16 w-16 rounded-md"
                                            />
                                            {/* Remove Button */}
                                            <button
                                                type="button"
                                                className="absolute top-0 right-0 text-white py-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ background: 'red', borderRadius: '15px' }}
                                                onClick={() =>
                                                    removeImage(
                                                        index,
                                                        index < existingImages.length ? "existing" : "new"
                                                    )
                                                }
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {/* <button type="button" onClick={resetDropzoneOrFormData} style={{ padding: "10px", marginTop: "10px" }}>
                                    Reset
                                </button> */}
                                
                                {/* <input type="file" accept="image/*" multiple name="image" onChange={handleImageChange} />
                                <div className="flex gap-2 mt-3">
                                    {imagePreview?.map((img, index) => (
                                        <div key={index} className="relative">
                                            <img src={img} alt={`preview-${index}`} className="h-16 w-16 rounded-md" />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveImage(index)}
                                                className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                                title="Remove image"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div> */}
                            </div>
                            
                            <div className="flex justify-end items-center mt-8">
                                <button type="button" className="btn btn-outline-danger" onClick={onClose}>
                                    <FontAwesomeIcon icon={faClose} className='mr-1' />
                                    Discard
                                </button>
                                {hasPermission('Variant-Create') &&
                                    <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={isLoading}>
                                        <FontAwesomeIcon icon={faSave} className='mr-1' />
                                        {isLoading ? 'Saving...' : 'Save'}
                                    </button>
                                }
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Modal;