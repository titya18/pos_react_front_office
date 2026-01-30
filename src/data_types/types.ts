export interface RoleType {
    id?: number;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: string;
    updatedBy?: string;

    creator?: UserType | null;
    updater?: UserType | null;
    permissions: number[];
};

export interface UserType {
    id?: number;
    branchId: number | null;
    email: string;
    phoneNumber: string;
    password: string;
    show_pass?: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    status: string;
    roleType: string;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: string;
    updatedBy?: string;

    creator?: UserType | null;
    updater?: UserType | null;
    branch: { id: number, name: string } | null; // Define branch as an object with a name
    roles: RoleType[]; // Change roles to be an array of RoleType objects
};

export interface BranchType {
    id?: number;
    name: string;
    address: string;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;

    users?: UserType[];
    creator?: UserType | null;
    updater?: UserType | null;
}

export interface CategoryType {
    id?: number;
    code: string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    
    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
}

export interface BrandType {
    id?: number;
    en_name: string;
    kh_name?: string;
    description: string;
    image: File | string | null;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
};

export interface UnitType {
    id?: number;
    name: string;
    type: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
};

export interface PaymentMethodType {
    id?: number;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
}

export interface SupplierType {
    id?: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
}

export interface UnitData {
    id: number;
    name: string;
};

export interface ProductType {
    id?: number;
    categoryId: number;
    brandId: number;
    name: string;
    // image: File | File[] | string | null;
    image: File[] | null;
    note: string;
    isActive: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;

    categories: CategoryType;
    category?: CategoryType;
    brand?: BrandType;
    brands: BrandType;
    imagesToDelete?: string[];
    productVariants?: ProductVariantType[];
}

export interface VarientAttributeType {
    id?: number;
    name: string;
    values: VariantValueType[];
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
}

export interface VariantValueType {
    id?: number;
    value: string;
}

export interface ProductVariantType {
    id: number;
    productId: number,
    unitId: number | null,
    sku: string,
    barcode: string | null,
    name: string,
    purchasePrice: number | string,
    retailPrice: number | string,
    wholeSalePrice: number | string,
    isActive: number,
    image: File | File[] | string | null;
    imagesToDelete: string[];
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;

    units?: UnitData;
    products?: ProductType | null;

    // MULTIPLE attributes (Color + Size + Material ...)
    variantAttributeIds?: number[];
    // MULTIPLE values (Red, Blue, XL, Cotton ...)
    variantValueIds?: number[];
    // Returned from backend (expand join table)
    variantValues?: VariantValueType[];
};

export interface ProductVariantValuesType {
    id: number;
    productVariantId: number;
    variantValueId: number;
}

export enum MovementType {
    STOCK_IN = "STOCK_IN",
    STOCK_OUT = "STOCK_OUT",
    RETURN = "RETURN",
    ADJUSTMENT = "ADJUSTMENT"
}

export interface StockType {
    id: number;
    productVariantId: number;
    quantity: string; // Decimal
    branchId: number;

    createdAt: Date;
    updatedAt: Date;

    creator?: UserType | null;
    updater?: UserType | null;
};

export interface StockMovement {
    id: number;
    productVariantId: number;
    branchId: number;

    type: MovementType;
    quantity: string; // Decimal
    note?: string | null;

    createdAt: Date;
    creator?: UserType | null;
};

export interface StockSummaryVariant {
    variantId: number;
    sku: string;
    quantity: number;
    branchId: number;
};

export interface StockSummaryItem {
    productId: number;
    productName: string;
    totalQuantity: number;
    variants: StockSummaryVariant[];
};

export interface StockSummaryRow {
  productName: string;
  variantName: string;
  sku: string;
  barcode: string;
  branchName: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: number; name: string };
  updatedBy?: { id: number; name: string };
  attributes: { attributeName: string; value: string }[];

  // Add these for keys
  variantId: number;
  branchId?: number;
}

export interface PurchaseType {
    id?: number;
    branchId: number;
    supplierId: number;
    ref: string;
    purchaseDate?: string | null; // Format: YYYY-MM-DD
    taxRate?: string | null;
    taxNet: number | null;
    discount?: number | null;
    shipping?: string | null;
    grandTotal: number;
    paidAmount: number | null;
    status: string;
    note: string;
    delReason: string;
    image: File | File[] | string | null;
    imagesToDelete: string[];
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    receivedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
    receiver?: UserType | null;

    branch: BranchType | null;
    supplier?: SupplierType | null;
    suppliers: SupplierType | null;
    purchaseDetails: PurchaseDetailType[];
}

