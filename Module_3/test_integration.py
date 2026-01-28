"""
Integration test for the MCP search tool.
"""
import sys
import os

# Add global pyproject.toml dependencies to path if needed (though conda env handles this)

def test_integration():
    print("Testing search_fastmcp_docs integration...")
    
    try:
        # Import the tool directly from main
        from main import search_fastmcp_docs
        
        # Test query
        query = "how to create a tool"
        print(f"Querying: '{query}'")
        
        # Call the tool function (using .fn to bypass MCP decoration if needed, 
        # but fastmcp tools are usually callable directly or via .fn)
        if hasattr(search_fastmcp_docs, 'fn'):
            result = search_fastmcp_docs.fn(query)
        else:
            result = search_fastmcp_docs(query)
            
        print("-" * 50)
        print(result[:1000])  # Print first 1000 chars
        print("-" * 50)
        
        if "Result 1:" in result:
            print("\n✅ Verification Successful: Search results returned.")
        else:
            print("\n❌ Verification Failed: No results format found.")
            
    except ImportError as e:
        print(f"❌ Import Error: {e}")
    except Exception as e:
        print(f"❌ execution Error: {e}")

if __name__ == "__main__":
    test_integration()
