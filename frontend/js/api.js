/* ==========================================================
   Museum Booking System - Centralized API Client
   ========================================================== */

const API_BASE_URL = window.location.origin + '/api';

class API {
    static getToken() {
        return localStorage.getItem('museum_token') || localStorage.getItem('token');
    }

    static setToken(token) {
        if (token) {
            localStorage.setItem('museum_token', token);
            localStorage.setItem('token', token);
        }
    }

    static removeToken() {
        localStorage.removeItem('museum_token');
        localStorage.removeItem('token');
        localStorage.removeItem('museum_user');
        localStorage.removeItem('user');
    }

    static getUser() {
        const u = localStorage.getItem('museum_user') || localStorage.getItem('user');
        try {
            return u ? JSON.parse(u) : null;
        } catch (e) {
            return null;
        }
    }

    static setUser(user) {
        if (user) {
            const str = JSON.stringify(user);
            localStorage.setItem('museum_user', str);
            localStorage.setItem('user', str);
        }
    }

    static async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            // Handle 401 Unauthorized (Expired or invalid token)
            if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
                this.removeToken();
                // If on a protected page, redirect
                if (window.location.pathname.includes('mybookings') || window.location.pathname.includes('booking.html')) {
                    window.location.href = '/pages/login.html?session_expired=1';
                }
            }

            if (!response.ok) {
                const error = new Error(data.message || 'API request failed');
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (err) {
            console.error(`[API Error] ${endpoint}:`, err);
            throw err;
        }
    }

    // ==========================================
    // AUTH APIs
    // ==========================================
    static auth = {
        register: (userData) => API.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),
        login: (credentials) => API.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        getMe: () => API.request('/auth/me', {
            method: 'GET'
        }),
        logout: () => {
            API.removeToken();
            return Promise.resolve({ success: true });
        }
    };

    // ==========================================
    // MUSEUM APIs
    // ==========================================
    static museums = {
        getAll: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return API.request(`/museums${query ? '?' + query : ''}`, { method: 'GET' });
        },
        getById: (id) => API.request(`/museums/${id}`, { method: 'GET' }),
        search: (term) => API.request(`/museums/search?q=${encodeURIComponent(term)}`, { method: 'GET' }),
        getStates: () => API.request('/museums/states', { method: 'GET' }),
        getByState: (state) => API.request(`/museums/state/${encodeURIComponent(state)}`, { method: 'GET' })
    };

    // ==========================================
    // BOOKING APIs
    // ==========================================
    static bookings = {
        create: (bookingData) => API.request('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData)
        }),
        getMyBookings: () => API.request('/bookings/my-bookings', { method: 'GET' }),
        getById: (id) => API.request(`/bookings/${id}`, { method: 'GET' }),
        getByReference: (ref) => API.request(`/bookings/reference/${encodeURIComponent(ref)}`, { method: 'GET' }),
        cancel: (id) => API.request(`/bookings/${id}/cancel`, { method: 'PATCH' })
    };

    // ==========================================
    // PAYMENT APIs
    // ==========================================
    static payments = {
        process: (paymentData) => API.request('/payments/process', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        }),
        getTransaction: (ref) => API.request(`/payments/transaction/${encodeURIComponent(ref)}`, { method: 'GET' })
    };

    // ==========================================
    // CHATBOT APIs
    // ==========================================
    static chatbot = {
        sendMessage: (message) => API.request('/chatbot/message', {
            method: 'POST',
            body: JSON.stringify({ message })
        })
    };

    // ==========================================
    // ADMIN APIs
    // ==========================================
    static admin = {
        getStats: () => API.request('/admin/stats', { method: 'GET' }),
        getUsers: () => API.request('/admin/users', { method: 'GET' }),
        updateUserRole: (id, role) => API.request(`/admin/users/${id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        }),
        getBookings: () => API.request('/admin/bookings', { method: 'GET' }),
        updateBookingStatus: (id, status) => API.request(`/admin/bookings/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        }),
        getMuseums: () => API.request('/admin/museums', { method: 'GET' }),
        addMuseum: (data) => API.request('/admin/museums', {
            method: 'POST',
            body: JSON.stringify(data)
        }),
        updateMuseum: (id, data) => API.request(`/admin/museums/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }),
        deleteMuseum: (id) => API.request(`/admin/museums/${id}`, { method: 'DELETE' })
    };
}

window.API = API;
