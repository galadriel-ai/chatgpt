import serpapi


def search_web(query: str, client: serpapi.Client) -> str:
    try:
        results = client.search(
            engine="google_light", q=query, hl="en", gl="us", google_domain="google.com"
        )

        results_dict = results.as_dict()
        if "organic_results" in results_dict:
            formatted_results = []
            for result in results_dict["organic_results"]:
                formatted_results.append(
                    f"{result.get('title', '')}: {result.get('snippet', '')} ({result.get('link', '')})"
                )

            return "\n".join(formatted_results)
        else:
            return "No results found."

    except Exception as e:
        return f"Error performing search: {str(e)}"
