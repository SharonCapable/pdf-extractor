#!/usr/bin/env python3
"""
Python client for PRD Extractor API
Usage: python python-client.py <file_path>
"""

import sys
import requests
import json
from pathlib import Path

API_URL = "http://localhost:3000/api"
API_KEY = "your-api-key"  # Change this to your actual API key

def extract_document(file_path, async_mode=False):
    """Extract text from a document"""
    
    if not Path(file_path).exists():
        print(f"Error: File not found: {file_path}")
        return None
    
    print(f"Uploading {file_path}...")
    
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'async': 'true' if async_mode else 'false'}
        headers = {'Authorization': f'Bearer {API_KEY}'}
        
        response = requests.post(
            f"{API_URL}/extract",
            files=files,
            data=data,
            headers=headers
        )
    
    if response.status_code == 200:
        result = response.json()
        
        if async_mode:
            print(f"Document queued. Job ID: {result['jobId']}")
            print(f"Check status at: {result['statusUrl']}")
            return result
        else:
            print(f"\nDocument ID: {result['documentId']}")
            print(f"Status: {result['status']}")
            print(f"Pages: {result['metadata']['pages']}")
            print(f"Language: {result['metadata']['language']}")
            print(f"\nExtracted Text (first 500 chars):")
            print(result['content']['fullText'][:500])
            print("...")
            return result
    else:
        print(f"Error: {response.status_code}")
        print(response.json())
        return None

def get_job_status(job_id):
    """Get status of an async job"""
    headers = {'Authorization': f'Bearer {API_KEY}'}
    response = requests.get(f"{API_URL}/jobs/{job_id}", headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None

def get_document(document_id):
    """Get document by ID"""
    headers = {'Authorization': f'Bearer {API_KEY}'}
    response = requests.get(f"{API_URL}/documents/{document_id}", headers=headers)
    
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error: {response.status_code}")
        return None

def list_documents(limit=10):
    """List all documents"""
    headers = {'Authorization': f'Bearer {API_KEY}'}
    response = requests.get(
        f"{API_URL}/documents",
        params={'limit': limit},
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"\nFound {len(result['documents'])} documents:")
        for doc in result['documents']:
            print(f"  - {doc['documentId']}: {doc.get('filename', 'N/A')}")
        return result
    else:
        print(f"Error: {response.status_code}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python python-client.py <file_path>")
        print("   or: python python-client.py --list")
        sys.exit(1)
    
    if sys.argv[1] == "--list":
        list_documents()
    else:
        file_path = sys.argv[1]
        async_mode = "--async" in sys.argv
        extract_document(file_path, async_mode)
