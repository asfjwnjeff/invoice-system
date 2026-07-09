// Tax Channel Adapter (Mock in prototype, replace with real tax platform later)
export interface InvoiceIssueInput { applicationId: string; sellerTaxNo: string; buyerTaxNo?: string; buyerName: string; invoiceType: string; amountWithoutTax: number; taxAmount: number; amountWithTax: number; items: Array<{ itemName: string; taxCode: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number }>; }
export interface InvoiceIssueResult { success: boolean; invoiceNo?: string; taxFlowNo?: string; issueDate?: string; errorCode?: string; errorMessage?: string; }
export interface InvoiceChannelAdapter { preCheck(input: InvoiceIssueInput): Promise<{ success: boolean; errors?: string[] }>; issue(input: InvoiceIssueInput): Promise<InvoiceIssueResult>; query(requestId: string): Promise<InvoiceIssueResult>; redIssue(input: { originalInvoiceId: string; redType: string; reason: string; amountWithTax: number }): Promise<InvoiceIssueResult>; voidInvoice(input: { invoiceId: string; reason: string }): Promise<{ success: boolean }>; }

// Tax Verification Adapter
export interface VerifyInvoiceInput { invoiceNo: string; invoiceCode?: string; invoiceType: string; issueDate: string; amountWithTax: number; sellerTaxNo: string; }
export interface VerifyInvoiceResult { success: boolean; exists: boolean; amountMatch: boolean; sellerStatus: string; invoiceStatus: string; message: string; }
export interface TaxVerificationAdapter { verifyInvoice(input: VerifyInvoiceInput): Promise<VerifyInvoiceResult>; batchVerify(inputs: VerifyInvoiceInput[]): Promise<VerifyInvoiceResult[]>; }

// Delivery Adapter
export interface DeliveryResult { success: boolean; deliveryId?: string; deliveredAt?: string; error?: string; }
export interface DeliveryAdapter { sendEmail(input: { invoiceId: string; toEmail: string }): Promise<DeliveryResult>; generateQrCode(input: { invoiceId: string }): Promise<DeliveryResult>; }

// OCR Adapter
export interface OcrResult { success: boolean; invoiceNo?: string; sellerName?: string; amountWithTax?: number; }
export interface OcrAdapter { parse(input: { fileUrl: string; fileType: string }): Promise<OcrResult>; }

// ERP Adapter
export interface ErpAdapter { writeBackInvoice(input: { invoiceId: string; voucherType: string }): Promise<{ success: boolean; voucherNo?: string }>; }
