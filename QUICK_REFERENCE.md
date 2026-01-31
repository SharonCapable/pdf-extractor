# PRD Extractor - Quick Reference

## Installation

```bash
npm install
cp .env.example .env
# Edit .env with your settings
npm start
```

## Basic Usage

### As API Service

```bash
# Start server
npm start

# Upload document
curl -X POST http://localhost:3000/api/extract \
  -H "Authorization: Bearer your-api-key" \
  -F "file=@document.pdf"
```

### As Library

```javascript
const { DocumentExtractor } = require('./prd_extractor/src');

const extractor = new DocumentExtractor();
const result = await extractor.extract('document.pdf');
console.log(result.content.fullText);
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/extract` | Upload and extract document |
| POST | `/api/extract/buffer` | Extract from base64 buffer |
| GET | `/api/jobs/:jobId` | Get async job status |
| GET | `/api/documents/:id` | Get document by ID |
| GET | `/api/documents` | List all documents |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/stats` | System statistics |
| GET | `/api/health` | Health check |

## Configuration Options

### OCR Providers
- `tesseract` - Free, local (default)
- `google_vision` - Paid, cloud, high accuracy
- `azure_cv` - Paid, cloud, high accuracy

### Storage Backends
- `local` - Filesystem (default)
- `mongodb` - MongoDB database
- `postgresql` - PostgreSQL database

### Environment Variables

```env
# Core Settings
OCR_PROVIDER=tesseract
STORAGE_BACKEND=local
PORT=3000
API_KEY=your-secret-key

# Processing
MAX_FILE_SIZE_MB=50
MAX_CONCURRENT_JOBS=5
OCR_LANGUAGE=eng
```

## Common Tasks

### Extract from PDF
```javascript
const result = await extractor.extract('document.pdf');
```

### Extract from Image
```javascript
const result = await extractor.extract('scan.png');
```

### Extract from Buffer
```javascript
const buffer = fs.readFileSync('document.pdf');
const result = await extractor.extractFromBuffer(buffer, 'document.pdf');
```

### Get Document
```javascript
const doc = await extractor.getDocument(documentId);
```

### List Documents
```javascript
const docs = await extractor.listDocuments({ limit: 10 });
```

### Async Processing
```javascript
// Initialize with queue support
const extractor = new DocumentExtractor({ useQueue: true });
await extractor.initialize();

// Submit job
const job = await extractor.extractAsync('large-document.pdf');

// Check status
const status = await extractor.getJobStatus(job.id);
```

## Response Format

```json
{
  "documentId": "uuid",
  "filename": "document.pdf",
  "status": "completed",
  "metadata": {
    "pages": 10,
    "language": "en",
    "documentType": "document",
    "processingTime": 5.2
  },
  "content": {
    "fullText": "Extracted text...",
    "pages": [...],
    "entities": {
      "emails": ["email@example.com"],
      "dates": ["2024-01-27"],
      "amounts": ["$100.00"]
    }
  },
  "storageLocation": "local://storage/uuid.json"
}
```

## Integration Examples

### Express.js
```javascript
app.post('/upload', upload.single('file'), async (req, res) => {
  const result = await extractor.extract(req.file.path);
  res.json(result);
});
```

### Next.js API Route
```javascript
export default async function handler(req, res) {
  const result = await extractor.extract(file.path);
  res.json(result);
}
```

### Python Client
```python
import requests

with open('document.pdf', 'rb') as f:
    response = requests.post(
        'http://localhost:3000/api/extract',
        files={'file': f},
        headers={'Authorization': 'Bearer your-api-key'}
    )
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Tesseract not found" | Install: `apt-get install tesseract-ocr` |
| "Redis connection failed" | Start Redis: `redis-server` |
| "Low accuracy" | Use cloud OCR or increase DPI |
| "File too large" | Increase `MAX_FILE_SIZE_MB` |

## File Structure

```
prd_extractor/
├── src/
│   ├── api/          # API routes and middleware
│   ├── config/       # Configuration
│   ├── ocr/          # OCR engines
│   ├── processor/    # Document processor
│   ├── queue/        # Queue manager
│   ├── storage/      # Storage backends
│   ├── utils/        # Utilities
│   ├── index.js      # Library entry point
│   └── server.js     # API server
├── examples/         # Integration examples
├── .env              # Configuration
├── package.json      # Dependencies
└── README.md         # Documentation
```

## Performance Tips

1. **Use async processing** for large documents
2. **Use cloud OCR** for better accuracy and speed
3. **Use database storage** for production
4. **Enable Redis queue** for high volume
5. **Scale horizontally** with load balancer

## Security Checklist

- [ ] Change default API key
- [ ] Use HTTPS in production
- [ ] Set appropriate file size limits
- [ ] Whitelist allowed file formats
- [ ] Enable rate limiting
- [ ] Secure credential files
- [ ] Use environment variables

## Support

- **Documentation:** README.md, SETUP.md, ARCHITECTURE.md
- **Examples:** examples/ directory
- **Logs:** logs/app.log, logs/error.log

## Quick Commands

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode
npm run dev

# Run example
node examples/standalone.js

# View logs
tail -f logs/app.log

# Test API
curl http://localhost:3000/api/health
```
