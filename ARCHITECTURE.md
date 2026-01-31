# PRD Extractor - Architecture Documentation

## System Overview

The PRD Extractor is a modular document processing system designed for scalability, flexibility, and ease of integration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
│  (Express, Next.js, Python, React, Direct Library Usage, etc.)  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│  - Authentication (API Key)                                      │
│  - Rate Limiting                                                 │
│  - Request Validation                                            │
│  - CORS Handling                                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌───────────────────────┐    ┌───────────────────────┐
│   Sync Processing     │    │   Async Processing    │
│   (Direct Response)   │    │   (Queue-based)       │
└──────────┬────────────┘    └──────────┬────────────┘
           │                            │
           │                            ▼
           │                 ┌──────────────────────┐
           │                 │   Redis Queue        │
           │                 │   (Bull)             │
           │                 └──────────┬───────────┘
           │                            │
           └────────────┬───────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Document Processor                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  1. File Type Detection                                    │ │
│  │  2. Format Conversion (if needed)                          │ │
│  │  3. OCR Engine Selection                                   │ │
│  │  4. Text Extraction                                        │ │
│  │  5. Content Parsing                                        │ │
│  │  6. Entity Extraction                                      │ │
│  │  7. Storage                                                │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────────┬────────────────────────────┬───────────────────────┘
             │                            │
             ▼                            ▼
┌─────────────────────┐        ┌──────────────────────┐
│   OCR Engines       │        │   Storage Backends   │
│  ┌───────────────┐  │        │  ┌────────────────┐  │
│  │  Tesseract    │  │        │  │  Local FS      │  │
│  │  (Local)      │  │        │  │                │  │
│  └───────────────┘  │        │  └────────────────┘  │
│  ┌───────────────┐  │        │  ┌────────────────┐  │
│  │  Google       │  │        │  │  MongoDB       │  │
│  │  Vision       │  │        │  │                │  │
│  └───────────────┘  │        │  └────────────────┘  │
│  ┌───────────────┐  │        │  ┌────────────────┐  │
│  │  Azure CV     │  │        │  │  PostgreSQL    │  │
│  │               │  │        │  │                │  │
│  └───────────────┘  │        │  └────────────────┘  │
└─────────────────────┘        └──────────────────────┘
```

## Component Details

### 1. API Gateway (`src/api/`)

**Responsibilities:**
- HTTP request handling
- Authentication & authorization
- Rate limiting
- Input validation
- Response formatting

**Key Files:**
- `routes.js` - API endpoints
- `middleware.js` - Auth, logging, error handling
- `server.js` - Express app setup

**Endpoints:**
- `POST /api/extract` - Upload and extract (sync/async)
- `POST /api/extract/buffer` - Extract from base64 buffer
- `GET /api/jobs/:jobId` - Get job status
- `GET /api/documents/:id` - Get document
- `GET /api/documents` - List documents
- `DELETE /api/documents/:id` - Delete document
- `GET /api/stats` - System statistics
- `GET /api/health` - Health check

### 2. Queue Manager (`src/queue/`)

**Responsibilities:**
- Async job management
- Job scheduling
- Retry logic
- Progress tracking
- Job status monitoring

**Technology:** Bull (Redis-backed queue)

**Features:**
- Configurable concurrency
- Automatic retries with exponential backoff
- Job timeout handling
- Event-driven notifications

### 3. Document Processor (`src/processor/`)

**Responsibilities:**
- Orchestrate document processing pipeline
- File type detection
- Format conversion
- OCR engine coordination
- Content parsing
- Entity extraction
- Storage management

**Processing Pipeline:**
```
Input File
    │
    ▼
File Type Detection
    │
    ├─ PDF ──────┬─ Native Text ─────▶ Extract Text
    │            └─ Scanned ──────────▶ OCR
    │
    ├─ Image ────────────────────────▶ OCR
    │
    └─ Office Doc ───────────────────▶ Extract Text
    │
    ▼
Content Parsing
    │
    ├─ Entity Extraction (dates, emails, amounts)
    ├─ Table Detection (TODO)
    └─ Form Detection (TODO)
    │
    ▼
Storage
    │
    └─ Save to configured backend
