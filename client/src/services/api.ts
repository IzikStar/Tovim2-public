import { baseURL } from "../config";
import { Single } from "../utils/fakeData";
import { getCookie } from "../utils/cookies";

interface LoginResponse {
  token: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = baseURL || "http://localhost:3000";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    const token = getCookie("token");
    if (token) {
      (
        config.headers as Record<string, string>
      ).Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  // Singles endpoints
  async getPublicSingles(): Promise<Single[]> {
    return this.request<Single[]>("/singles/public");
  }

  // Add more endpoints as needed
  async getMatchmakers() {
    return this.request("/matchmakers");
  }

  async getRequests() {
    return this.request("/requests");
  }
}

export const apiService = new ApiService();
export default apiService;
