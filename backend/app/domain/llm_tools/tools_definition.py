from app.domain.llm_tools.search import search_web

SEARCH_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": search_web.__name__,
        "description": "Search the web for up-to-date information.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query string.",
                }
            },
            "required": ["query"],
            "additionalProperties": False,
        },
    },
}
