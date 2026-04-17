import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE || 'http://localhost:8080/api/v1';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campus_hub_token');
  if (token) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const data = err.response?.data;
    const base =
      data?.message ||
      data?.error ||
      err.message ||
      'Request failed';
    const code = data?.code ? String(data.code) : '';
    const status = err.response?.status;
    const msg =
      code && !base.toLowerCase().includes(code.toLowerCase())
        ? `${base} (${code}${status ? `, HTTP ${status}` : ''})`
        : status && base === 'Unexpected error'
          ? `${base} (HTTP ${status})`
          : base;
    const enriched = new Error(msg);
    enriched.status = err.response?.status;
    enriched.details = err.response?.data;
    enriched.code = code || undefined;
    return Promise.reject(enriched);
  }
);
