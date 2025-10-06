// Flight Schedule Pro API proxy service
const FSP_API_BASE = 'https://api.freedomaviationco.com/api';

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function fetchFromFSP(endpoint: string, options: FetchOptions = {}) {
  const { params, ...fetchOptions } = options;
  
  let url = `${FSP_API_BASE}${endpoint}`;
  
  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url += `?${queryString}`;
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`FSP API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('FSP API call failed:', error);
    throw error;
  }
}

export const fspApi = {
  // Get aircraft schedule
  getSchedule: (tailNumber?: string) => 
    fetchFromFSP('/schedule', { params: tailNumber ? { tail: tailNumber } : {} }),

  // Get maintenance and detailing status
  getStatus: (tailNumber: string) => 
    fetchFromFSP('/status', { params: { tail: tailNumber } }),

  // Get invoices for an owner
  getInvoices: (ownerId: string) => 
    fetchFromFSP('/invoices', { params: { owner: ownerId } }),

  // Create new reservation
  createReservation: (data: any) =>
    fetchFromFSP('/reservations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Get all aircraft (admin)
  getAllAircraft: () => fetchFromFSP('/aircraft'),

  // Get metrics (admin)
  getMetrics: () => fetchFromFSP('/metrics'),
};
