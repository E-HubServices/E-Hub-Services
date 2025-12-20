# Self-Declaration E-Signature Workflow

## Complete Flow Documentation

### 📋 **Workflow Overview**

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SELF-DECLARATION SIGNATURE FLOW                  │
└─────────────────────────────────────────────────────────────────────┘

Step 1: SHOP OWNER INITIATES
┌──────────────────────────────────────────────────────────────┐
│  Shop Owner (Partner)                                        │
│  ├─ Opens Service Request Detail Page                        │
│  ├─ Sees "Partner Controls" section                          │
│  ├─ Clicks "Upload & Request Signature"                      │
│  ├─ Selects PDF file (e.g., self-declaration form)           │
│  └─ System uploads PDF and sends request                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  Backend (convex/requests.ts)                                │
│  ├─ requestCustomerSignature mutation triggered              │
│  ├─ Updates request.signatureStatus = "requested"            │
│  ├─ Stores request.unsignedFileId                            │
│  └─ Creates system message to notify customer                │
└──────────────────────────────────────────────────────────────┘
                            ↓
Step 2: CUSTOMER RECEIVES NOTIFICATION
┌──────────────────────────────────────────────────────────────┐
│  Customer                                                     │
│  ├─ Opens Service Request Detail Page                        │
│  ├─ Sees "Action Required" amber alert box                   │
│  ├─ Message: "Your partner has requested a signature..."     │
│  └─ Button: "Sign Document Now"                              │
└──────────────────────────────────────────────────────────────┘
                            ↓
Step 3: CUSTOMER SIGNS DOCUMENT
┌──────────────────────────────────────────────────────────────┐
│  PdfSignatureEditor Component Opens                          │
│  ├─ Displays PDF document (unsigned version)                 │
│  ├─ Customer clicks "Draw New Signature"                     │
│  ├─ Draws signature on canvas                                │
│  ├─ Signature converted to transparent PNG                   │
│  ├─ Customer drags signature to correct position             │
│  ├─ Can add multiple signatures if needed                    │
│  └─ Clicks "Submit Signed Document"                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  Frontend Processing (RequestDetail.tsx)                     │
│  ├─ handleSignComplete() function triggered                  │
│  ├─ embedSignaturesInPdf() - embeds all signatures           │
│  ├─ Uploads signed PDF to Convex storage                     │
│  └─ Calls submitSelfDeclaration mutation                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  Backend (convex/requests.ts)                                │
│  ├─ submitSelfDeclaration mutation triggered                 │
│  ├─ Verifies customer authorization                          │
│  ├─ Creates signed_declarations record                       │
│  ├─ Updates request.signatureStatus = "signed"               │
│  ├─ Stores request.signedFileId                              │
│  └─ Creates system message to notify shop owner              │
└──────────────────────────────────────────────────────────────┘
                            ↓
Step 4: SHOP OWNER RECEIVES SIGNED DOCUMENT
┌──────────────────────────────────────────────────────────────┐
│  Shop Owner (Partner)                                        │
│  ├─ Opens Service Request Detail Page                        │
│  ├─ Sees "Signature Received" green success box              │
│  ├─ Button: "Download Signed PDF"                            │
│  ├─ Downloads and reviews signed document                    │
│  ├─ Processes the signed declaration                         │
│  └─ Can now proceed with service completion                  │
└──────────────────────────────────────────────────────────────┘
                            ↓
