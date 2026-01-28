"""
Test script for the read_webpage function using Jina Reader.
"""

from main import read_webpage


def test_read_webpage():
    """Count how many times 'data' appears on datatalks.club using the MCP tool."""
    url = "https://datatalks.club"
    
    print(f"Fetching content from: {url}")
    print("-" * 50)
    
    try:
        content = read_webpage.fn(url)
        
        # Count occurrences of "data" (case-insensitive)
        count = content.lower().count("data")
        
        print(f"✅ Success! Retrieved {len(content)} characters of markdown content.")
        print(f"\n📊 The word 'data' appears {count} times on {url}")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    test_read_webpage()
