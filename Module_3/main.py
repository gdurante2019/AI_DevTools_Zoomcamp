def main():
    print("Hello from module-3!")


if __name__ == "__main__":
    main()

import requests
from fastmcp import FastMCP

mcp = FastMCP("Demo 🚀")

@mcp.tool
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b


@mcp.tool
def read_webpage(url: str) -> str:
    """
    Download and return the content of any webpage in markdown format using Jina Reader.
    
    Args:
        url: The URL of the webpage to read (e.g., 'https://datatalks.club')
    
    Returns:
        The webpage content converted to clean markdown format.
    """
    # Prepend the Jina Reader URL to convert the page to markdown
    jina_url = f"https://r.jina.ai/{url}"
    
    response = requests.get(jina_url)
    response.raise_for_status()  # Raise an exception for HTTP errors
    
    return response.text

from search_utils import search, initialize_search_index

# Global variable to store the search index
_search_index = None

def get_index():
    """Lazy load the search index."""
    global _search_index
    if _search_index is None:
        _search_index = initialize_search_index()
    return _search_index

@mcp.tool
def search_fastmcp_docs(query: str) -> str:
    """
    Search the FastMCP documentation for a given query.
    
    Args:
        query: The search query string (e.g., "how to create a tool")
    
    Returns:
        A formatted string containing the top 5 most relevant documentation pages.
    """
    index = get_index()
    results = search(index, query)
    
    output = []
    for i, result in enumerate(results, 1):
        output.append(f"Result {i}: {result['filename']}")
        # Include first 500 chars as preview
        preview = result['content'][:500].replace('\n', ' ')
        output.append(f"Preview: {preview}...\n")
        
    return "\n".join(output)

if __name__ == "__main__":
    mcp.run()