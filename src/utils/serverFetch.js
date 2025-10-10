import { cookies } from "next/headers";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com";

/**
 * Server-side fetch utility with automatic authentication
 * @param {string} path - API endpoint path
 * @param {object} options - Fetch options
 * @returns {Promise<object>} - Parsed JSON response
 */
async function fetchServer(path, options = {}) {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;

  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    "X-From-Frontend": "true",
    Accept: "application/json",
    ...(options.headers || {}),
  };

  // Add authorization header if token exists
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    // Server-side fetch should not cache by default for dynamic data
    cache: options.cache || "no-store",
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server fetch error: ${response.status}`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Server fetch error:", error);
    throw error;
  }
}

/**
 * GET request helper
 */
export async function getServer(path, options = {}) {
  return fetchServer(path, { ...options, method: "GET" });
}

/**
 * POST request helper
 */
export async function postServer(path, data = null, options = {}) {
  return fetchServer(path, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT request helper
 */
export async function putServer(path, data = null, options = {}) {
  return fetchServer(path, {
    ...options,
    method: "PUT",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function deleteServer(path, options = {}) {
  return fetchServer(path, { ...options, method: "DELETE" });
}

/**
 * Form data POST helper
 */
export async function postFormDataServer(path, formData, options = {}) {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;

  const url = `${BASE_URL}${path}`;
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    ...options,
    method: "POST",
    headers,
    body: formData,
    cache: options.cache || "no-store",
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Server form data error: ${response.status}`, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Server form data error:", error);
    throw error;
  }
}

export default fetchServer;