export interface PurchaseDetailType {
    id: number;
    productId: number;
    productVariantId: number;
    quantity: number;
    cost: number;
    taxNet: number;
    taxMethod: string | null;
    discount: number;
    discountMethod: string | null;
    total: number;

    products: ProductType | null;
    productvariants: ProductVariantType | null;
}

export interface PaymentType {
    branchId: number | null;
    purchaseId: number | null;
    paymentDate?: Date;
    paymentMethodId: number | null;
    paidAmount: number | null;
    amount: number | null;
    receive_usd?: number | null;
    receive_khr?: number | null;
    exchangerate?: number | null;
    due_balance?: number | null;
    createdAt: string | null;
    PaymentMethods: { name: string } | null;
    status?: string;
    delReason?: string;
    createdDat?: Date;
    updatedDat?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;

    purchase?: PurchaseType | null;
    branch?: BranchType | null;
    supplier?: SupplierType | null;

    totalPaid?: number | null;
}

export interface InvoicePaymentType {
    branchId: number | null;
    orderId: number | null;
    paymentMethodId: number | null;
    paidAmount: number | null;
    totalPaid: number | null;
    receive_usd?: number | null;
    receive_khr?: number | null;
    exchangerate?: number | null;
    due_balance?: number | null;
    createdAt: string | null;
    paymentMethods: { name: string } | null;
    createdDat?: Date;
    updatedDat?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
}

export interface ServiceType {
    id?: number;
    serviceCode: string;
    name: string;
    description: string;
    price: number;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
}

export interface QuotationType {
    id?: number;
    branchId: number;
    customerId: number;
    ref: string;
    quotationDate?: string | null; // Format: YYYY-MM-DD
    taxRate?: string | null;
    taxNet: number | null;
    discount?: number | null;
    shipping?: string | null;
    grandTotal: number;
    status: string;
    QuoteSaleType?: string | null;
    note: string;
    delReason: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    sentBy?: string | null;
    sentAt?: string | null;
    invoicedAt?: string | null;
    invoicedBy?: string | null;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
    invoicer?: UserType | null;
    sender?: UserType | null;

    branch: BranchType | null;
    customer?: CustomerType | null;
    customers: CustomerType | null;
    quotationDetails: QuotationDetailType[];
}

export interface QuotationDetailType {
    id: number;
    quotationId: number;
    productId?: number;
    productVariantId?: number;
    serviceId?: number;
    ItemType: string;
    quantity: number;
    cost: number;
    taxNet: number;
    taxMethod: string | null;
    discount: number;
    discountMethod: string | null;
    total: number;

    products?: ProductType | null;
    productvariants?: ProductVariantType | null;
    services?: ServiceType | null;
}

export interface CustomerType {
    id?: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    createdAt?: Date;
    updatedAt?: Date;
    
    creator?: UserType | null;
    updater?: UserType | null;
}

export interface InvoiceType {
    id?: number;
    branchId: number;
    customerId: number;
    ref: string;
    orderDate?: string | null; // Format: YYYY-MM-DD
    taxRate?: string | null;
    taxNet: number | null;
    discount?: number | null;
    shipping?: string | null;
    totalAmount: number;
    paidAmount: number | null;
    status: string;
    returnstatus?: number | null;
    OrderSaleType?: string | null;
    note: string;
    delReason: string;
    approvedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    approver?: UserType | null;
    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;

    branch: BranchType | null;
    customer?: CustomerType | null;
    customers: CustomerType | null;
    items: InvoiceDetailType[];

    totalProfit?: number | null;
}

export interface InvoiceDetailType {
    id: number;
    orderId: number;
    productId?: number;
    productVariantId?: number;
    serviceId?: number;
    ItemType: string;
    quantity: number;
    price: number;
    taxNet: number;
    taxMethod: string | null;
    discount: number;
    discountMethod: string | null;
    total: number;

    products?: ProductType | null;
    productvariants?: ProductVariantType | null;
    services?: ServiceType | null;
}

export interface StockAdjustmentType {
    id?: number;
    branchId: number;
    ref: string;
    adjustDate?: string | null; // Format: YYYY-MM-DD
    AdjustMentType: string;
    StatusType: string;
    note: string;
    delReason: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    approvedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
    approver?: UserType | null;

    branch: BranchType | null;
    adjustmentDetails: StockAdjustmentDetailType[];

    totalQuantity?: number;
}

