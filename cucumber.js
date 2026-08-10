module.exports = {
  default: {
    requireModule: ['ts-node/register'],
    require: [
      'features/step_definitions/**/*.ts',
      'features/support/**/*.ts'
    ],
    format: [
      'json:reports/cucumber-report.json',
      'progress-bar'
    ],
    paths: ['features/**/*.feature'],
    publishQuiet: true
  }
};