```

### 4. OCR Engines (`src/ocr/`)

**Architecture:** Factory Pattern + Strategy Pattern

**Base Class:** `BaseOCREngine`
- Defines interface for all OCR engines
- Common validation and formatting
- Result standardization

**Implementations:**

#### Tesseract (`tesseract.js`)
- **Type:** Local, free
- **Speed:** ~2-5 seconds/page
- **Accuracy:** Good
- **Languages:** 100+
- **Use Case:** Cost-effective, privacy-sensitive

#### Google Cloud Vision (`google-vision.js`)
- **Type:** Cloud, paid
- **Speed:** ~1-2 seconds/page
- **Accuracy:** Excellent
- **Languages:** 100+
- **Use Case:** High accuracy requirements

#### Azure Computer Vision (`azure-cv.js`)
- **Type:** Cloud, paid
- **Speed:** ~1-2 seconds/page
- **Accuracy:** Excellent
- **Languages:** 100+
- **Use Case:** Azure ecosystem integration

**Factory:** `OCREngineFactory`
- Creates and caches engine instances
- Manages engine lifecycle
- Validates configuration

### 5. Storage Backends (`src/storage/`)

**Architecture:** Factory Pattern + Repository Pattern

**Base Class:** `BaseStorage`
- Defines interface for all storage backends
- CRUD operations
- Query capabilities

**Implementations:**

#### Local Storage (`local.js`)
- **Type:** Filesystem
- **Use Case:** Development, small scale
- **Pros:** Simple, no dependencies
- **Cons:** Not scalable, no search

#### MongoDB (`mongodb.js`)
- **Type:** NoSQL database
- **Use Case:** Production, flexible schema
- **Pros:** Scalable, full-text search, flexible
- **Cons:** Requires MongoDB server

#### PostgreSQL (`postgresql.js`)
- **Type:** SQL database
- **Use Case:** Production, structured data
- **Pros:** ACID compliance, powerful queries
- **Cons:** Requires PostgreSQL server

**Factory:** `StorageFactory`
- Creates and manages storage instances
- Handles backend switching
- Validates configuration

### 6. Configuration (`src/config/`)

**Centralized configuration management:**
- Environment variables
- Default values
- Validation
- Type conversion

**Configuration Sections:**
- Server settings
- OCR provider settings
- Storage backend settings
- Processing limits
- Queue settings
- Logging settings

### 7. Utilities (`src/utils/`)

**Logger (`logger.js`):**
- Winston-based logging
- File rotation
- Multiple log levels
- Console output (dev)
- Structured logging

## Data Flow

### Synchronous Processing

```
1. Client uploads file via POST /api/extract
2. API validates file (size, format)
3. File saved to temp location
4. DocumentProcessor.processFile() called
5. File type detected
6. Appropriate OCR engine selected
7. Text extracted
8. Content parsed (entities, etc.)
9. Result saved to storage
10. Response returned to client
11. Temp file cleaned up
```

### Asynchronous Processing

```
1. Client uploads file with async=true
2. API validates file
3. Job created in Redis queue
4. Job ID returned to client immediately
5. Worker picks up job from queue
6. DocumentProcessor.processFile() called
7. Processing happens in background
8. Result saved to storage
9. Job marked as completed
10. Client polls GET /api/jobs/:jobId for status
11. Client retrieves result when ready
```

## Design Patterns

### 1. Factory Pattern
- **Where:** OCR engines, Storage backends
- **Why:** Easy to add new providers without changing client code

### 2. Strategy Pattern
- **Where:** OCR engine selection, Storage backend selection
- **Why:** Runtime selection of algorithms

### 3. Repository Pattern
- **Where:** Storage layer
- **Why:** Abstract data access, easy to swap backends

### 4. Facade Pattern
- **Where:** DocumentExtractor class
- **Why:** Simple interface for complex subsystem

### 5. Observer Pattern
- **Where:** Queue events
- **Why:** Decouple job processing from notifications

## Scalability Considerations

### Horizontal Scaling
```
┌──────────┐     ┌──────────────┐     ┌──────────┐
│  Client  │────▶│ Load Balancer│────▶│  API 1   │
└──────────┘     └──────────────┘     ├──────────┤
                                      │  API 2   │
                                      ├──────────┤
                                      │  API 3   │
                                      └────┬─────┘
                                           │
                                      ┌────▼─────┐
                                      │  Redis   │
                                      └────┬─────┘
                                           │
                                      ┌────▼─────┐
                                      │ Worker 1 │
                                      ├──────────┤
                                      │ Worker 2 │
                                      ├──────────┤
                                      │ Worker 3 │
                                      └──────────┘
```

### Performance Optimization

1. **Caching:** OCR engines are cached and reused
2. **Connection Pooling:** Database connections pooled
3. **Image Optimization:** Auto-resize and optimize before OCR
4. **Concurrent Processing:** Multiple jobs processed in parallel
5. **Smart PDF Handling:** Skip OCR for native PDFs

## Security Architecture

### Authentication
- API key-based authentication
- Bearer token in Authorization header
- Configurable per environment

### Input Validation
- File size limits
- Format whitelist
- MIME type checking
- Path traversal prevention

### Rate Limiting
- IP-based rate limiting
- 100 requests per 15 minutes (configurable)
- Prevents abuse

### Security Headers
- Helmet.js for HTTP headers
- CORS configuration
- XSS protection

## Error Handling

### Error Flow
```
Error Occurs
    │
    ▼
Logged to file
    │
    ▼
Job marked as failed (if async)
    │
    ▼
Error response to client
    │
    └─ Status code (4xx/5xx)
    └─ Error message
    └─ Stack trace (dev only)
```

### Retry Strategy
- Automatic retries for transient failures
- Exponential backoff
- Max 3 attempts
- Configurable timeout

## Extension Points

### Adding New OCR Engine

1. Create new class extending `BaseOCREngine`
2. Implement required methods
3. Add to `OCREngineFactory`
4. Update configuration

### Adding New Storage Backend

1. Create new class extending `BaseStorage`
2. Implement CRUD methods
3. Add to `StorageFactory`
4. Update configuration

### Adding Custom Parsers

1. Create parser class
2. Implement parsing logic
3. Register in `DocumentProcessor`
4. Configure in options

## Monitoring & Observability

### Logs
- Application logs: `logs/app.log`
- Error logs: `logs/error.log`
- Structured JSON format
- Rotation enabled

### Metrics (Available via API)
- Queue statistics
- Processing times
- Success/failure rates
- Storage usage

### Health Checks
- `/api/health` endpoint
- Database connectivity
- Queue connectivity
- OCR engine availability

## Future Enhancements

1. **Table Extraction:** Detect and extract tables
2. **Form Recognition:** Extract form fields
3. **Cloud Storage:** S3, GCS support
4. **Webhooks:** Notify on completion
5. **Batch Processing:** Process multiple files
6. **Custom Training:** Train custom OCR models
7. **PDF Generation:** Generate searchable PDFs
8. **Multi-language:** Better language detection
9. **Caching:** Cache OCR results
10. **Analytics:** Usage analytics dashboard
