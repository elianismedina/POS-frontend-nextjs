import { api } from "@/lib/api";

export interface BusinessSettings {
  id: string;
  business_id: string;
  business_name: string;
  email: string;
  address: string;
  phone: string;
  image_url?: string;
  tax_id: string;
  invoice_number_prefix: string;
  invoice_number_start: number;
  invoice_number_end: number;
  invoice_number_current: number;
  invoice_expiration_months: number;
  created_at: Date;
  updated_at: Date;
  digital_menu_url?: string;
  qr_code_data_url?: string;
}

export interface UpdateBusinessSettingsRequest {
  email?: string;
  address?: string;
  phone?: string;
  image_url?: string;
  tax_id?: string;
  invoice_number_prefix?: string;
  invoice_number_start?: number;
  invoice_number_end?: number;
  invoice_number_current?: number;
  invoice_expiration_months?: number;
}

export interface UpdateBusinessRequest {
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
}

export const businessService = {
  // Get business settings for the current user
  async getCurrentSettings(): Promise<BusinessSettings> {
    const response = await api.get("/business/current/settings");
    return response.data;
  },

  // Get business settings by business ID
  async getSettingsByBusinessId(businessId: string): Promise<BusinessSettings> {
    const response = await api.get(`/business/${businessId}/settings`);
    return response.data;
  },

  // Update business settings
  async updateSettings(
    businessId: string,
    settings: UpdateBusinessSettingsRequest
  ): Promise<BusinessSettings> {
    const response = await api.patch(
      `/business/${businessId}/settings`,
      settings
    );
    return response.data;
  },

  // Update business information (including name)
  async updateBusiness(
    businessId: string,
    businessData: UpdateBusinessRequest
  ): Promise<any> {
    const response = await api.patch(`/business/${businessId}`, businessData);
    return response.data;
  },
};
