# Integration Guide - Using PRD Extractor in Your Applications

This guide shows you how to integrate the PRD Extractor into various types of applications.

## Table of Contents

1. [Integration Patterns](#integration-patterns)
2. [Node.js Applications](#nodejs-applications)
3. [Python Applications](#python-applications)
4. [Web Applications](#web-applications)
5. [Mobile Applications](#mobile-applications)
6. [Microservices Architecture](#microservices-architecture)
7. [Cloud Deployments](#cloud-deployments)

---

## Integration Patterns

### Pattern 1: Direct Library Import (Node.js only)

**Best for:** Node.js applications, same codebase

```javascript
const { DocumentExtractor } = require('./prd_extractor/src');

const extractor = new DocumentExtractor({
  ocrProvider: 'tesseract',
  storageBackend: 'mongodb'
});

const result = await extractor.extract('document.pdf');
```

**Pros:**
- No network overhead
- Direct access to all features
- Easy debugging

**Cons:**
- Node.js only
- Tightly coupled
- Shared resources

### Pattern 2: RESTful API Service

**Best for:** Any language, microservices, distributed systems

```javascript
// Start PRD Extractor as a service
npm start

// Call from any application
fetch('http://localhost:3000/api/extract', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer api-key' },
  body: formData
});
```

**Pros:**
- Language agnostic
- Loosely coupled
- Scalable
- Centralized management

**Cons:**
- Network latency
- Additional infrastructure

### Pattern 3: Shared Queue

**Best for:** High volume, async processing, multiple consumers

```javascript
// Producer (your app)
await queueManager.addFileJob('document.pdf');

// Consumer (PRD Extractor)
// Processes jobs automatically

// Your app polls for results
const status = await fetch(`/api/jobs/${jobId}`);
```

**Pros:**
- Decoupled
- Scalable
- Fault tolerant
- Load balancing

**Cons:**
- Requires Redis
- More complex
- Eventual consistency

---

## Node.js Applications

### Express.js Integration

```javascript
// app.js
const express = require('express');
const multer = require('multer');
const { DocumentExtractor } = require('./prd_extractor/src');

const app = express();
const upload = multer({ dest: 'uploads/' });
const extractor = new DocumentExtractor();

// Document upload endpoint
app.post('/api/upload-document', upload.single('file'), async (req, res) => {
  try {
    const result = await extractor.extract(req.file.path);
    
    // Store result in your database
    await YourModel.create({
      userId: req.user.id,
      documentId: result.documentId,
      extractedText: result.content.fullText,
      metadata: result.metadata
    });
    
    res.json({ success: true, documentId: result.documentId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

### Next.js Integration

```javascript
// pages/api/extract.js
import { DocumentExtractor } from '../../prd_extractor/src';
import formidable from 'formidable';

export const config = {
  api: { bodyParser: false }
};

const extractor = new DocumentExtractor();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({ multiples: false });
  const [fields, files] = await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve([fields, files]);
    });
  });

  const result = await extractor.extract(files.file.filepath);
  
  res.json(result);
}
```

```javascript
// components/DocumentUploader.jsx
import { useState } from 'react';

export default function DocumentUploader() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    const response = await fetch('/api/extract', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div>
      <input type="file" onChange={handleUpload} />
      {loading && <p>Processing...</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

### NestJS Integration

```typescript
// document-extractor.service.ts
import { Injectable } from '@nestjs/common';
import { DocumentExtractor } from './prd_extractor/src';

@Injectable()
export class DocumentExtractorService {
  private extractor: DocumentExtractor;

  constructor() {
    this.extractor = new DocumentExtractor({
      ocrProvider: process.env.OCR_PROVIDER,
      storageBackend: process.env.STORAGE_BACKEND
    });
  }

  async extractDocument(filePath: string) {
    return await this.extractor.extract(filePath);
  }

  async getDocument(documentId: string) {
    return await this.extractor.getDocument(documentId);
  }
}

// document.controller.ts
import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentExtractorService } from './document-extractor.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly extractorService: DocumentExtractorService) {}

  @Post('extract')
  @UseInterceptors(FileInterceptor('file'))
  async extract(@UploadedFile() file: Express.Multer.File) {
    return await this.extractorService.extractDocument(file.path);
  }
}
```

---

## Python Applications

### Flask Integration

```python
# app.py
from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

# PRD Extractor API configuration
EXTRACTOR_URL = "http://localhost:3000/api"
API_KEY = os.getenv("PRD_EXTRACTOR_API_KEY")

@app.route('/upload', methods=['POST'])
def upload_document():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    # Forward to PRD Extractor
    files = {'file': file}
    headers = {'Authorization': f'Bearer {API_KEY}'}
    
    response = requests.post(
        f'{EXTRACTOR_URL}/extract',
        files=files,
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        
        # Store in your database
        # db.documents.insert_one({
        #     'user_id': current_user.id,
        #     'document_id': result['documentId'],
        #     'text': result['content']['fullText']
        # })
        
        return jsonify(result)
    else:
        return jsonify({'error': 'Extraction failed'}), 500

if __name__ == '__main__':
    app.run(port=5000)
```

### Django Integration

```python
# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import requests
import os

EXTRACTOR_URL = "http://localhost:3000/api"
API_KEY = os.getenv("PRD_EXTRACTOR_API_KEY")

@csrf_exempt
def extract_document(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    if 'file' not in request.FILES:
        return JsonResponse({'error': 'No file provided'}, status=400)
    
    file = request.FILES['file']
    
    # Call PRD Extractor API
    files = {'file': file}
    headers = {'Authorization': f'Bearer {API_KEY}'}
    
    response = requests.post(
        f'{EXTRACTOR_URL}/extract',
        files=files,
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        
        # Save to Django model
        from .models import Document
        Document.objects.create(
            user=request.user,
            document_id=result['documentId'],
            extracted_text=result['content']['fullText'],
            metadata=result['metadata']
        )
        
        return JsonResponse(result)
    else:
        return JsonResponse({'error': 'Extraction failed'}, status=500)

# models.py
from django.db import models
from django.contrib.auth.models import User

class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    document_id = models.CharField(max_length=255, unique=True)
    extracted_text = models.TextField()
    metadata = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
```

### FastAPI Integration

```python
# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import httpx
import os

app = FastAPI()

EXTRACTOR_URL = "http://localhost:3000/api"
API_KEY = os.getenv("PRD_EXTRACTOR_API_KEY")

@app.post("/extract")
async def extract_document(file: UploadFile = File(...)):
    async with httpx.AsyncClient() as client:
        files = {'file': (file.filename, file.file, file.content_type)}
        headers = {'Authorization': f'Bearer {API_KEY}'}
        
        response = await client.post(
            f'{EXTRACTOR_URL}/extract',
            files=files,
            headers=headers,
            timeout=300.0
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(status_code=500, detail="Extraction failed")

@app.get("/documents/{document_id}")
async def get_document(document_id: str):
    async with httpx.AsyncClient() as client:
        headers = {'Authorization': f'Bearer {API_KEY}'}
        
        response = await client.get(
            f'{EXTRACTOR_URL}/documents/{document_id}',
            headers=headers
        )
        
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            raise HTTPException(status_code=404, detail="Document not found")
        else:
            raise HTTPException(status_code=500, detail="Failed to retrieve document")
```

---

## Web Applications

### React Integration

```javascript
// hooks/useDocumentExtractor.js
import { useState } from 'react';

export function useDocumentExtractor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const extractDocument = async (file) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:3000/api/extract', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer your-api-key'
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Extraction failed');
      }
      
      const data = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { extractDocument, loading, error, result };
}

// components/DocumentUpload.jsx
import { useDocumentExtractor } from '../hooks/useDocumentExtractor';

export default function DocumentUpload() {
  const { extractDocument, loading, error, result } = useDocumentExtractor();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await extractDocument(file);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        onChange={handleFileChange}
        disabled={loading}
      />
      
      {loading && <p>Extracting text...</p>}
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      
      {result && (
        <div>
          <h3>Extracted Text:</h3>
          <p>{result.content.fullText}</p>
          
          <h4>Metadata:</h4>
          <ul>
            <li>Pages: {result.metadata.pages}</li>
            <li>Language: {result.metadata.language}</li>
            <li>Processing Time: {result.metadata.processingTime}s</li>
          </ul>
          
          {result.content.entities.emails.length > 0 && (
            <>
              <h4>Found Emails:</h4>
              <ul>
                {result.content.entities.emails.map((email, i) => (
                  <li key={i}>{email}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
```

### Vue.js Integration

```javascript
// composables/useDocumentExtractor.js
import { ref } from 'vue';

export function useDocumentExtractor() {
  const loading = ref(false);
  const error = ref(null);
  const result = ref(null);

  const extractDocument = async (file) => {
    loading.value = true;
    error.value = null;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:3000/api/extract', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer your-api-key'
        },
        body: formData
      });
      
      const data = await response.json();
      result.value = data;
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return { extractDocument, loading, error, result };
}

// components/DocumentUpload.vue
<template>
  <div>
    <input 
      type="file" 
      @change="handleFileChange"
      :disabled="loading"
    />
    
    <p v-if="loading">Extracting text...</p>
    <p v-if="error" class="error">Error: {{ error }}</p>
    
    <div v-if="result">
      <h3>Extracted Text:</h3>
      <p>{{ result.content.fullText }}</p>
      
      <h4>Metadata:</h4>
      <ul>
        <li>Pages: {{ result.metadata.pages }}</li>
        <li>Language: {{ result.metadata.language }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { useDocumentExtractor } from '../composables/useDocumentExtractor';

const { extractDocument, loading, error, result } = useDocumentExtractor();

const handleFileChange = async (e) => {
  const file = e.target.files[0];
  if (file) {
    await extractDocument(file);
  }
};
</script>
```

---

## Mobile Applications

### React Native

```javascript
// services/documentExtractor.js
const API_URL = 'http://your-server.com:3000/api';
const API_KEY = 'your-api-key';

export async function extractDocument(fileUri) {
  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: 'application/pdf',
    name: 'document.pdf'
  });

  const response = await fetch(`${API_URL}/extract`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'multipart/form-data'
    },
    body: formData
  });

  return await response.json();
}

// screens/DocumentScanner.js
import React, { useState } from 'react';
import { View, Button, Text, ActivityIndicator } from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { extractDocument } from '../services/documentExtractor';

export default function DocumentScanner() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const pickAndExtract = async () => {
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf, DocumentPicker.types.images]
      });

      setLoading(true);
      const extractionResult = await extractDocument(res.uri);
      setResult(extractionResult);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button title="Pick Document" onPress={pickAndExtract} />
      
      {loading && <ActivityIndicator />}
      
      {result && (
        <View>
          <Text>Extracted Text:</Text>
          <Text>{result.content.fullText}</Text>
        </View>
      )}
    </View>
  );
}
```

---

## Microservices Architecture

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  # PRD Extractor Service
  prd-extractor:
    build: ./prd_extractor
    ports:
      - "3000:3000"
    environment:
      - OCR_PROVIDER=tesseract
      - STORAGE_BACKEND=mongodb
      - MONGODB_URI=mongodb://mongo:27017/documents
      - REDIS_HOST=redis
    depends_on:
      - mongo
      - redis
    networks:
      - app-network

  # Your Main Application
  main-app:
    build: ./main-app
    ports:
      - "8080:8080"
    environment:
      - EXTRACTOR_URL=http://prd-extractor:3000/api
      - EXTRACTOR_API_KEY=your-api-key
    depends_on:
      - prd-extractor
    networks:
      - app-network

  # MongoDB
  mongo:
    image: mongo:latest
    volumes:
      - mongo-data:/data/db
    networks:
      - app-network

  # Redis
  redis:
    image: redis:latest
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongo-data:
```

---

## Cloud Deployments

### AWS Lambda Integration

```javascript
// lambda/extractDocument.js
const AWS = require('aws-sdk');
const axios = require('axios');

const s3 = new AWS.S3();
const EXTRACTOR_URL = process.env.EXTRACTOR_URL;
const API_KEY = process.env.API_KEY;

exports.handler = async (event) => {
  // Get file from S3
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  
  const file = await s3.getObject({ Bucket: bucket, Key: key }).promise();
  
  // Send to PRD Extractor
  const formData = new FormData();
  formData.append('file', file.Body, key);
  
  const response = await axios.post(`${EXTRACTOR_URL}/extract`, formData, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      ...formData.getHeaders()
    }
  });
  
  // Store result back in S3 or database
  await s3.putObject({
    Bucket: bucket,
    Key: `extracted/${key}.json`,
    Body: JSON.stringify(response.data)
  }).promise();
  
  return { statusCode: 200, body: 'Success' };
};
```

## Best Practices

1. **Error Handling**: Always wrap extraction calls in try-catch
2. **File Validation**: Validate file types and sizes before sending
3. **Async Processing**: Use async mode for large documents
4. **Caching**: Cache results to avoid re-processing
5. **Security**: Never expose API keys in client-side code
6. **Monitoring**: Log extraction requests and failures
7. **Rate Limiting**: Implement rate limiting in your app
8. **Cleanup**: Delete temporary files after processing

## Troubleshooting

- **CORS Issues**: Configure CORS in PRD Extractor or use proxy
- **Timeout**: Increase timeout for large files or use async mode
- **Memory Issues**: Process files in chunks or use streaming
- **Network Issues**: Implement retry logic with exponential backoff
