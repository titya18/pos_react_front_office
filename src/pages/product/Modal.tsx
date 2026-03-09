// ✅ Modal.tsx (FULL UPDATED FILE) — works with UOM (Base Unit + unitConversions)
// Stock input is ALWAYS in Base Unit (recommended)

import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faClose, faPlus, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useAppContext } from "../../hooks/useAppContext";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { getAllCategories } from "../../api/category";
import { getAllBrands } from "../../api/brand";
import { FileRejection, useDropzone } from "react-dropzone";

import { UnitData, VarientAttributeType, BranchType } from "../../data_types/types";
import { getAllBranches } from "@/api/branch";
import { getAllUnits } from "../../api/unit";
import { getAllVarientAttributes } from "../../api/varientAttribute";
import MultiSelectVariant from "./MultiSelectVariant";
import Select from "react-select";

type ProductStock = {
  branchId: number;
  quantity: number;
};

type ConversionRow = {
  fromUnitId: number | null;
  toUnitId: number | null;
  multiplier: number | string;
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;

  // ✅ UPDATED: add baseUnitId + unitConversions at the end
  onSubmit: (
    id: number | null,
    categoryId: number | null,
    brandId: number | null,
    name: string,
    note: string,
    isActive: string,
    image: File[] | null,
    imagesToDelete: string[],

    unitId: number | null,
    barcode: string | null,
    productType: string | "New",
    sku: string,
    purchasePrice: number | string,
    retailPrice: number | string,
    wholeSalePrice: number | string,
    variantAttributeIds?: number[] | null,
    variantValueIds?: number[],

    stocks?: ProductStock[],

    // ✅ NEW (UOM)
    baseUnitId?: number | null,
    unitConversions?: { fromUnitId: number; toUnitId: number; multiplier: number }[]
  ) => void;

  product?: {
    id: number | undefined;
    categoryId: number | null;
    brandId: number | null;
    name: string;
    note: string;
    isActive: string;
    image: File | File[] | string | null;

    unitId: number | null;
    barcode: string | null;
    sku: string;
    purchasePrice: number | string;
    retailPrice: number | string;
    wholeSalePrice: number | string;
    productType: string | "New";

    variantAttributeId?: number | null;
    variantAttributeIds?: number[];
    variantValueIds?: number[];
    branchId?: number | null;
    stocks?: Array<{ branchId: number; quantity: string | number }> | null;

    // ✅ NEW (UOM)
    baseUnitId?: number | null;
    unitConversions?: { fromUnitId: number; toUnitId: number; multiplier: number }[];
  } | null;
}

export interface ProductFormData {
  categoryId: number | null;
  brandId: number | null;
  name: string;
  note: string;
  isActive: string;
  image: File | File[] | string | null;

  productType: string | "New";
  unitId: number | null;
  barcode?: string | null;
  sku?: string;
  purchasePrice?: number | string;
  retailPrice?: number | string;
  wholeSalePrice?: number | string;
  variantAttributeId?: number | null;
  variantAttributeIds?: number[];
  variantValueIds?: number[];

  // ✅ NEW (UOM)
  baseUnitId: number | null;
  unitConversions: ConversionRow[];

  branchId?: number | null;
  stocks?: Array<{ branchId: number; quantity: string | number }> | null;
}

export interface CategoryData {
  id: number;
  name: string;
}

