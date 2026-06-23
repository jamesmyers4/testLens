module.exports = {
  default: {
    paths: ['tests/cucumber/features/**/*.feature'],
    requireModule: ['tsx/cjs'],
    require: [
      'tests/cucumber/support/world.ts',
      'tests/cucumber/support/hooks.ts',
      'tests/cucumber/steps/**/*.steps.ts',
    ],
    parallel: 1,
    format: ['progress', 'html:tests/cucumber/reports/report.html'],
  },
}
