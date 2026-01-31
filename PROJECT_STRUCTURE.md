# PRD Extractor - Project Structure

```
prd_extractor/
│
├── 📄 README.md                    # Main documentation
├── 📄 SETUP.md                     # Setup and deployment guide
├── 📄 ARCHITECTURE.md              # Architecture documentation
├── 📄 QUICK_REFERENCE.md           # Quick reference guide
├── 📄 package.json                 # Node.js dependencies
├── 📄 requirements.txt             # Python dependencies
├── 📄 .env                         # Environment configuration
├── 📄 .env.example                 # Environment template
├── 📄 .gitignore                   # Git ignore rules
│
├── 📁 src/                         # Source code
│   │
│   ├── 📄 index.js                 # Library entry point
│   ├── 📄 server.js                # API server entry point
│   │
│   ├── 📁 api/                     # API layer
│   │   ├── routes.js               # API endpoints
│   │   └── middleware.js           # Auth, logging, errors
│   │
│   ├── 📁 config/                  # Configuration
│   │   └── index.js                # Centralized config
│   │
│   ├── 📁 ocr/                     # OCR engines
│   │   ├── base.js                 # Base OCR class
│   │   ├── tesseract.js            # Tesseract implementation
│   │   ├── google-vision.js        # Google Vision implementation
│   │   ├── azure-cv.js             # Azure CV implementation
│   │   └── factory.js              # OCR factory
│   │
│   ├── 📁 processor/               # Document processing
│   │   └── index.js                # Main processor
│   │
│   ├── 📁 queue/                   # Queue management
│   │   └── index.js                # Bull queue manager
│   │
│   ├── 📁 storage/                 # Storage backends
│   │   ├── base.js                 # Base storage class
│   │   ├── local.js                # Local filesystem
│   │   ├── mongodb.js              # MongoDB backend
│   │   ├── postgresql.js           # PostgreSQL backend
│   │   └── factory.js              # Storage factory
│   │
│   └── 📁 utils/                   # Utilities
│       └── logger.js               # Winston logger
│
├── 📁 examples/                    # Integration examples
│   ├── README.md                   # Examples documentation
│   ├── express-app.js              # Express.js integration
│   ├── nextjs-api.js               # Next.js API route
│   ├── python-client.py            # Python client
│   └── standalone.js               # Standalone usage
│
├── 📁 storage/                     # Local storage (created at runtime)
│   └── (document JSON files)
│
├── 📁 logs/                        # Application logs (created at runtime)
│   ├── app.log                     # All logs
│   └── error.log                   # Error logs only
│
├── 📁 uploads/                     # Temporary uploads (created at runtime)
│   └── (temporary files)
│
└── 📁 credentials/                 # API credentials (optional)
    ├── google-cloud-key.json       # Google Cloud credentials
    └── (other credential files)
```

## Component Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                         index.js                             │
│                   (Library Entry Point)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              DocumentExtractor                         │ │
│  │  - Main public API                                     │ │
│  │  - Wraps DocumentProcessor                             │ │
│  │  - Wraps QueueManager (optional)                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        server.js                             │
│                     (API Entry Point)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  Express App                           │ │
│  │  - HTTP server                                         │ │
│  │  - Middleware stack                                    │ │
│  │  - Route handlers                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      api/routes.js                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  POST   /api/extract                                   │ │
│  │  POST   /api/extract/buffer                            │ │
│  │  GET    /api/jobs/:jobId                               │ │
│  │  GET    /api/documents/:id                             │ │
│  │  GET    /api/documents                                 │ │
│  │  DELETE /api/documents/:id                             │ │
│  │  GET    /api/stats                                     │ │
│  │  GET    /api/health                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│  processor/index.js      │   │  queue/index.js          │
│  ┌────────────────────┐  │   │  ┌────────────────────┐  │
│  │ DocumentProcessor  │  │   │  │  QueueManager      │  │
│  │  - processFile()   │  │   │  │  - addJob()        │  │
│  │  - processBuffer() │  │   │  │  - getStatus()     │  │
│  │  - getDocument()   │  │   │  │  - Bull + Redis    │  │
│  └────────────────────┘  │   │  └────────────────────┘  │
└──────────────────────────┘   └──────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────┐
│ ocr/factory  │  │storage/      │
│              │  │factory       │
│ ┌──────────┐ │  │ ┌──────────┐ │
│ │Tesseract │ │  │ │  Local   │ │
│ └──────────┘ │  │ └──────────┘ │
│ ┌──────────┐ │  │ ┌──────────┐ │
│ │ Google   │ │  │ │ MongoDB  │ │
│ │ Vision   │ │  │ └──────────┘ │
│ └──────────┘ │  │ ┌──────────┐ │
│ ┌──────────┐ │  │ │PostgreSQL│ │
│ │ Azure CV │ │  │ └──────────┘ │
│ └──────────┘ │  └──────────────┘
└──────────────┘
```

## File Dependencies

```
server.js
  ├── requires: config/index.js
  ├── requires: utils/logger.js
  ├── requires: api/routes.js
  └── requires: api/middleware.js