export interface StockAdjustmentDetailType {
    id: number;
    productId: number;
    productVariantId: number;
    quantity: number;

    products: ProductType | null;
    productvariants: ProductVariantType | null;
}

export interface StockTransferType {
    id?: number;
    branchId: number;
    ref: string;
    fromBranchId: number;
    toBranchId: number;
    transferDate?: string | null; // Format: YYYY-MM-DD
    StatusType: string;
    note: string;
    delReason: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    approvedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
    approver?: UserType | null;

    fromBranch: BranchType | null;
    toBranch: BranchType | null;
    tobranch?: BranchType | null;
    branch: BranchType | null;

    transferDetails: StockTransferDetailType[];

    totalQuantity?: number;
}

export interface StockTransferDetailType {
    id: number;
    productId: number;
    productVariantId: number;
    quantity: number;

    products: ProductType | null;
    productvariants: ProductVariantType | null;
}

export interface StockRequestType {
    id?: number;
    branchId: number;
    ref: string;
    requestBy: number;
    requestDate?: string | null; // Format: YYYY-MM-DD
    StatusType: string;
    note: string;
    delReason: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    approvedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
    approver?: UserType | null;
    requester?: UserType | null;

    branch: BranchType | null;
    requestDetails: StockRequestDetailType[];

    totalQuantity?: number;
}

export interface StockRequestDetailType {
    id: number;
    productId: number;
    productVariantId: number;
    quantity: number;

    products: ProductType | null;
    productvariants: ProductVariantType | null;
}

export interface StockReturnType {
    id?: number;
    branchId: number;
    ref: string;
    returnBy: number;
    returnDate?: string | null; // Format: YYYY-MM-DD
    StatusType: string;
    note: string;
    delReason: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
    approvedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;
    approver?: UserType | null;
    returner?: UserType | null;

    branch: BranchType | null;
    returnDetails: StockReturnDetailType[];

    totalQuantity?: number;
}

export interface StockReturnDetailType {
    id: number;
    productId: number;
    productVariantId: number;
    quantity: number;

    products: ProductType | null;
    productvariants: ProductVariantType | null;
}

export interface ExpenseType {
    id: number;
    branchId: number;
    ref: string;
    expenseDate?: string | null; // Format: YYYY-MM-DD
    name: string;
    amount: number;
    description: string;
    delReason: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;

    branch?: BranchType | null;
}

export interface IncomeType {
    id: number;
    branchId: number;
    ref: string;
    incomeDate?: string | null; // Format: YYYY-MM-DD
    name: string;
    amount: number;
    description: string;
    delReason: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;

    branch: BranchType | null;
}

export interface OrderOnPaymentType {
    branchId: number | null;
    orderId: number | null;
    paymentDate?: Date;
    paymentMethodId: number | null;
    totalPaid: number | null;
    receive_usd?: number | null;
    receive_khr?: number | null;
    exchangerate?: number | null;
    createdAt: string | null;
    PaymentMethods: { name: string } | null;
    status?: string;
    delReason: string;
    createdDat?: Date;
    updatedDat?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;  

    order?: InvoiceType | null;
    branch?: BranchType | null;
    customer?: CustomerType | null;
}

export interface PurchaseAuthorizeAmountType {
    id?: number;
    amount: number;
    createdAt?: Date;
    updatedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
}

export interface ExchangeRateType {
    id?: number;
    amount: number;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: string;
    updatedBy?: string;

    creator?: UserType | null;
    updater?: UserType | null;
};

export interface SaleReturnType {
    id?: number;
    orderId?: number;
    branchId: number;
    customerId: number;
    ref: string;
    taxRate?: string | null;
    taxNet: number | null;
    discount?: number | null;
    shipping?: string | null;
    totalAmount: number;
    status: string;
    note: string;
    delReason: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;

    creator?: UserType | null;
    updater?: UserType | null;
    deleter?: UserType | null;

    branch: BranchType | null;
    customer?: CustomerType | null;
    customers: CustomerType | null;

    order?: InvoiceType | null;
    items: SaleReturnDetailType[];
}

export interface SaleReturnDetailType {
    id: number;
    saleReturnId: number;
    saleItemId: number;
    productId?: number;
    productVariantId?: number;
    serviceId?: number;
    ItemType: string;
    quantity: number;
    price: number;
    taxNet: number;
    taxMethod: string | null;
    discount: number;
    discountMethod: string | null;
    total: number;

    products?: ProductType | null;
    productvariants?: ProductVariantType | null;
    services?: ServiceType | null;
}