Step 5: SHOP OWNER UPLOADS FINAL RESULT
┌──────────────────────────────────────────────────────────────┐
│  Shop Owner (Partner)                                        │
│  ├─ Completes document processing                            │
│  ├─ Clicks "Upload Final Result"                             │
│  ├─ Uploads completed/certified document                     │
│  ├─ Request status changes to "completed"                    │
│  └─ Customer can download final document                     │
└──────────────────────────────────────────────────────────────┘
```

## 🔄 **Status Transitions**

### Signature Status Field
```typescript
signatureStatus: "none" | "requested" | "signed"
```

| Status | Description | Visible To | Actions Available |
|--------|-------------|------------|-------------------|
| `none` or `undefined` | No signature requested | Shop Owner | "Upload & Request Signature" |
| `requested` | Waiting for customer signature | Both | Customer: "Sign Document Now"<br>Owner: "Waiting..." |
| `signed` | Customer has signed | Both | Owner: "Download Signed PDF" |

### Request Status Field
```typescript
status: "pending" | "assigned" | "in_progress" | "completed" | "cancelled"
```

The signature workflow runs **parallel** to the main request status.

## 📁 **File Storage**

### Database Fields (service_requests table)
```typescript
{
  signatureStatus: "none" | "requested" | "signed",
  unsignedFileId: Id<"_storage">,  // PDF sent by owner
  signedFileId: Id<"_storage">,    // PDF signed by customer
}
```

### Storage Flow
1. **Owner uploads** → `unsignedFileId` stored
2. **Customer signs** → `signedFileId` stored
3. **Both files** remain accessible for audit trail

## 💬 **System Messages**

### When Signature Requested
```typescript
{
  text: "Action Required: Please sign the attached document to proceed.",
  messageType: "system",
  attachments: [unsignedFileId]
}
```

### When Document Signed
```typescript
{
  text: "Document signed and submitted successfully.",
  messageType: "system",
  attachments: [signedFileId]
}
```

## 🎨 **UI Components**

### Shop Owner View (Lines 442-535)
```tsx
{/* Signature Workflow Section */}
{!signatureStatus ? (
  // Upload & Request Signature button
) : signatureStatus === 'requested' ? (
  // Waiting for customer signature...
) : signatureStatus === 'signed' ? (
  // Signature Received + Download button
) : null}
```

### Customer View (Lines 423-440)
```tsx
{isCustomer && signatureStatus === "requested" && (
  <div className="bg-amber-50 border-amber-200">
    <h3>Action Required</h3>
    <p>Your partner has requested a signature...</p>
    <Button onClick={() => setIsSigninOpen(true)}>
      Sign Document Now
    </Button>
  </div>
)}
```

## 🔐 **Security & Validation**

### Backend Validation
- ✅ Verifies user is the customer before allowing signature
- ✅ Checks request exists and user has access
- ✅ Stores IP address and user agent for audit
- ✅ Creates immutable audit trail in `signed_declarations` table

### Frontend Validation
- ✅ Only shows "Sign" button to customers
- ✅ Only shows "Request Signature" to shop owners
- ✅ Prevents submission without signatures
- ✅ Validates PDF URLs before opening editor

## 📱 **Mobile Support**

The signature editor is fully responsive:
- **Desktop**: Horizontal split (PDF left, tools right)
- **Mobile**: Vertical stack (PDF top, tools bottom)
- **Touch**: Optimized for touch drawing and dragging

## 🎯 **Key Features**

1. **Transparent Signatures**: White background automatically removed
2. **Multi-Signature**: Support for multiple signature fields
3. **Drag & Drop**: Place signatures anywhere on document
4. **Real-time Preview**: See signatures on PDF before submitting
5. **Edit Before Submit**: Delete/reposition signatures freely
6. **No Edit After Upload**: Once submitted, signatures are final

## 📊 **Database Schema**

### signed_declarations Table
```typescript
{
  userId: Id<"users">,
  serviceRequestId: Id<"service_requests">,
  signatureUrl: string,
  signedPdfUrl: string,
  signedAt: number,
  ipAddress: string,
  userAgent: string,
}
```

## 🚀 **Testing the Flow**

### As Shop Owner:
1. Navigate to any service request
2. Look for "Partner Controls" section
3. Click "Upload & Request Signature"
4. Select a PDF file (e.g., self-declaration form)
5. Wait for "Waiting for customer signature..." message

### As Customer:
1. Navigate to the same service request
2. See amber "Action Required" alert
3. Click "Sign Document Now"
4. Draw signature, place on document
5. Submit signed document

### As Shop Owner (After Signing):
1. Refresh the request page
2. See green "Signature Received" message
3. Click "Download Signed PDF"
4. Verify signatures are correctly placed
5. Proceed with "Upload Final Result"

---

**Status**: ✅ **FULLY IMPLEMENTED AND WORKING**
**Last Updated**: December 21, 2025
