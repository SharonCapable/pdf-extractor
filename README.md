# PRD Extractor - Document OCR & Parsing Service

A robust, modular document extraction service that performs OCR on documents and parses them into structured storage. Designed to be reusable across multiple applications.

## Features

- **Multiple OCR Providers**: Tesseract (local), Google Cloud Vision, Azure Computer Vision
- **Intelligent Parsing**: Extract structured data from various document types (PDFs, images, scanned documents)
- **Flexible Storage**: Support for local filesystem, cloud storage (S3, GCS), and databases (MongoDB, PostgreSQL)
- **Async Processing**: Queue-based system for handling large documents
- **RESTful API**: Easy integration with any application
- **Document Classification**: Automatic document type detection
- **Text Extraction**: Raw text, tables, forms, and metadata
- **Multi-language Support**: OCR in multiple languages

## Architecture

```
┌─────────────────┐
│   Client Apps   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Gateway   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Queue Manager  │────▶│ OCR Engines  │
└────────┬────────┘     └──────────────┘
         │                     │
         ▼                     ▼
┌─────────────────┐     ┌──────────────┐
│  Document       │────▶│   Parsers    │
│  Processor      │     └──────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Storage Layer  │
└─────────────────┘
```

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# For Python OCR engines
pip install -r requirements.txt
```

### Configuration

Create a `.env` file:

```env
# OCR Provider (tesseract, google_vision, azure_cv)
OCR_PROVIDER=tesseract

# Storage Backend (local, s3, gcs, mongodb, postgresql)
STORAGE_BACKEND=local

# API Configuration
PORT=3000
API_KEY=your-secret-key

# Google Cloud Vision (if using)
GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# Azure Computer Vision (if using)
AZURE_CV_ENDPOINT=https://your-endpoint.cognitiveservices.azure.com/
AZURE_CV_KEY=your-key

# Storage Configuration
LOCAL_STORAGE_PATH=./storage
MONGODB_URI=mongodb://localhost:27017/documents
POSTGRES_URI=postgresql://user:pass@localhost:5432/documents
```

### Usage

#### As a Standalone Service

```bash
npm start
```

#### As a Library

```javascript
const { DocumentExtractor } = require('./src/extractor');

const extractor = new DocumentExtractor({
  ocrProvider: 'tesseract',
  storageBackend: 'local'
});

// Extract from file
const result = await extractor.extract('path/to/document.pdf');

// Extract from buffer
const result = await extractor.extractFromBuffer(buffer, 'document.pdf');
```

#### Via API

```bash
# Upload document for extraction
curl -X POST http://localhost:3000/api/extract \
  -H "Authorization: Bearer your-api-key" \
  -F "file=@document.pdf"

# Get extraction status
curl http://localhost:3000/api/extract/{jobId} \
  -H "Authorization: Bearer your-api-key"

# Retrieve extracted data
curl http://localhost:3000/api/documents/{documentId} \
  -H "Authorization: Bearer your-api-key"
```

## Integration Examples

### Express.js Application

```javascript
const express = require('express');
const { DocumentExtractor } = require('prd-extractor');

const app = express();
const extractor = new DocumentExtractor();

app.post('/upload', async (req, res) => {
  const result = await extractor.extract(req.file.path);
  res.json(result);
});
```

### Next.js API Route

```javascript
import { DocumentExtractor } from 'prd-extractor';

export default async function handler(req, res) {
  const extractor = new DocumentExtractor();
  const result = await extractor.extractFromBuffer(
    req.body.file,
    req.body.filename
  );
  res.json(result);
}
```

### Python Integration

```python
import requests

# Upload document
with open('document.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:3000/api/extract',
        files={'file': f},
        headers={'Authorization': 'Bearer your-api-key'}
    )
    
result = response.json()
```

## Output Format

```json
{
  "documentId": "uuid",
  "filename": "document.pdf",
  "status": "completed",
  "metadata": {
    "pages": 10,
    "language": "en",
    "documentType": "invoice",
    "createdAt": "2026-01-27T13:45:12Z",
    "processingTime": 5.2
  },
  "content": {
    "fullText": "Extracted text...",
    "pages": [
      {
        "pageNumber": 1,
        "text": "Page 1 text...",
        "confidence": 0.95
      }
    ],
    "tables": [],
    "forms": [],
    "entities": {
      "dates": [],
      "amounts": [],
      "emails": [],
      "phones": []
    }
  },
  "storageLocation": "s3://bucket/documents/uuid.json"
}
```

## Supported Document Types

- PDF (native and scanned)
- Images (PNG, JPEG, TIFF, BMP)
- Office documents (DOCX, XLSX, PPTX)
- Scanned documents
- Multi-page documents

## Advanced Features

### Custom Parsers

Create custom parsers for specific document types:

```javascript
const { BaseParser } = require('./src/parsers/base');

class InvoiceParser extends BaseParser {
  parse(ocrResult) {
    // Custom parsing logic
    return {
      invoiceNumber: this.extractInvoiceNumber(ocrResult),
      amount: this.extractAmount(ocrResult),
      date: this.extractDate(ocrResult)
    };
  }
}

extractor.registerParser('invoice', new InvoiceParser());
```

### Webhooks

Configure webhooks for async notifications:

```javascript
extractor.on('completed', (result) => {
  // Send webhook notification
  fetch('https://your-app.com/webhook', {
    method: 'POST',
    body: JSON.stringify(result)
  });
});
```

## Performance

- **Tesseract**: ~2-5 seconds per page (local, free)
- **Google Vision**: ~1-2 seconds per page (cloud, paid)
- **Azure CV**: ~1-2 seconds per page (cloud, paid)

## License

MIT
