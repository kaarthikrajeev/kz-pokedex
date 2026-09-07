// Karma configuration file
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('karma-junit-reporter'),
    ],
    client: {
      jasmine: {
        // You can add configuration options for Jasmine here
      },
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true, // removes the duplicated traces
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/kz-pokedex'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly', file: 'lcov.info' },
      ],
      check: {
        global: {
          statements: 90,
          branches: 80,
          functions: 90,
          lines: 90,
        },
      },
    },
    junitReporter: {
      outputDir: require('path').join(__dirname, './coverage/junit'),
      outputFile: 'test-results.xml',
      useBrowserName: false,
    },
    reporters: ['progress', 'kjhtml', 'coverage', 'junit'],
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-gpu'],
      },
    },
    restartOnFileChange: true,
    singleRun: true,
  });
};
