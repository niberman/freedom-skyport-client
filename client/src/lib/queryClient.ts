import { QueryClient } from "@tanstack/react-query";

async function handleResponse(response: Response) {
  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }
    const message = await response.text();
    throw new Error(message || response.statusText);
  }
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export async function apiRequest(
  url: string,
  options?: RequestInit
): Promise<any> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include", // Important for auth cookies
  });

  return handleResponse(response);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        // Build URL from queryKey array
        // First element is the base path, rest are path segments or params
        const [baseUrl, ...params] = queryKey as [string, ...(string | number | Record<string, any>)[]];
        
        let url = baseUrl;
        
        // Handle path segments (strings/numbers)
        const pathSegments = params.filter(p => typeof p === 'string' || typeof p === 'number');
        if (pathSegments.length > 0) {
          url = `${baseUrl}/${pathSegments.join('/')}`;
        }
        
        // Handle query params (objects)
        const queryParams = params.find(p => typeof p === 'object' && p !== null) as Record<string, any> | undefined;
        if (queryParams) {
          const searchParams = new URLSearchParams();
          Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              searchParams.append(key, String(value));
            }
          });
          const queryString = searchParams.toString();
          if (queryString) {
            url = `${url}?${queryString}`;
          }
        }
        
        const response = await fetch(url, {
          credentials: "include",
        });
        return handleResponse(response);
      },
      staleTime: 1000 * 60, // 1 minute
      retry: false,
    },
  },
});
