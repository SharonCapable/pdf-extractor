// Next.js API Route Example
// Save this file as: pages/api/extract-document.js

import { DocumentExtractor } from 'prd-extractor';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

const extractor = new DocumentExtractor({
    ocrProvider: 'tesseract',
    storageBackend: 'local'
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Parse form data
        const form = formidable({ multiples: false });

        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        const file = files.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Extract text from document
        const result = await extractor.extract(file.filepath);

        // Clean up uploaded file
        fs.unlinkSync(file.filepath);

        // Return result
        res.status(200).json({
            success: true,
            documentId: result.documentId,
            text: result.content.fullText,
            metadata: result.metadata
        });
    } catch (error) {
        console.error('Extraction error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
