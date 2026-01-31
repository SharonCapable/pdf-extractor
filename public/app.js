// Configuration
const API_KEY = 'change-this-to-a-secure-key';

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
const aiToggle = document.getElementById('aiToggle');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Event Listeners
if (uploadBtn) uploadBtn.addEventListener('click', () => fileInput.click());
if (fileInput) fileInput.addEventListener('change', handleFileSelect);
if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearAllHistory);

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

// Global click handler
document.addEventListener('click', (e) => {
    const historyItem = e.target.closest('.history-item');
    const deleteBtn = e.target.closest('.delete-item-btn');

    if (deleteBtn) {
        e.stopPropagation();
        const docId = deleteBtn.getAttribute('data-id');
        deleteDocumentItem(docId);
        return;
    }

    if (historyItem) {
        const docId = historyItem.getAttribute('data-id');
        if (docId) {
            document.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
            historyItem.classList.add('active');
            viewDocument(docId);
        }
    }

    // Tab switching
    if (e.target.classList.contains('tab')) {
        const tabName = e.target.getAttribute('data-tab');
        if (tabName) showTab(tabName, e.target);
    }

    if (e.target.id === 'copyBtn') {
        copyJSON(e.target);
    }
});

// Load history on start
document.addEventListener('DOMContentLoaded', loadHistory);

function handleFileSelect() {
    const file = fileInput.files[0];
    if (file) {
        uploadFile(file);
    }
}

