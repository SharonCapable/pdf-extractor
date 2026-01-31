// Configuration
const API_KEY = 'change-this-to-a-secure-key'; // In production, this might be handled differently

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const statusText = document.getElementById('statusText');
const resultContainer = document.getElementById('resultContainer');
const errorContainer = document.getElementById('errorContainer');
const historyList = document.getElementById('historyList');

// Event Listeners
if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput.click());
if (fileInput) fileInput.addEventListener('change', handleFileSelect);

if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            fileInput.files = e.dataTransfer.files;
            handleFileSelect();
        }
    });
}

// Load history on start
document.addEventListener('DOMContentLoaded', loadHistory);

function handleFileSelect() {
    const file = fileInput.files[0];
    if (file) {
        uploadFile(file);
    }
}

async function uploadFile(file) {
    // Reset UI
    resultContainer.style.display = 'none';
    errorContainer.innerHTML = '';
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    statusText.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('file', file);

    try {
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            if (progress > 90) clearInterval(interval);
            progressFill.style.width = `${progress}%`;

            if (progress < 30) statusText.textContent = 'Uploading document...';
            else if (progress < 60) statusText.textContent = 'Extracting text...';
            else statusText.textContent = 'AI is analyzing your document locally...';
        }, 500);

        const response = await fetch('/api/extract', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            },
            body: formData
        });

        clearInterval(interval);
        progressFill.style.width = '100%';

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        const result = await response.json();
        statusText.textContent = 'Complete!';

        setTimeout(() => {
            progressContainer.style.display = 'none';
            displayResult(result);
            loadHistory(); // Refresh history
        }, 500);

    } catch (error) {
        progressContainer.style.display = 'none';
        showError(error.message);
    }
}

async function loadHistory() {
    if (!historyList) return;

    try {
        const response = await fetch('/api/documents?limit=10', {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
            historyList.innerHTML = data.documents.map(doc => `
                <div class="history-item" onclick="viewDocument('${doc.documentId}')" style="cursor: pointer; padding: 10px; border-bottom: 1px solid #eee; transition: background 0.2s;">
                    <div class="history-name" style="font-weight: 500; color: #333;">${doc.filename || doc.documentId}</div>
                    <div class="history-meta" style="font-size: 0.8rem; color: #888;">
                        ${doc.metadata?.documentType?.toUpperCase() || 'DOC'} • ${new Date(doc.metadata?.createdAt || doc.createdAt).toLocaleDateString()}
                    </div>
                </div>
            `).join('');
        } else {
            historyList.innerHTML = '<div style="padding: 1rem; color: #888; text-align: center; font-size: 0.9rem;">No recent history</div>';
        }
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

// Make viewDocument global so onclick works
window.viewDocument = async function (documentId) {
    try {
        // Scroll to result immediately
        resultContainer.scrollIntoView({ behavior: 'smooth' });
        resultContainer.style.opacity = '0.5'; // Indicate loading

        const response = await fetch(`/api/documents/${documentId}`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            }
        });
        if (!response.ok) throw new Error('Failed to load document');

        const document = await response.json();
        displayResult(document);
        resultContainer.style.opacity = '1';

    } catch (error) {
        showError(`Could not load document: ${error.message}`);
        resultContainer.style.opacity = '1';
    }
};

function displayResult(result) {
    resultContainer.style.display = 'block';

    // Display metadata
    const metadataGrid = document.getElementById('metadataGrid');

    // File size might not be stored in history, so handle it
    const fileSizeStr = result.metadata?.fileSize ? formatFileSize(result.metadata.fileSize) : '';

    metadataGrid.innerHTML = `
        <div class="metadata-item">
            <div class="metadata-label">File Format</div>
            <div class="metadata-value">${result.metadata?.documentType?.toUpperCase() || 'N/A'}</div>
            ${fileSizeStr ? `<div style="font-size: 0.7rem; color: #666; margin-top: 4px;">Size: ${fileSizeStr}</div>` : ''}
        </div>
        <div class="metadata-item">
            <div class="metadata-label">AI Inferred Type</div>
            <div class="metadata-value" style="font-size: 1.1rem; color: #764ba2;">${result.metadata?.inferredType || 'In Review...'}</div>
            <div style="font-size: 0.7rem; color: #666; margin-top: 4px;">
                ${result.content?.isOffline ? '🔒 Local Privacy Mode' : '☁️ Cloud/Local Analysis'}
            </div>
        </div>
        <div class="metadata-item">
            <div class="metadata-label">Processing Status</div>
            <div class="metadata-value" style="font-size: 0.9rem;">
                ${(result.content?.confidence > 0 || result.status === 'completed') ? '✅ Successful' : '⏳ Processing'}
            </div>
            <div style="font-size: 0.7rem; color: #666; margin-top: 4px;">
                ${result.content?.confidence ? 'Confidence: ' + (result.content.confidence * 100).toFixed(0) + '%' : 'AI Analysis Ready'}
            </div>
        </div>
        <div class="metadata-item">
            <div class="metadata-label">Processing Time</div>
            <div class="metadata-value">${result.metadata?.processingTime?.toFixed(2) || '0.00'}s</div>
            <div style="font-size: 0.7rem; color: #666; margin-top: 4px;">Total Duration</div>
        </div>
    `;

    // Special handling for Ollama connection error
    if (result.content?.summary && result.content.summary.toLowerCase().includes('ollama')) {
        showOllamaSetup();
    }

    // Display text
    document.getElementById('textContent').textContent = result.content?.fullText || 'No text extracted';

    // Display entities
    const entitiesContent = document.getElementById('entitiesContent');
    const entities = result.content?.entities || {};

    let entitiesHTML = '';

    if (entities.emails && entities.emails.length > 0) {
        entitiesHTML += `
            <div class="entity-section">
                <div class="entity-title">📧 Emails</div>
                <div class="entity-list">
                    ${entities.emails.map(e => `<span class="entity-tag">${e}</span>`).join('')}
                </div>
            </div>
        `;
    }

    if (entities.dates && entities.dates.length > 0) {
        entitiesHTML += `
            <div class="entity-section">
                <div class="entity-title">📅 Dates</div>
                <div class="entity-list">
                    ${entities.dates.map(d => `<span class="entity-tag">${d}</span>`).join('')}
                </div>
            </div>
        `;
    }

    if (entities.phones && entities.phones.length > 0) {
        entitiesHTML += `
            <div class="entity-section">
                <div class="entity-title">📞 Phone Numbers</div>
                <div class="entity-list">
                    ${entities.phones.map(p => `<span class="entity-tag">${p}</span>`).join('')}
                </div>
            </div>
        `;
    }

    if (entities.amounts && entities.amounts.length > 0) {
        entitiesHTML += `
            <div class="entity-section">
                <div class="entity-title">💰 Amounts</div>
                <div class="entity-list">
                    ${entities.amounts.map(a => `<span class="entity-tag">${a}</span>`).join('')}
                </div>
            </div>
        `;
    }

    entitiesContent.innerHTML = entitiesHTML || '<p>No entities found</p>';

    // Display Summary & Insights
    const summaryContent = document.getElementById('summaryTabContent');
    if (summaryContent) {
        let insightsHTML = '';
        if (result.content?.insights && result.content.insights.length > 0) {
            insightsHTML = `
                <div style="margin-top: 1.5rem;">
                    <h4 style="color: #667eea; margin-bottom: 0.5rem;">Key Insights:</h4>
                    <ul style="padding-left: 1.5rem; color: #444;">
                        ${result.content.insights.map(i => `<li style="margin-bottom: 0.4rem;">${i}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        summaryContent.innerHTML = `
            <div style="background: #f8faff; border-left: 4px solid #667eea; padding: 1.5rem; border-radius: 0 12px 12px 0; line-height: 1.6; color: #333;">
                ${result.content?.summary || 'AI Summary not available for this document.'}
            </div>
            ${insightsHTML}
        `;
    }

    // Display JSON
    document.getElementById('jsonContent').textContent = JSON.stringify(result, null, 2);
}

// Event listeners for tabs
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab')) {
        const tabName = e.target.getAttribute('data-tab');
        if (tabName) showTab(tabName, e.target);
    }

    if (e.target.id === 'copyBtn') {
        copyJSON(e.target);
    }
});

