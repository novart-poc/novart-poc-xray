const report = require('multiple-cucumber-html-reporter');

report.generate({
  jsonDir: 'reports',
  reportPath: 'reports/html-report',
  displayDuration: true,
  metadata: {
    browser: {
      name: 'chromium',
      version: 'latest'
    },
    device: 'GitHub Actions Runner',
    platform: {
      name: 'linux'
    }
  },
  customData: {
    title: 'Run Info',
    data: [
      { label: 'Project', value: 'novart-poc / Xray KAN-5' },
      { label: 'Executed at', value: new Date().toISOString() }
    ]
  }
});