api/routes.js
  ├── requires: processor/index.js
  ├── requires: queue/index.js
  └── requires: utils/logger.js

processor/index.js
  ├── requires: ocr/factory.js
  ├── requires: storage/factory.js
  ├── requires: config/index.js
  └── requires: utils/logger.js

ocr/factory.js
  ├── requires: ocr/tesseract.js
  ├── requires: ocr/google-vision.js
  └── requires: ocr/azure-cv.js

storage/factory.js
  ├── requires: storage/local.js
  ├── requires: storage/mongodb.js
  └── requires: storage/postgresql.js

queue/index.js
  ├── requires: processor/index.js
  ├── requires: config/index.js
  └── requires: utils/logger.js
```

## Data Flow Diagram

```
┌─────────┐
│  Client │
└────┬────┘
     │
     │ 1. Upload File
     ▼
┌─────────────┐
│ API Routes  │
└────┬────────┘
     │
     │ 2. Validate & Save
     ▼
┌──────────────┐
│  Processor   │
└────┬─────────┘
     │
     │ 3. Detect Type
     ▼
┌──────────────┐
│ OCR Engine   │◄──── Factory selects engine
└────┬─────────┘
     │
     │ 4. Extract Text
     ▼
┌──────────────┐
│   Parser     │
└────┬─────────┘
     │
     │ 5. Extract Entities
     ▼
┌──────────────┐
│   Storage    │◄──── Factory selects backend
└────┬─────────┘
     │
     │ 6. Save Result
     ▼
┌─────────────┐
│   Client    │
└─────────────┘
```

## Module Responsibilities

| Module | Responsibility | Key Classes |
|--------|----------------|-------------|
| `api/` | HTTP interface | Express routes, middleware |
| `config/` | Configuration | Config loader |
| `ocr/` | Text extraction | OCR engines, factory |
| `processor/` | Orchestration | DocumentProcessor |
| `queue/` | Async jobs | QueueManager, Bull |
| `storage/` | Data persistence | Storage backends, factory |
| `utils/` | Shared utilities | Logger |

## Extension Points

### Adding New OCR Engine

1. Create `src/ocr/new-engine.js`
2. Extend `BaseOCREngine`
3. Add to `ocr/factory.js`
4. Update config

### Adding New Storage Backend

1. Create `src/storage/new-backend.js`
2. Extend `BaseStorage`
3. Add to `storage/factory.js`
4. Update config

### Adding New Parser

1. Create parser in `processor/`
2. Register in `DocumentProcessor`
3. Configure options

## Runtime Directories

These directories are created automatically at runtime:

- `storage/` - Document JSON files (if using local storage)
- `logs/` - Application and error logs
- `uploads/` - Temporary file uploads
- `node_modules/` - NPM dependencies

## Configuration Files

- `.env` - Active configuration (not in git)
- `.env.example` - Configuration template
- `package.json` - Node.js project config
- `requirements.txt` - Python dependencies
- `.gitignore` - Git exclusions

## Documentation Files

- `README.md` - Main documentation and features
- `SETUP.md` - Installation and deployment
- `ARCHITECTURE.md` - System design and patterns
- `QUICK_REFERENCE.md` - Quick commands and examples
- `examples/README.md` - Integration examples