async function uploadFile(file) {
    resultContainer.style.display = 'none';
    errorContainer.innerHTML = '';
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    statusText.textContent = 'Neural Upload...';

    const runAI = aiToggle ? aiToggle.checked : true;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('runAI', runAI);

    try {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            if (progress > 90) clearInterval(interval);
            progressFill.style.width = `${progress}%`;

            if (progress < 40) statusText.textContent = 'Ingesting document...';
            else if (progress < 70) statusText.textContent = 'Extracting neural entities...';
            else statusText.textContent = runAI ? 'Local Intelligence reasoning...' : 'Finalizing output...';
        }, 400);

        const response = await fetch('/api/extract', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${API_KEY}` },
            body: formData
        });

        clearInterval(interval);
        progressFill.style.width = '100%';

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }

        const result = await response.json();
        statusText.textContent = 'Neural sync complete';

        setTimeout(() => {
            progressContainer.style.display = 'none';
            displayResult(result);
            loadHistory();
        }, 500);

    } catch (error) {
        progressContainer.style.display = 'none';
        showError(error.message);
    }
}

async function loadHistory() {
    if (!historyList) return;

    try {
        const response = await fetch('/api/documents?limit=25', {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        const data = await response.json();

        if (data.documents && data.documents.length > 0) {
            historyList.innerHTML = data.documents.map(doc => `
                <div class="history-item" data-id="${doc.documentId}">
                    <div style="font-weight: 600; font-size: 0.85rem; margin-bottom: 4px; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${doc.filename || 'Untitled'}
                    </div>
                    <div style="font-size: 0.7rem; color: #666; display: flex; justify-content: space-between;">
                        <span>${doc.inferredType || 'Document'}</span>
                        <span>${new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button class="delete-item-btn" data-id="${doc.documentId}">✕</button>
                </div>
            `).join('');
        } else {
            historyList.innerHTML = '<div style="padding: 2rem; color: #444; text-align: center; font-size: 0.8rem;">No historical data available</div>';
        }
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

async function deleteDocumentItem(documentId) {
    if (!confirm('Clear this document?')) return;
    try {
        const response = await fetch(`/api/documents/${documentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        if (response.ok) loadHistory();
    } catch (error) {
        console.error('Failed to delete document:', error);
    }
}

async function clearAllHistory() {
    if (!confirm('Destroy all historical records?')) return;
    try {
        const response = await fetch('/api/documents', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        if (response.ok) {
            loadHistory();
            resultContainer.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to clear history:', error);
    }
}

async function viewDocument(documentId) {
    try {
        resultContainer.style.opacity = '0.5';
        const response = await fetch(`/api/documents/${documentId}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        if (!response.ok) throw new Error('Retrieval failed');
        const data = await response.json();
        displayResult(data);
        resultContainer.style.opacity = '1';
    } catch (error) {
        showError(`Retrieval failed: ${error.message}`);
    }
}

function displayResult(result) {
    resultContainer.style.display = 'block';
    const metadataGrid = document.getElementById('metadataGrid');
    const fileSize = result.metadata?.fileSize ? (result.metadata.fileSize / 1024).toFixed(1) + ' KB' : 'N/A';

    metadataGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-label">Format</div>
            <div class="stat-value">${result.metadata?.documentType?.toUpperCase() || 'N/A'}</div>
            <div style="font-size: 0.65rem; color: #555; margin-top: 5px;">${fileSize}</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Neural Inference</div>
            <div class="stat-value" style="color: #fff;">${result.metadata?.inferredType || 'In Review'}</div>
            <div style="font-size: 0.65rem; color: #555; margin-top: 5px;">Entropy Level: Low</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Confidence</div>
            <div class="stat-value">${result.content?.confidence ? (result.content.confidence * 100).toFixed(0) + '%' : '100%'}</div>
            <div style="font-size: 0.65rem; color: #555; margin-top: 5px;">Neural Verification Sync</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Latency</div>
            <div class="stat-value">${result.metadata?.processingTime?.toFixed(2) || '0.00'}s</div>
            <div style="font-size: 0.65rem; color: #555; margin-top: 5px;">Total Sync Time</div>
        </div>
    `;

    document.getElementById('textContent').textContent = result.content?.fullText || 'Null';

    const entitiesContent = document.getElementById('entitiesContent');
    const entities = result.content?.entities || {};
    let entHTML = '';

    const colors = ['#00f2ff', '#ff00ff', '#f0f0f0'];
    Object.keys(entities).forEach((key, idx) => {
        if (Array.isArray(entities[key]) && entities[key].length > 0) {
            entHTML += `<div style="margin-bottom: 1.5rem;">
                <h4 style="font-size: 0.75rem; color: #666; text-transform: uppercase; margin-bottom: 0.5rem;">${key}</h4>
                <div>${entities[key].map(e => `<span class="entity-tag" style="border-left: 2px solid ${colors[idx % 3]}">${e}</span>`).join('')}</div>
            </div>`;
        }
    });
    entitiesContent.innerHTML = entHTML || 'No entities detected';

    const summaryContent = document.getElementById('summaryTabContent');
    if (summaryContent) {
        let insightsHTML = '';
        if (result.content?.insights?.length > 0) {
            insightsHTML = `
                <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border);">
                    <h4 style="font-size: 0.8rem; color: var(--accent); margin-bottom: 1rem;">Core Insights</h4>
                    <ul style="list-style: none; color: #aaa;">
                        ${result.content.insights.map(i => `<li style="margin-bottom: 10px; padding-left: 15px; border-left: 1px solid var(--accent);">${i}</li>`).join('')}
                    </ul>
                </div>
            `;
        }
        summaryContent.innerHTML = `
            <div style="font-size: 1.1rem; color: #fff; font-weight: 500;">
                ${result.content?.summary || 'No intelligence analysis available.'}
            </div>
            ${insightsHTML}
        `;
    }

    document.getElementById('jsonContent').textContent = JSON.stringify(result, null, 2);
}

function showTab(tabName, clickedTab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    clickedTab.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function copyJSON(btn) {
    navigator.clipboard.writeText(document.getElementById('jsonContent').textContent).then(() => {
        btn.textContent = 'Copied';
        setTimeout(() => btn.textContent = 'Copy JSON', 2000);
    });
}

function showError(message) {
    if (errorContainer) {
        errorContainer.innerHTML = `<div style="background: rgba(255, 77, 77, 0.1); border: 1px solid #ff4d4d; color: #ff4d4d; padding: 1.5rem; border-radius: 12px; margin-top: 2rem;">
            <strong>System Error:</strong> ${message}
        </div>`;
    }
}
