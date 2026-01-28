"""
Search utilities for the FastMCP documentation.
"""
import os
import zipfile
import urllib.request
from minsearch import Index

ZIP_URL = "https://github.com/jlowin/fastmcp/archive/refs/heads/main.zip"
ZIP_FILENAME = "fastmcp-main.zip"


def download_zip(url: str, filename: str) -> str:
    """Download the zip file if it doesn't already exist."""
    print(f"Checking for {filename}...")
    if os.path.exists(filename):
        print(f"✓ Zip file already exists: {filename}")
        return filename
    
    print(f"Downloading {url}...")
    urllib.request.urlretrieve(url, filename)
    print(f"✓ Downloaded: {filename}")
    return filename


def extract_markdown_files(zip_path: str) -> list[dict]:
    """
    Extract content from .md and .mdx files in the zip.
    Returns a list of documents with 'content' and 'filename' fields.
    """
    print("Extracting markdown files...")
    documents = []
    
    with zipfile.ZipFile(zip_path, 'r') as zf:
        for file_info in zf.infolist():
            # Skip directories
            if file_info.is_dir():
                continue
            
            # Only process .md and .mdx files
            if not (file_info.filename.endswith('.md') or file_info.filename.endswith('.mdx')):
                continue
            
            # Remove the first path component (e.g., "fastmcp-main/")
            parts = file_info.filename.split('/', 1)
            if len(parts) > 1:
                clean_filename = parts[1]
            else:
                clean_filename = file_info.filename
            
            # Read file content
            with zf.open(file_info) as f:
                content = f.read().decode('utf-8', errors='ignore')
            
            documents.append({
                'content': content,
                'filename': clean_filename
            })
    
    print(f"✓ Processed {len(documents)} markdown files")
    return documents


def create_index(documents: list[dict]) -> Index:
    """Create and fit a minsearch index with the documents."""
    print("Creating search index...")
    index = Index(
        text_fields=['content', 'filename'],
        keyword_fields=[]
    )
    index.fit(documents)
    print("✓ Search index ready")
    return index


def search(index: Index, query: str, num_results: int = 5) -> list[dict]:
    """
    Search the index and return the top num_results most relevant documents.
    """
    boost_dict = {
        'filename': 2.0,  # Boost filename matches
        'content': 1.0
    }
    results = index.search(query, boost_dict=boost_dict, num_results=num_results)
    return results


def initialize_search_index() -> Index:
    """Full initialization pipeline: download, extract, and index."""
    zip_path = download_zip(ZIP_URL, ZIP_FILENAME)
    documents = extract_markdown_files(zip_path)
    return create_index(documents)
