import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Get auth token from local storage
const getAuthToken = (): string | null => {
  return localStorage.getItem("token");
};

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  // Get auth token
  const token = getAuthToken();
  
  // Prepare headers
  const headers = new Headers(options.headers || {});
  
  // Add auth token if available
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  // Add content type if body is provided and content-type is not set
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  
  // Prepare fetch options
  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };
  
  // Make request
  const res = await fetch(url, fetchOptions);
  
  // Handle errors
  await throwIfResNotOk(res);
  
  // Parse response
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get auth token
    const token = getAuthToken();
    
    // Prepare headers
    const headers: HeadersInit = {};
    
    // Add auth token if available
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Make request
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
