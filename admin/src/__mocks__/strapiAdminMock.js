// Minimal Strapi admin mocks used in tests
const fetchClient = () => ({
  get: jest.fn().mockResolvedValue({ data: { data: [] } }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} }),
  del: jest.fn().mockResolvedValue({ data: {} }),
});

module.exports = {
  getFetchClient: fetchClient,
  useFetchClient: () => fetchClient(),
  useNotification: () => ({ toggleNotification: jest.fn() }),
  Layouts: { Header: () => null, Content: ({ children }) => children },
};
// Also provide a default export shape
module.exports.default = module.exports;