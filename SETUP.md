# PRD Extractor - Setup Guide

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Optional: Install Python dependencies for additional OCR engines
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your preferred settings
# For local development, the defaults work fine
```

### 3. Start the Service

```bash
# Start the API server
npm start

# Or for development with auto-reload
npm run dev
```

### 4. Test the Service

```bash
# Upload a document
curl -X POST http://localhost:3000/api/extract \
  -H "Authorization: Bearer your-secret-api-key" \
  -F "file=@path/to/document.pdf"
```

## Deployment Options

### Option 1: Standalone API Service

Deploy as a microservice that other applications can call via HTTP:

1. Set up on a server (VPS, EC2, etc.)
2. Configure with production settings
3. Use PM2 or similar for process management
4. Set up reverse proxy (nginx/Apache)
5. Enable HTTPS

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/server.js --name prd-extractor

# Save PM2 configuration
pm2 save
pm2 startup
```

### Option 2: Library Integration

Use as a library in your Node.js applications:

```javascript
const { DocumentExtractor } = require('./prd_extractor/src');

const extractor = new DocumentExtractor({
  ocrProvider: 'tesseract',
  storageBackend: 'mongodb'
});

const result = await extractor.extract('document.pdf');
```

### Option 3: Docker Container

```dockerfile
# Dockerfile
FROM node:18

# Install Tesseract
RUN apt-get update && apt-get install -y tesseract-ocr

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t prd-extractor .
docker run -p 3000:3000 prd-extractor
```

## Storage Backend Setup

### Local Storage (Default)
No setup required. Files are stored in `./storage` directory.

### MongoDB

1. Install MongoDB or use MongoDB Atlas
2. Update `.env`:
```env
STORAGE_BACKEND=mongodb
MONGODB_URI=mongodb://localhost:27017/documents
```

### PostgreSQL

1. Install PostgreSQL
2. Create database:
```sql
CREATE DATABASE documents;
```
3. Update `.env`:
```env
STORAGE_BACKEND=postgresql
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=documents
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
```

## OCR Provider Setup

### Tesseract (Default - Free, Local)
Already included! No additional setup needed.

For additional languages:
```bash
# Install language packs (example for French)
# Ubuntu/Debian
sudo apt-get install tesseract-ocr-fra

# macOS
brew install tesseract-lang
```

### Google Cloud Vision (Paid, High Quality)

1. Create a Google Cloud project
2. Enable Vision API
3. Create service account and download JSON key
4. Update `.env`:
```env
OCR_PROVIDER=google_vision
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-cloud-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id
```

### Azure Computer Vision (Paid, High Quality)

1. Create Azure account
2. Create Computer Vision resource
3. Get endpoint and key
4. Update `.env`:
```env
OCR_PROVIDER=azure_cv
AZURE_CV_ENDPOINT=https://your-region.api.cognitive.microsoft.com/
AZURE_CV_KEY=your-key
```

## Queue System Setup (Optional)

For async processing with job queues:

1. Install Redis:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server

# macOS
brew install redis

# Start Redis
redis-server
```

2. Update `.env`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Integration Patterns

### Pattern 1: Microservice Architecture

```
┌─────────────┐
│   App 1     │───┐
└─────────────┘   │
                  │    ┌──────────────────┐
┌─────────────┐   ├───▶│  PRD Extractor   │
│   App 2     │───┤    │  (API Service)   │
└─────────────┘   │    └──────────────────┘
                  │
┌─────────────┐   │
│   App 3     │───┘
└─────────────┘
```

Each application calls the PRD Extractor API via HTTP.

### Pattern 2: Shared Library

```
┌─────────────────────────────┐
│      Your Application       │
│  ┌───────────────────────┐  │
│  │  PRD Extractor Lib    │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

Import the library directly into your application.

### Pattern 3: Event-Driven

```
┌─────────┐     ┌─────────┐     ┌──────────────┐
│  App    │────▶│  Queue  │────▶│ PRD Extractor│
└─────────┘     └─────────┘     └──────────────┘
                                       │
                                       ▼
                                ┌─────────────┐
                                │  Webhook    │
                                └─────────────┘
```

Applications submit jobs to a queue, PRD Extractor processes them asynchronously.

## Performance Tuning

### For High Volume

1. **Use Redis Queue**: Enable async processing
2. **Scale Workers**: Increase `MAX_CONCURRENT_JOBS`
3. **Use Cloud OCR**: Google Vision or Azure for better performance
4. **Database Storage**: Use MongoDB or PostgreSQL instead of local files
5. **Load Balancing**: Run multiple instances behind a load balancer

### For Accuracy

1. **Increase DPI**: Set `OCR_DPI=600` for better quality
2. **Use Cloud OCR**: Google Vision or Azure have better accuracy
3. **Preprocess Images**: The system auto-optimizes, but manual preprocessing helps
4. **Adjust Confidence**: Lower `OCR_CONFIDENCE_THRESHOLD` if needed

## Monitoring

### Logs
```bash
# View logs
tail -f logs/app.log

# View errors only
tail -f logs/error.log
```

### API Stats
```bash
curl http://localhost:3000/api/stats \
  -H "Authorization: Bearer your-api-key"
```

### Queue Stats (if using Redis)
```bash
# Connect to Redis
redis-cli

# View queue stats
KEYS bull:document-processing:*
```

## Troubleshooting

### Issue: "Tesseract not found"
**Solution**: Install Tesseract OCR
```bash
# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# macOS
brew install tesseract
```

### Issue: "Redis connection failed"
**Solution**: Start Redis server or disable queue
```bash
redis-server
```

### Issue: "MongoDB connection failed"
**Solution**: Check MongoDB is running or switch to local storage
```env
STORAGE_BACKEND=local
```

### Issue: "Low OCR accuracy"
**Solution**: 
- Use higher DPI images
- Switch to cloud OCR provider
- Preprocess images (contrast, brightness)

## Security Best Practices

1. **Change API Key**: Update `API_KEY` in `.env`
2. **Use HTTPS**: In production, always use HTTPS
3. **Rate Limiting**: Already enabled (100 req/15min per IP)
4. **File Validation**: Only allowed formats are processed
5. **Size Limits**: Default 50MB, adjust as needed
6. **Sanitize Inputs**: Never trust user input
7. **Secure Credentials**: Keep `.env` and credential files private

## Next Steps

1. Read the [README.md](README.md) for full documentation
2. Check [examples/](examples/) for integration examples
3. Test with your documents
4. Configure for your use case
5. Deploy to production

## Support

For issues or questions:
1. Check the logs: `logs/app.log`
2. Review this setup guide
3. Check the examples
4. Review the code documentation
