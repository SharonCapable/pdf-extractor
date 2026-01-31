const express = require('express');
const multer = require('multer');
const { DocumentExtractor } = require('../src');

const app = express();
const upload = multer({ dest: 'uploads/' });
const extractor = new DocumentExtractor({
    ocrProvider: 'tesseract',
    storageBackend: 'local'
});

// Upload and extract endpoint
app.post('/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`Processing: ${req.file.originalname}`);

        const result = await extractor.extract(req.file.path);

        res.json({
            success: true,
            documentId: result.documentId,
            text: result.content.fullText.substring(0, 500) + '...',
            metadata: result.metadata,
            fullResult: result
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get document endpoint
app.get('/documents/:id', async (req, res) => {
    try {
        const document = await extractor.getDocument(req.params.id);

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(document);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List documents endpoint
app.get('/documents', async (req, res) => {
    try {
        const documents = await extractor.listDocuments({
            limit: parseInt(req.query.limit) || 10,
            offset: parseInt(req.query.offset) || 0
        });

        res.json({ documents });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Express app with PRD Extractor running on port ${PORT}`);
    console.log(`Upload a document: POST http://localhost:${PORT}/upload`);
});
