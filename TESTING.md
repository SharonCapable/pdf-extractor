# 🧪 Testing the PRD Extractor

## Quick Test Guide

### Step 1: Start the Server (Already Running ✓)

Your server is already running! You should see:
```
info: PRD Extractor API server running on port 3000
info: OCR Provider: tesseract
info: Storage Backend: local
```

### Step 2: Open the Test Interface

**Option 1: Open in Browser**
1. Open your browser
2. Go to: **http://localhost:3000**
3. You'll see a beautiful upload interface!

**Option 2: Direct File Access**
- Open the file: `prd_extractor/public/index.html` directly in your browser

### Step 3: Test Document Upload

1. **Click the upload area** or **drag & drop** a document
2. Supported formats:
   - ✅ PDF files (.pdf)
   - ✅ Images (.png, .jpg, .jpeg, .tiff, .bmp)
   - ✅ Office docs (.docx, .xlsx)

3. Watch the progress bar as it processes
4. View the results in three tabs:
   - **Extracted Text** - Full text from document
   - **Entities** - Emails, dates, phone numbers, amounts
   - **JSON Response** - Complete API response

### Step 4: What to Test

#### Test 1: PDF Document
- Upload a PDF file
- Check if text is extracted correctly
- Verify metadata (pages, language, processing time)

#### Test 2: Image with Text
- Upload a screenshot or scanned document
- OCR should extract the text
- Check confidence and accuracy

#### Test 3: Invoice/Receipt
- Upload an invoice or receipt
- Check if entities are extracted:
  - Amounts ($100.00)
  - Dates (2024-01-27)
  - Emails (billing@company.com)

#### Test 4: Resume/CV
- Upload a resume
- Check for:
  - Email addresses
  - Phone numbers
  - Dates

### Expected Results

**Successful Extraction:**
```
✓ Extraction Complete

Metadata:
- Pages: 1
- Language: en
- Processing Time: 2.3s
- Document Type: document

Extracted Text:
[Your document text here...]

Entities:
📧 Emails: email@example.com
📅 Dates: 2024-01-27
💰 Amounts: $100.00
```

### Troubleshooting

**Issue: "Error: Failed to fetch"**
- **Solution**: Make sure the server is running (`npm start`)
- Check that it's on port 3000

**Issue: "No text extracted"**
- **Solution**: 
  - Try a different document
  - Check if the image has clear text
  - For scanned PDFs, OCR might take longer

**Issue: "Low accuracy"**
- **Solution**:
  - Use higher quality images
  - Ensure text is clear and readable
  - Consider using cloud OCR (Google Vision or Azure)

### Sample Test Documents

Create some test files:

**1. Simple Text File → PDF**
- Create a Word doc with text
- Save as PDF
- Upload and test

**2. Screenshot**
- Take a screenshot of text
- Save as PNG
- Upload and test

**3. Invoice**
- Create a simple invoice with:
  - Date
  - Amount
  - Email
- Upload and verify entities are extracted

### API Testing (Optional)

You can also test via command line:

```bash
# Test with curl
curl -X POST http://localhost:3000/api/extract \
  -H "Authorization: Bearer your-secret-api-key" \
  -F "file=@path/to/document.pdf"
```

### Next Steps After Testing

Once you confirm it works:

1. **Deploy to Production**
   - Follow [SETUP.md](../SETUP.md)
   - Configure cloud OCR if needed
   - Set up database storage

2. **Integrate with Your Apps**
   - Use [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md)
   - Call the API from your applications

3. **Scale as Needed**
   - Add Redis for queue
   - Use MongoDB/PostgreSQL
   - Deploy multiple instances

### Features to Test

- [x] File upload (click or drag-drop)
- [x] Progress indicator
- [x] Text extraction
- [x] Entity extraction
- [x] Metadata display
- [x] JSON response viewer
- [x] Copy JSON functionality
- [x] Error handling
- [x] Multiple file formats

### Test Checklist

- [ ] Upload a PDF - text extracted correctly
- [ ] Upload an image - OCR works
- [ ] Upload a document with email - email extracted
- [ ] Upload a document with dates - dates extracted
- [ ] Upload a document with amounts - amounts extracted
- [ ] Check processing time is reasonable
- [ ] Verify JSON response is complete
- [ ] Test error handling (invalid file)

---

## 🎉 Ready to Test!

1. **Server is running** ✓
2. **Frontend is ready** ✓
3. **Open browser**: http://localhost:3000
4. **Upload a document** and see the magic! ✨

**Enjoy testing!** 📄🚀
