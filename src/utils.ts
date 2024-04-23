import { _EdgeDBRoleQuery } from "./_EdgeDBRoleQuery";

interface FetchOptions<T> {
  method?: string;
  headers?: { [key: string]: string };
  body?: T;
}

const fetcher = async <T>(
  url: string,
  options: FetchOptions<T>
): Promise<Response> => {
  try {
    const response = await fetch(url, options as RequestInit);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

export const makeRequest = _EdgeDBRoleQuery.EDGEWrapper(fetcher);