const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * SIMULATED STUDY LIBRARY APP
 * This script demonstrates how your other application will talk to the PRD Extractor
 */
async function simulateAppRequest() {
    console.log('--- Study Library App Simulation ---');

    // 1. Create a dummy file specifically for this test
    const testFileName = 'api-test-document.txt';
    const testFilePath = path.join(__dirname, testFileName);
    fs.writeFileSync(testFilePath, 'This is a test document for the Study Library App API integration.');

    console.log(`Created test file: ${testFileName}`);

    // 2. Prepare the Request
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath), testFileName);

    try {
        console.log('Sending request to PRD Extractor API...');
        const response = await axios.post('http://localhost:3000/api/extract', form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': 'Bearer change-this-to-a-secure-key'
            }
        });

        // 3. Handle the Response
        console.log('\n✅ SUCCESS! Response received:');
        console.log('-----------------------------------');
        console.log('Document ID:', response.data.documentId);
        console.log('Inferred Type:', response.data.metadata.inferredType);
        console.log('Processing Time:', response.data.metadata.processingTime.toFixed(2), 'seconds');
        console.log('Summary Note:', response.data.content.summary ? 'AI Summary Generated' : 'No AI Summary (Offline/No Key)');
        console.log('Text Snippet:', response.data.content.fullText.substring(0, 100) + '...');
        console.log('-----------------------------------');

    } catch (error) {
        console.error('❌ API Test Failed:', error.response ? error.response.data : error.message);
    }
}

simulateAppRequest();
