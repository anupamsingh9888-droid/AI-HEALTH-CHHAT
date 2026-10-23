/**
 * AI Health Copilot - Centralized API Client
 * Connects frontend to the FastAPI Python backend.
 */

export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Profile {
  id: string;
  email?: string;
  full_name: string;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  activity_level: string;
  health_goals: string[];
  medical_history?: string;
  allergies: string[];
  current_medications: string[];
  dietary_preferences?: string;
  sleep_goal_hours: number;
  updated_at?: string;
}

export interface MedicationItem {
  name: string;
  dosage?: string;
  frequency?: string;
  instructions?: string;
}

export interface LabTestResult {
  test_name: string;
  result_value: string;
  unit?: string;
  reference_range?: string;
  status?: string;
}

export interface StructuredReportData {
  document_type?: string;
  report_date?: string;
  doctor_or_facility?: string;
  diagnoses?: string[];
  medications?: MedicationItem[];
  lab_results?: LabTestResult[];
  key_values?: Array<{ key: string; value: string; confidence?: number }>;
  tables?: Array<{ table_index: number; rows: string[][] }>;
  important_findings?: string[];
  questions_for_doctor?: string[];
  doctor_instructions?: string[];
  uncertain_or_unclear_fields?: string[];
  summary?: string;
  disclaimer?: string;
}

export interface MedicalReport {
  id: string;
  user_id?: string;
  file_name: string;
  file_type: string;
  file_size_bytes?: number;
  document_type: string;
  report_date: string;
  status: "Processed" | "Processing" | "Failed";
  ocr_engine?: string;
  ocr_raw_text?: string;
  ocr_confidence?: number;
  structured_data?: StructuredReportData;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  created_at?: string;
}

export interface HealthSummary {
  user_name: string;
  known_health_info: Record<string, string | null>;
  recorded_medications: string[];
  allergies: string[];
  current_metrics: Record<string, { value: string; unit: string }>;
  verified_reports_count: number;
  data_backed_trends: string[];
  missing_information: string[];
  general_wellness_suggestions: string[];
  disclaimer: string;
}

export interface HealthInsight {
  category: string;
  title: string;
  observation: string;
  delta_percentage?: number;
  direction?: "higher" | "lower" | "steady";
  tips: string[];
  has_sufficient_data: boolean;
}

export interface HealthInsightsResponse {
  insights: HealthInsight[];
  sufficient_data_available: boolean;
  data_timeframe_days: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("copilot_auth_token") || "demo-token-local-dev";
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("copilot_auth_token", token);
    } else {
      localStorage.removeItem("copilot_auth_token");
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (this.token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          errorDetail = errData.detail || errData.message || errorDetail;
        } catch {
          // Keep default
        }
        throw new Error(errorDetail);
      }

      return (await response.json()) as T;
    } catch (err: any) {
      console.warn(`[ApiClient] Request to ${url} failed:`, err.message);
      throw err;
    }
  }

  // --- System ---
  async checkHealth(): Promise<any> {
    const res = await fetch("/health");
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  }

  // --- Auth ---
  auth = {
    signup: async (email: string, password: string, full_name?: string): Promise<AuthResponse> => {
      const res = await this.request<AuthResponse>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email, password, full_name }),
      });
      if (res.access_token) this.setToken(res.access_token);
      return res;
    },
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const res = await this.request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (res.access_token) this.setToken(res.access_token);
      return res;
    },
    logout: async () => {
      try {
        await this.request("/auth/logout", { method: "POST" });
      } finally {
        this.setToken(null);
      }
    },
    me: async (): Promise<User> => {
      return this.request<User>("/auth/me");
    },
  };

  // --- Profile ---
  profile = {
    get: async (): Promise<Profile> => {
      return this.request<Profile>("/profile");
    },
    update: async (data: Partial<Profile>): Promise<Profile> => {
      return this.request<Profile>("/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
  };

  // --- Medical Reports & PaddleOCR ---
  reports = {
    list: async (): Promise<MedicalReport[]> => {
      const res = await this.request<{ reports: MedicalReport[]; total: number }>("/reports");
      return res.reports;
    },
    get: async (id: string): Promise<MedicalReport> => {
      return this.request<MedicalReport>(`/reports/${id}`);
    },
    upload: async (file: File, document_type: string = "Laboratory"): Promise<MedicalReport> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", document_type);

      return this.request<MedicalReport>("/reports/upload", {
        method: "POST",
        body: formData,
      });
    },
    delete: async (id: string): Promise<void> => {
      await this.request(`/reports/${id}`, { method: "DELETE" });
    },
  };

  // --- AI Health Chat (Gemini) ---
  chat = {
    history: async (): Promise<ChatMessage[]> => {
      const res = await this.request<{ messages: ChatMessage[]; total: number }>("/chat/history");
      return res.messages;
    },
    send: async (message: string, includeHealthContext: boolean = true): Promise<ChatMessage> => {
      return this.request<ChatMessage>("/chat", {
        method: "POST",
        body: JSON.stringify({ message, include_health_context: includeHealthContext }),
      });
    },
    tts: async (text: string): Promise<{ audio_base64: string; mime_type: string }> => {
      return this.request<{ audio_base64: string; mime_type: string }>("/tts", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
    },
    clear: async (): Promise<void> => {
      await this.request("/chat/history", { method: "DELETE" });
    },
  };

  // --- Health Analytics & Biometric Context ---
  health = {
    summary: async (): Promise<HealthSummary> => {
      return this.request<HealthSummary>("/health/summary");
    },
    insights: async (): Promise<HealthInsightsResponse> => {
      return this.request<HealthInsightsResponse>("/health/insights");
    },
    getMetrics: async (): Promise<any> => {
      return this.request<any>("/health/metrics");
    },
    updateMetrics: async (data: any): Promise<any> => {
      return this.request<any>("/health/metrics", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    recommendations: async (focusAreas?: string[]): Promise<any> => {
      return this.request("/health/recommendations", {
        method: "POST",
        body: JSON.stringify({ focus_areas: focusAreas }),
      });
    },
  };
}

export const api = new ApiClient();
