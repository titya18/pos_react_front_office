import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faClose } from '@fortawesome/free-solid-svg-icons';
import { useAppContext } from "../../hooks/useAppContext";
import { useForm } from "react-hook-form";
import { getAllCategories } from "../../api/category";
import { getAllBrands } from "../../api/brand";
import { FileRejection, useDropzone } from "react-dropzone";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (id: number | null, categoryId: number | null, brandId: number | null, name: string, note: string, isActive: string, image: File[] | null, imagesToDelete: string[]) => void;
    product?: { id: number | undefined, categoryId: number | null, brandId: number | null, name: string, note: string, isActive: string, image: File | File[] | string | null } | null;
};

export interface ProductFormData {
    categoryId: number | null;
    brandId: number | null;
    name: string;
    note: string;
    isActive: string;
    image: File | File[] | string | null;
};

export interface CategoryData {
    id: number;
    name: string;
};

export interface BrandData {
    id: number;
    name: string;
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, product }) => {
    const [categories, setCategories] = useState<CategoryData[]>([]);
    const [brands, setBrands] = useState<BrandData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string[] | null>(null);
    const [existingImages, setExistingImages] = useState<string[]>([]); // Existing images
    const [newImages, setNewImages] = useState<File[]>([]); // New images
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [resetKey, setResetKey] = useState(0); // Key to re-render the dropzone

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ProductFormData>();

    const { hasPermission } = useAppContext();
    const API_BASE_URL = process.env.API_URL || "";

    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true);
            try {
                const { data } = await getAllCategories(1, "", 100, null, null);
                setCategories(data as CategoryData[]);
            } catch (error) {
                console.error("Error fetching category:", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchBrands = async () => {
            setIsLoading(true);
            try {
                const { data } = await getAllBrands(1, "", 100, null, null);
                setBrands(data as BrandData[]);
            } catch (error) {
                console.error("Error fetching brand:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCategories();
        fetchBrands();
        
        if (product) {
            setValue('categoryId', product.categoryId);
            setValue('brandId', product.brandId);
            setValue('name', product.name);
            setValue("note", product.note);
    
            if (product.image) {
                if (typeof product.image === 'string') {
                    // If it's a single string, wrap it in an array
                    setExistingImages([product.image]);

                    setImagePreview([`${API_BASE_URL}/${product.image}`]);
                } else if (Array.isArray(product.image)) {
                    // If it's an array of File or string objects
                    const images = product.image.map(item =>
                        typeof item === "string" ? item : URL.createObjectURL(item)
                    );
                    setExistingImages(images);

                    setImagePreview(product.image.map(image => `${API_BASE_URL}/${image}`)); // array of images, no extra array wrapping
                } else if (product.image instanceof File) {
                    // If it's a single File object
                    const imageUrl = URL.createObjectURL(product.image);
                    setExistingImages([imageUrl]);

                    setImagePreview([URL.createObjectURL(product.image)]);
                }
            } else {
                setImagePreview(null);
            }
    
            // Reset form with the current product details
            reset({
                categoryId: product?.categoryId ?? null,
                brandId: product?.brandId ?? null,
                name: product?.name ?? '',
                note: product?.note ?? '',
                image: product?.image ?? null,
            });
        } else {
            reset({
                categoryId: null,
                brandId: null,
                name: "",
                note: "",
                image: null,
            });
            setImagePreview(null);
        }
    }, [product, setValue, reset]);

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
    
            await onSubmit(product?.id || null, data.categoryId, data.brandId, data.name, data.note, data.isActive, combinedImages, imagesToDelete);
    
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
                        <h5 className="font-bold text-lg">{product ? "Edit Product" : "Add New Product"}</h5>
                        <button type="button" className="text-white-dark hover:text-dark" onClick={onClose}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <form onSubmit={handleSubmit(handleFormSubmit)} encType="multipart/form-data">
                        <div className="p-5">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
                                <div>
                                    <label>Category <span className="text-danger text-md">*</span></label>
                                    <select 
                                        id="categoryId" className="form-input" 
                                        {...register("categoryId", { 
                                            required: "Category is required"
                                        })} 
                                    >
                                        <option value="">Select a category...</option>
                                        {categories.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                        ))}
                                    </select>
                                    {errors.categoryId && <span className="error_validate">{errors.categoryId.message}</span>}
                                </div>
                                <div>
                                    <label>Brand <span className="text-danger text-md">*</span></label>
                                    <select 
                                        id="brandId" className="form-input" 
                                        {...register("brandId", { 
                                            required: "Brand is required"
                                        })} 
                                    >
                                        <option value="">Select a brand...</option>
                                        {brands.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                        ))}
                                    </select>
                                    {errors.brandId && <span className="error_validate">{errors.brandId.message}</span>}
                                </div>
                            </div>
                            <div className="dark:text-white-dark/70 text-base font-medium text-[#1f2937]">
                                <label htmlFor="module">Product's Name <span className="text-danger text-md">*</span></label>
                                <input 
                                    type="text" 
                                    placeholder="Enter Product's name" 
                                    className="form-input"
                                    {...register("name", { required: "This field is required" })} 
                                />
                                {errors.name && <p className='error_validate'>{errors.name.message}</p>}
                            </div>

                            <div className="dark:text-white-dark/70 text-base font-medium text-[#1f2937] mt-5">
                                <label htmlFor="module">Note</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter Description" 
                                    className="form-input"
                                    {...register("note")} 
                                />
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
                                {hasPermission('Category-Create') &&
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