export async function authFetch(url: string, options: RequestInit = {}) {
    const token = sessionStorage.getItem("authToken");
  
    return fetch(url, {
      ...options, // Spread existing options
      headers: {
        ...options.headers, // Ensure existing headers are kept
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  }
  