const BASE_URL = import.meta.env.VITE_API_URL;

export async function register(data) {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return await res.json();
  } catch {
    return { error: "Server error" };
  }
}

export async function login(data) {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    return await res.json();
  } catch {
    return { error: "Server error" };
  }
}
