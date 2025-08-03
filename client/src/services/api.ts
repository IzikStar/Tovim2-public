import { baseURL } from "../config";
import { Single } from "../utils/fakeData";
import { getCookie } from "../utils/cookies";

export interface MatchMaker {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  city: string;
  gender: string;
  sector: string;
  expertSectors: string[];
  ageRange?: { min: number; max: number };
  priceRange?: { min: number; max: number };
}

interface LoginResponse {
  token: string;
  matchMakerId: string;
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

  async getPrivateSingles(matchMakerId: string): Promise<Single[]> {
    return this.request<Single[]>(`/matchmakers/${matchMakerId}/singles`);
  }

  async addSingleToMatchmaker(
    matchMakerId: string,
    singleId: string
  ): Promise<Single> {
    return this.request<Single>(
      `/matchmakers/${matchMakerId}/add-single/${singleId}`,
      { method: "POST" }
    );
  }

  // Add more endpoints as needed
  async getMatchmakers() {
    return this.request("/matchmakers");
  }

  async getMatchmaker(id: string): Promise<MatchMaker> {
    return this.request<MatchMaker>(`/matchmakers/${id}`);
  }

  async getRequests() {
    return this.request("/requests");
  }
}

export const apiService = new ApiService();
export default apiService;
