const { DocumentExtractor } = require('../src');

async function main() {
    // Create extractor instance
    const extractor = new DocumentExtractor({
        ocrProvider: 'tesseract',
        storageBackend: 'local'
    });

    try {
        // Example 1: Extract from a PDF file
        console.log('Example 1: Extracting from PDF...');
        const pdfResult = await extractor.extract('./test-documents/sample.pdf');
        console.log('PDF Result:', {
            documentId: pdfResult.documentId,
            pages: pdfResult.metadata.pages,
            textPreview: pdfResult.content.fullText.substring(0, 200) + '...'
        });

        // Example 2: Extract from an image
        console.log('\nExample 2: Extracting from image...');
        const imageResult = await extractor.extract('./test-documents/sample.png');
        console.log('Image Result:', {
            documentId: imageResult.documentId,
            confidence: imageResult.content.pages[0].confidence,
            textPreview: imageResult.content.fullText.substring(0, 200) + '...'
        });

        // Example 3: Get document by ID
        console.log('\nExample 3: Retrieving document...');
        const retrieved = await extractor.getDocument(pdfResult.documentId);
        console.log('Retrieved:', {
            documentId: retrieved.documentId,
            status: retrieved.status
        });

        // Example 4: List all documents
        console.log('\nExample 4: Listing documents...');
        const documents = await extractor.listDocuments({ limit: 5 });
        console.log(`Found ${documents.length} documents`);
        documents.forEach(doc => {
            console.log(`  - ${doc.documentId}: ${doc.filename}`);
        });

        // Example 5: Extract entities
        console.log('\nExample 5: Extracted entities from PDF:');
        console.log('Emails:', pdfResult.content.entities.emails);
        console.log('Dates:', pdfResult.content.entities.dates);
        console.log('Amounts:', pdfResult.content.entities.amounts);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        // Clean up
        await extractor.cleanup();
    }
}

main();