function showTab(tabName, clickedTab) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    clickedTab.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    const targetContent = document.getElementById(`${tabName}Tab`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

function copyJSON(btn) {
    const jsonContent = document.getElementById('jsonContent');
    if (!jsonContent) return;

    const jsonText = jsonContent.textContent;
    navigator.clipboard.writeText(jsonText).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy JSON:', err);
    });
}

function showOllamaSetup() {
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="setup-helper" style="background: #f0f7ff; padding: 2rem; border-radius: 15px; border: 1px solid #cce3ff; margin-top: 2rem;">
                <h3 style="color: #0066cc; margin-bottom: 1rem;">🦙 Ollama Is Not Running</h3>
                <p style="margin-bottom: 1rem; color: #444;">This application is configured for <strong>Offline Privacy Mode</strong>. You need to have Ollama installed and running on your computer.</p>
                
                <ol style="margin-left: 1.5rem; color: #555; line-height: 1.6;">
                    <li>Download Ollama from <a href="https://ollama.com" target="_blank" style="color: #667eea; font-weight: bold;">ollama.com</a></li>
                    <li>Open your terminal and run: <code style="background: #eef; padding: 2px 6px; border-radius: 4px;">ollama run llama3:8b</code></li>
                    <li>Keep that terminal window open and try your upload again!</li>
                </ol>
                
                <div style="margin-top: 1.5rem; font-size: 0.85rem; color: #666;">
                    <em>Tip: You can change the model in your .env file (e.g., mistral, phi3).</em>
                </div>
            </div>
        `;
    }
}

function showError(message) {
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="error-message">
                <strong>Error Occurred:</strong> ${message}
            </div>
        `;

        if (message.toLowerCase().includes('ollama')) {
            showOllamaSetup();
        }
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
