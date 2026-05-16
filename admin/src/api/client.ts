import ky from 'ky';

const api = ky.create({
  prefixUrl: '/api',
  credentials: 'include',
  timeout: 30000,
  hooks: {
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          window.location.href = '/login';
          return response;
        }
        return response;
      },
    ],
  },
});

export default api;