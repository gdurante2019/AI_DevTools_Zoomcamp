"""
FastMCP Documentation Search using minsearch.

This script:
1. Downloads the fastmcp repository zip file (if not already downloaded)
2. Extracts and indexes all .md and .mdx files
3. Provides a search function to find relevant documentation
"""

import os
import zipfile
import urllib.request
from minsearch import Index


ZIP_URL = "https://github.com/jlowin/fastmcp/archive/refs/heads/main.zip"
ZIP_FILENAME = "fastmcp-main.zip"


def download_zip(url: str, filename: str) -> str:
    """Download the zip file if it doesn't already exist."""
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
    
    return documents


def create_index(documents: list[dict]) -> Index:
    """Create and fit a minsearch index with the documents."""
    index = Index(
        text_fields=['content', 'filename'],
        keyword_fields=[]
    )
    index.fit(documents)
    return index


def search(index: Index, query: str, num_results: int = 5) -> list[dict]:
    """
    Search the index and return the top num_results most relevant documents.
    
    Args:
        index: The minsearch Index to search
        query: The search query string
        num_results: Number of results to return (default: 5)
    
    Returns:
        List of matching documents with 'content' and 'filename' fields.
    """
    boost_dict = {
        'filename': 2.0,  # Boost filename matches
        'content': 1.0
    }
    results = index.search(query, boost_dict=boost_dict, num_results=num_results)
    return results


def main():
    """Main function to test the search implementation."""
    # Step 1: Download the zip file
    zip_path = download_zip(ZIP_URL, ZIP_FILENAME)
    
    # Step 2: Extract markdown files
    print("\nExtracting markdown files...")
    documents = extract_markdown_files(zip_path)
    print(f"✓ Found {len(documents)} markdown files")
    
    # Show some filenames
    print("\nSample files:")
    for doc in documents[:5]:
        print(f"  - {doc['filename']}")
    
    # Step 3: Create the index
    print("\nCreating search index...")
    index = create_index(documents)
    print("✓ Index created")
    
    # Step 4: Test search
    test_query = "how to create a tool"
    print(f"\n🔍 Searching for: '{test_query}'")
    print("-" * 50)
    
    results = search(index, test_query, num_results=5)
    
    for i, result in enumerate(results, 1):
        print(f"\n{i}. {result['filename']}")
        # Show first 200 chars of content
        preview = result['content'][:200].replace('\n', ' ')
        print(f"   Preview: {preview}...")


if __name__ == "__main__":
    main()
