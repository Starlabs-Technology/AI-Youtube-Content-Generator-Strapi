module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Transform some ESM modules in node_modules (e.g. fractional-indexing) so Jest can parse them
  // Transform ESM modules in node_modules that aren't precompiled to CJS
  // e.g., fractional-indexing and @strapi modules
  transformIgnorePatterns: ['node_modules/(?!(fractional-indexing|@strapi)/)'],
  moduleNameMapper: {
    '^@strapi/admin/strapi-admin$': '<rootDir>/admin/src/__mocks__/strapiAdminMock.js',
    '^@strapi/strapi/admin$': '<rootDir>/admin/src/__mocks__/strapiAdminMock.js',
    '^@strapi/strapi-admin$': '<rootDir>/admin/src/__mocks__/strapiAdminMock.js',
    '^@strapi/design-system$': '<rootDir>/admin/src/__mocks__/designSystemMock.js'
  },
  testPathIgnorePatterns: ['/node_modules/'],
};