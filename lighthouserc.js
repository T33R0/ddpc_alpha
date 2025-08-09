module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      startServerCommand: null,
      url: [
        (process.env.BASE_URL || 'http://localhost:3000') + '/',
        (process.env.BASE_URL || 'http://localhost:3000') + '/vehicles',
      ],
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.70 }],
        'categories:accessibility': ['warn', { minScore: 0.90 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.80 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
