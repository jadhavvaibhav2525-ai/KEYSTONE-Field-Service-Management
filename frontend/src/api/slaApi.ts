import api from "./axios";

export interface SLA {
  id: number;
  serviceRequestId: number;
  priority: string;

  responseTargetMinutes: number;
  resolutionTargetMinutes: number;

  responseDueAt: string;
  resolutionDueAt: string;

  respondedAt: string | null;
  resolvedAt: string | null;

  responseMet: boolean | null;
  resolutionMet: boolean | null;

  createdAt: string;
  updatedAt: string;
}

export interface CreateSLARequest {
  serviceRequestId: number;
  priority: string;
  responseTargetMinutes: number;
  resolutionTargetMinutes: number;
}

export interface UpdateSLARequest {
  priority?: string;
  responseTargetMinutes?: number;
  resolutionTargetMinutes?: number;
  respondedAt?: string;
  resolvedAt?: string;
}

const SLA_BASE_URL = "/api/sla";

export const slaApi = {
  // Get all SLA records
  getAll: async (): Promise<SLA[]> => {
    const response = await api.get<SLA[]>(SLA_BASE_URL);
    return response.data;
  },

  // Get SLA by its ID
  getById: async (id: number): Promise<SLA> => {
    const response = await api.get<SLA>(`${SLA_BASE_URL}/${id}`);
    return response.data;
  },

  // Get SLA by Service Request ID
  getByServiceRequestId: async (
    serviceRequestId: number
  ): Promise<SLA> => {
    const response = await api.get<SLA>(
      `${SLA_BASE_URL}/service-request/${serviceRequestId}`
    );
    return response.data;
  },

  // Create SLA
  create: async (data: CreateSLARequest): Promise<SLA> => {
    const response = await api.post<SLA>(SLA_BASE_URL, data);
    return response.data;
  },

  // Update SLA
  update: async (
    id: number,
    data: UpdateSLARequest
  ): Promise<SLA> => {
    const response = await api.put<SLA>(
      `${SLA_BASE_URL}/${id}`,
      data
    );
    return response.data;
  },

  // Record technician response
  recordResponse: async (id: number): Promise<SLA> => {
    const response = await api.post<SLA>(
      `${SLA_BASE_URL}/${id}/response`
    );
    return response.data;
  },

  // Record service resolution
  recordResolution: async (id: number): Promise<SLA> => {
    const response = await api.post<SLA>(
      `${SLA_BASE_URL}/${id}/resolution`
    );
    return response.data;
  },

  // Delete SLA
  delete: async (id: number): Promise<void> => {
    await api.delete(`${SLA_BASE_URL}/${id}`);
  },
};