export interface BrandData {
  id: number;
  en_name: string;
  kh_name: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, onSubmit, product }) => {
  const [branches, setBranches] = useState<BranchType[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [imagePreview, setImagePreview] = useState<string[] | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [resetKey, setResetKey] = useState(0);

  const [variantValues, setVariantValues] = useState<any[]>([]);
  const [skuLocked, setSkuLocked] = useState(false);
  const [barcodeLocked, setBarcodeLocked] = useState(false);

  const [units, setUnits] = useState<UnitData[]>([]);
  const [variantAttributes, setVariantAttributes] = useState<VarientAttributeType[]>([]);

  const methods = useForm<ProductFormData>({
    defaultValues: {
      stocks: [],
      baseUnitId: null,
      unitConversions: [],
    },
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = methods;

  // stocks field array
  useFieldArray({
    control,
    name: "stocks",
  });

  // ✅ unitConversions field array
  const {
    fields: conversionFields,
    append: appendConversion,
    remove: removeConversion,
  } = useFieldArray({
    control,
    name: "unitConversions",
  });

  const { hasPermission } = useAppContext();
  const API_BASE_URL = import.meta.env.VITE_API_URL || "";

  const fetchBranches = async () => {
    setIsLoading(true);
    try {
      const data = await getAllBranches();
      setBranches(data as BranchType[]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getAllCategories();
      setCategories(data as CategoryData[]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrands = async () => {
    setIsLoading(true);
    try {
      const data = await getAllBrands();
      setBrands(data as BrandData[]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnits = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUnits();
      setUnits(data as UnitData[]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVariantAttributes = async () => {
    setIsLoading(true);
    try {
      const data = await getAllVarientAttributes();
      setVariantAttributes(data as VarientAttributeType[]);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ fetch when modal opens
  useEffect(() => {
    if (!isOpen) return;
    fetchBranches();
    fetchCategories();
    fetchBrands();
    fetchUnits();
    fetchVariantAttributes();
  }, [isOpen]);

  // ✅ base unit label
  const baseUnitId = watch("baseUnitId");
  const baseUnitName = units.find((u) => u.id === baseUnitId)?.name || "";

  useEffect(() => {
    // Only run after branches are fetched and modal is open
    if (!isOpen || branches.length === 0) return;

    if (product) {
      const stockData = branches.map((branch) => {
        const existing = product.stocks?.find((s) => s.branchId === branch.id);
        return {
          branchId: branch.id ?? 0,
          quantity: existing ? Number(existing.quantity) : 0,
        };
      });

      setSkuLocked(true);
      setBarcodeLocked(true);

      reset({
        categoryId: product.categoryId ?? null,
        brandId: product.brandId ?? null,
        name: product.name ?? "",
        note: product.note ?? "",
        image: product.image ?? null,

        productType: product.productType ?? "New",
        unitId: product.unitId ?? null,
        barcode: product.barcode ?? "",
        sku: product.sku ?? "",
        purchasePrice: product.purchasePrice ?? "",
        retailPrice: product.retailPrice ?? "",
        wholeSalePrice: product.wholeSalePrice ?? "",
        variantAttributeIds: product.variantAttributeIds ?? [],
        variantValueIds: product.variantValueIds ?? [],

        stocks: stockData,

        // ✅ NEW UOM
        baseUnitId: product.baseUnitId ?? null,
        unitConversions: (product.unitConversions ?? []).map((c) => ({
          fromUnitId: c.fromUnitId,
          toUnitId: c.toUnitId,
          multiplier: c.multiplier,
        })),
      });

      // images preview (your logic)
      if (product.image) {
        if (typeof product.image === "string") {
          setExistingImages([product.image]);
          setImagePreview([`${API_BASE_URL}/${product.image}`]);
        } else if (Array.isArray(product.image)) {
          const images = product.image.map((item) =>
            typeof item === "string" ? item : URL.createObjectURL(item)
          );
          setExistingImages(images as string[]);
          setImagePreview((product.image as any).map((img: any) => `${API_BASE_URL}/${img}`));
        } else if (product.image instanceof File) {
          const imageUrl = URL.createObjectURL(product.image);
          setExistingImages([imageUrl]);
          setImagePreview([imageUrl]);
        }
      } else {
        setImagePreview(null);
      }
    } else {
      setSkuLocked(false);
      setBarcodeLocked(false);

      const initialStocks = branches.map((branch) => ({
        branchId: branch.id ?? 0,
        quantity: 0,
      }));

      reset({
        categoryId: null,
        brandId: null,
        name: "",
        note: "",
        image: null,

        productType: "New",
        unitId: null,
        barcode: "",
        sku: "",
        purchasePrice: "",
        retailPrice: "",
        wholeSalePrice: "",
        variantAttributeIds: [],
        variantValueIds: [],

        stocks: initialStocks,

        // ✅ NEW UOM
        baseUnitId: null,
        unitConversions: [],
      });

      setVariantValues([]);
      setExistingImages([]);
      setImagePreview(null);
    }
  }, [product, reset, isOpen, branches.length, units.length]);

  const resetDropzoneOrFormData = () => {
    reset();
    setNewImages([]);
    setImagePreview([]);
    setResetKey((prev) => prev + 1);
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const onDrop = (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    const validFiles = acceptedFiles.filter((file) => file.size <= MAX_FILE_SIZE);

    if (rejectedFiles.length > 0 || validFiles.length < acceptedFiles.length) {
      alert("Some files were too large or invalid. Maximum size is 5 MB.");
      resetDropzoneOrFormData();
      return;
    }

    const previews = acceptedFiles.map((file) => URL.createObjectURL(file));
    setNewImages((prev) => [...prev, ...acceptedFiles]);
    setImagePreview((prev) => (prev ? [...prev, ...previews] : previews));
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

      setExistingImages((prev) => (prev ? prev.filter((_, i) => i !== index) : []));
      setImagePreview((prev) => (prev ? prev.filter((_, i) => i !== index) : []));
    } else {
      setNewImages((prev) => (prev ? prev.filter((_, i) => i !== index - (existingImages?.length || 0)) : []));
      setImagePreview((prev) => (prev ? prev.filter((_, i) => i !== index) : []));
    }
  };

  const convertExistingImagesPaths = async (): Promise<File[]> => {
    const imageFiles: File[] = [];
    for (const url of existingImages) {
      const filename = url.split("\\").pop() || "file";
      const cleanedPath = `./${filename}`;

      const response = await fetch(url);
      const blob = await response.blob();

      const file = new File([blob], filename, { type: "image/*" });

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
      const convertedExistingImages = await convertExistingImagesPaths();
      const combinedImages = [...convertedExistingImages, ...newImages];

      const stocks: ProductStock[] = (data.stocks || []).map((s) => ({
        branchId: Number(s.branchId),
        quantity: Number(s.quantity) || 0,
      }));

      // ✅ sanitize unitConversions
      const conversionsOut = (data.unitConversions || [])
        .filter(
          (c) =>
            c.fromUnitId &&
            c.toUnitId &&
            Number(c.multiplier) > 0 &&
            c.fromUnitId !== c.toUnitId
        )
        .map((c) => ({
          fromUnitId: Number(c.fromUnitId),
          toUnitId: Number(c.toUnitId),
          multiplier: Number(c.multiplier),
        }));

      await onSubmit(
        product?.id || null,
        data.categoryId,
        data.brandId,
        data.name,
        data.note,
        data.isActive,
        combinedImages,
        imagesToDelete,

        data.unitId,
        data.barcode || null,
        data.productType || "New",
        data.sku || "",
        data.purchasePrice || "",
        data.retailPrice || "",
        data.wholeSalePrice || "",
        data.variantAttributeIds ?? null,
        data.variantValueIds,

        stocks,

        // ✅ NEW UOM
        data.baseUnitId,
        conversionsOut
      );

      resetDropzoneOrFormData();
      onClose();
    } catch (error: any) {
      console.log("Error submitting form:", error);
      resetDropzoneOrFormData();
      document.querySelector("form")?.reset();
    } finally {
      resetDropzoneOrFormData();
      setIsLoading(false);
    }
  };

  // --- Auto generators ---
  const nameValue = watch("name") ?? "";

  const generateSKU = (name: string) => {
    if (!name.trim()) return "";
    const prefix = name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase())
      .join("");

    const random = Math.floor(1000 + Math.random() * 9000);
    return prefix + random;
  };

  const generateBarcode = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  };

  const handleSkuChange = (value: string) => {
    setValue("sku", value);
    setSkuLocked(true);
  };

  const handleBarcodeChange = (value: string) => {
    setValue("barcode", value);
    setBarcodeLocked(true);
  };

  useEffect(() => {
    if (!nameValue.trim()) return;

    if (!skuLocked) setValue("sku", generateSKU(nameValue));
    if (!barcodeLocked) setValue("barcode", generateBarcode());
  }, [nameValue, skuLocked, barcodeLocked, setValue]);

  const selectedAttributeIds = watch("variantAttributeIds") || [];

  useEffect(() => {
    const allValues = variantAttributes
      .filter((attr) => attr.id != null && selectedAttributeIds.includes(attr.id))
      .flatMap((attr) => attr.values || []);

    setVariantValues(allValues);

    const currentSelectedValues: number[] = watch("variantValueIds") || [];
    const filteredSelectedValues = currentSelectedValues.filter((vId) =>
      allValues.some((val) => val.id === vId)
    );

    setValue("variantValueIds", filteredSelectedValues);
  }, [selectedAttributeIds.join(","), variantAttributes, setValue, watch]);

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

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(handleFormSubmit)} encType="multipart/form-data">
              <div className="p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
                  <div className="flex flex-wrap">
                    <label className="flex cursor-pointer items-center" style={{ marginRight: "20px" }}>
                      <input type="radio" value="New" className="form-radio" {...register("productType", { required: "Product type is required" })} />
                      <span className="text-white-dark">New</span>
                    </label>
                    <label className="flex cursor-pointer items-center">
                      <input type="radio" value="SecondHand" className="form-radio" {...register("productType", { required: "Product type is required" })} />
                      <span className="text-white-dark">Second Hand</span>
                    </label>
                  </div>
                  {errors.productType && <span className="error_validate">{errors.productType.message}</span>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-5">
                  <div>
                    <label>
                      Category <span className="text-danger text-md">*</span>
                    </label>
                    <select id="categoryId" className="form-input" {...register("categoryId", { required: "Category is required", valueAsNumber: true })}>
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
                    <label>
                      Brand <span className="text-danger text-md">*</span>
                    </label>
                    <select id="brandId" className="form-input" {...register("brandId", { required: "Brand is required", valueAsNumber: true })}>
                      <option value="">Select a brand...</option>
                      {brands.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.en_name}
                        </option>
                      ))}
                    </select>
                    {errors.brandId && <span className="error_validate">{errors.brandId.message}</span>}
                  </div>
                </div>

                <div className="dark:text-white-dark/70 text-base font-medium text-[#1f2937] mb-5">
                  <label htmlFor="module">
                    Product's Name <span className="text-danger text-md">*</span>
                  </label>
                  <input type="text" placeholder="Enter Product's name" className="form-input" {...register("name", { required: "This field is required" })} />
                  {errors.name && <p className="error_validate">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
                  <div>
                    <label htmlFor="module">
                      SKU <span className="text-danger text-md">*</span>
                    </label>
                    <input type="text" placeholder="Enter sku's code" className="form-input" {...register("sku", { required: "This field is required" })} onChange={(e) => handleSkuChange(e.target.value)} />
                    {errors.sku && <p className="error_validate">{errors.sku.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="module">
                      Barcode <span className="text-danger text-md">*</span>
                    </label>
                    <input type="text" placeholder="Enter Variant's barcode" className="form-input" {...register("barcode", { required: "This field is required" })} onChange={(e) => handleBarcodeChange(e.target.value)} />
                    {errors.barcode && <p className="error_validate">{errors.barcode.message}</p>}
                  </div>
                </div>

                {/* ✅ NEW UOM: Base Unit + Unit */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 mb-4">
                  <div>
                    <label>
                      Base Unit (Stock Unit) <span className="text-danger text-md">*</span>
                    </label>
                    <select
                      id="baseUnitId"
                      className="form-input"
                      {...register("baseUnitId", { required: "Base Unit is required", valueAsNumber: true })}
                    >
                      <option value="">Select Base Unit...</option>
                      {units.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    {errors.baseUnitId && <span className="error_validate">{errors.baseUnitId.message as any}</span>}
                  </div>

                  {/* <div>
                    <label>
                      Unit <span className="text-danger text-md">*</span>
                    </label>
                    <select id="unitId" className="form-input" {...register("unitId", { required: "Unit is required", valueAsNumber: true })}>
                      <option value="">Select a Unit...</option>
                      {units.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                    {errors.unitId && <span className="error_validate">{errors.unitId.message}</span>}
                  </div> */}
                </div>

                {/* ✅ NEW UOM: unitConversions */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold">Unit Conversions (optional)</label>
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={() => appendConversion({ fromUnitId: null, toUnitId: null, multiplier: "" })}
                    >
                      <FontAwesomeIcon icon={faPlus} className="mr-1" />
                      Add
                    </button>
                  </div>

                  {conversionFields.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Example: 1 box = 12 pcs → From=box, To=pcs, Multiplier=12
                    </p>
                  )}

                  <div className="space-y-3">
                    {conversionFields.map((row, idx) => (
                      <div key={row.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="sm:col-span-4">
                          <label className="text-sm">From Unit</label>
                          <select className="form-input" {...register(`unitConversions.${idx}.fromUnitId`, { valueAsNumber: true })}>
                            <option value="">Select...</option>
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="text-sm">To Unit</label>
                          <select className="form-input" {...register(`unitConversions.${idx}.toUnitId`, { valueAsNumber: true })}>
                            <option value="">Select...</option>
                            {units.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-4">
                          <label className="text-sm">Multiplier</label>
                          <input
                            type="number"
                            step="0.0001"
                            placeholder="e.g. 12"
                            className="form-input"
                            {...register(`unitConversions.${idx}.multiplier`)}
                          />
                        </div>

                        <div className="sm:col-span-3 flex justify-end">
                          <button type="button" className="btn btn-outline-danger" onClick={() => removeConversion(idx)} title="Remove">
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ✅ Stock in base unit */}
                <div className="mb-4">
                  <label className="font-semibold mb-2 block">
                    Stock Per Branch {baseUnitName ? `(in ${baseUnitName})` : ""}
                  </label>

                  <div className="space-y-3">
                    {branches.map((branch, index) => (
                      <div key={branch.id} className="flex items-center gap-4">
                        <input
                          type="hidden"
                          value={branch.id}
                          {...register(`stocks.${index}.branchId`, { valueAsNumber: true })}
                        />

                        <div className="w-1/2">
                          <input type="text" value={branch.name} disabled className="form-input bg-gray-100" />
                        </div>

                        <div className="w-1/2">
                          <input type="number" step="0" {...register(`stocks.${index}.quantity`, { valueAsNumber: true })} className="form-input" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variant Attributes */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 mb-4">
                  <div>
                    <label>
                      Variant Attribute
                    </label>

                    <Select
                      isMulti
                      options={variantAttributes.map((attr) => ({ value: attr.id, label: attr.name }))}
                      value={(watch("variantAttributeIds") || [])
                        .filter((id, index, arr) => arr.indexOf(id) === index)
                        .map((id) => {
                          const attr = variantAttributes.find((a) => a.id === id);
                          return attr ? { value: attr.id, label: attr.name } : null;
                        })
                        .filter(Boolean) as any}
                      onChange={(selectedOptions: any) => {
                        const ids = (selectedOptions || [])
                          .map((opt: any) => opt.value)
                          .filter((v: any): v is number => typeof v === "number");
                        setValue("variantAttributeIds", Array.from(new Set(ids)));
                      }}
                      placeholder="Select Variant Attributes..."
                      className="basic-multi-select"
                      classNamePrefix="select"
                    />

                    {errors.variantAttributeIds && (
                      <span className="error_validate">{errors.variantAttributeIds.message as any}</span>
                    )}
                  </div>
                </div>

                {variantValues.length > 0 && <MultiSelectVariant variantValues={variantValues} />}

                {/* Prices */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5">
                  <div>
                    <label htmlFor="module">
                      Purchase Price <span className="text-danger text-md">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Purchase Price"
                      className="form-input w-full"
                      {...register("purchasePrice", { required: "This field is required" })}
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const target = e.currentTarget;
                        target.value = target.value.replace(/[^0-9.]/g, "");
                        const parts = target.value.split(".");
                        if (parts.length > 2) target.value = parts[0] + "." + parts.slice(1).join("");
                      }}
                    />
                    {errors.purchasePrice && <p className="error_validate">{errors.purchasePrice.message as any}</p>}
                  </div>

                  <div>
                    <label htmlFor="module">
                      Whole Sale Price <span className="text-danger text-md">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Whole Sale Price"
                      className="form-input"
                      {...register("wholeSalePrice", { required: "This field is required" })}
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const target = e.currentTarget;
                        target.value = target.value.replace(/[^0-9.]/g, "");
                        const parts = target.value.split(".");
                        if (parts.length > 2) target.value = parts[0] + "." + parts.slice(1).join("");
                      }}
                    />
                    {errors.wholeSalePrice && <p className="error_validate">{errors.wholeSalePrice.message as any}</p>}
                  </div>

                  <div>
                    <label htmlFor="module">
                      Retail Price <span className="text-danger text-md">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter Retail Price"
                      className="form-input"
                      {...register("retailPrice", { required: "This field is required" })}
                      onInput={(e: React.FormEvent<HTMLInputElement>) => {
                        const target = e.currentTarget;
                        target.value = target.value.replace(/[^0-9.]/g, "");
                        const parts = target.value.split(".");
                        if (parts.length > 2) target.value = parts[0] + "." + parts.slice(1).join("");
                      }}
                    />
                    {errors.retailPrice && <p className="error_validate">{errors.retailPrice.message as any}</p>}
                  </div>
                </div>

                <div className="dark:text-white-dark/70 text-base font-medium text-[#1f2937] mt-5">
                  <label htmlFor="module">Note</label>
                  <input type="text" placeholder="Enter Description" className="form-input" {...register("note")} />
                </div>

                {/* Images */}
                <div className="dark:text-white-dark/70 text-base font-medium text-[#1f2937] mt-5">
                  <label htmlFor="module">Product's Image</label>

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

                  <div className="flex gap-2 mt-3 flex-wrap">
                    {imagePreview?.map((img, index) => (
                      <div key={index} className="relative group">
                        <img src={img} alt={`preview-${index}`} className="h-16 w-16 rounded-md" />
                        <button
                          type="button"
                          className="absolute top-0 right-0 text-white py-0.5 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: "red", borderRadius: "15px" }}
                          onClick={() => removeImage(index, index < existingImages.length ? "existing" : "new")}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end items-center mt-8">
                  <button type="button" className="btn btn-outline-danger" onClick={onClose}>
                    <FontAwesomeIcon icon={faClose} className="mr-1" />
                    Discard
                  </button>

                  {hasPermission("Category-Create") && (
                    <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={isLoading}>
                      <FontAwesomeIcon icon={faSave} className="mr-1" />
                      {isLoading ? "Saving..." : "Save"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </FormProvider>
        </div>
      </div>
    </div>
  );
};

export default Modal;