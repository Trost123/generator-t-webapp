'use strict';
var generators = require('yeoman-generator');
var yosay = require('yosay');
var chalk = require('chalk');
var wiredep = require('wiredep');
var mkdirp = require('mkdirp');
var _s = require('underscore.string');

module.exports = generators.Base.extend({
  constructor: function () {
    var testLocal;

    generators.Base.apply(this, arguments);

    this.option('skip-welcome-message', {
      desc: 'Skips the welcome message',
      type: Boolean
    });

    this.option('skip-install-message', {
      desc: 'Skips the message after the installation of dependencies',
      type: Boolean
    });

    this.option('test-framework', {
      desc: 'Test framework to be invoked',
      type: String,
      defaults: 'mocha'
    });

    this.option('babel', {
      desc: 'Use Babel',
      type: Boolean,
      defaults: true
    });

    if (this.options['test-framework'] === 'mocha') {
      testLocal = require.resolve('generator-mocha/generators/app/index.js');
    } else if (this.options['test-framework'] === 'jasmine') {
      testLocal = require.resolve('generator-jasmine/generators/app/index.js');
    }

    this.composeWith(this.options['test-framework'] + ':app', {
      options: {
        'skip-install': this.options['skip-install']
      }
    }, {
      local: testLocal
    });
  },

  initializing: function () {
    this.pkg = require('../package.json');
  },

  prompting: function () {
    if (!this.options['skip-welcome-message']) {
      this.log(yosay('\'Allo \'allo! Out of the box I include HTML5 Boilerplate, jQuery, and a gulpfile to build your app.'));
    }

    var prompts = [{
      type: 'checkbox',
      name: 'features',
      message: 'Which additional features would you like to include?',
      choices: [{
        name: 'Sass',
        value: 'includeSass',
        checked: true
      }, {
        name: 'Bootstrap',
        value: 'includeBootstrap',
        checked: false
      }, {
        name: 'Modernizr',
        value: 'includeModernizr',
        checked: false
      }]
    }, {
      type: 'list',
      name: 'legacyBootstrap',
      message: 'Which version of Bootstrap would you like to include?',
      choices: [{
        name: 'Bootstrap 3',
        value: true
      }, {
        name: 'Bootstrap 4',
        value: false
      }],
      when: function (answers) {
        return answers.features.indexOf('includeBootstrap') !== -1;
      }
    }, {
      type: 'confirm',
      name: 'includeJQuery',
      message: 'Would you like to include jQuery?',
      default: true,
      when: function (answers) {
        return answers.features.indexOf('includeBootstrap') === -1;
      }
    },
	{
      type: 'checkbox',
      name: 'myBowerPackages',
      message: 'Which bower packages would you like to include?',
      choices: [{
        name: 'Neat + Bourbon 5',
        value: 'neat_and_bourbon',
        checked: true
      }, {
        name: 'Normalize-css',
        value: 'normalize-css',
        checked: true
      }, {
        name: 'slick-carousel',
        value: 'slick-carousel',
        checked: true
      }, {
        name: 'lightbox2',
        value: 'lightbox2',
        checked: true
      }]
    }];

    return this.prompt(prompts).then(function (answers) {
      var features = answers.features;

      function hasFeature(feat) {
        return features && features.indexOf(feat) !== -1;
      };

      // manually deal with the response, get back and store the results.
      // we change a bit this way of doing to automatically do this in the self.prompt() method.
      this.includeSass = hasFeature('includeSass');
      this.includeBootstrap = hasFeature('includeBootstrap');
      this.includeModernizr = hasFeature('includeModernizr');
      this.legacyBootstrap = answers.legacyBootstrap;
      this.includeJQuery = answers.includeJQuery;
      this.myBowerPackages = answers.myBowerPackages;

    }.bind(this));
  },

  writing: {
    gulpfile: function () {
      this.fs.copyTpl(
        this.templatePath('gulpfile.js'),
        this.destinationPath('gulpfile.js'),
        {
          date: (new Date).toISOString().split('T')[0],
          name: this.pkg.name,
          version: this.pkg.version,
          includeSass: this.includeSass,
          includeBootstrap: this.includeBootstrap,
          legacyBootstrap: this.legacyBootstrap,
          includeBabel: this.options['babel'],
          testFramework: this.options['test-framework']
        }
      );
    },

    packageJSON: function () {
      this.fs.copyTpl(
        this.templatePath('_package.json'),
        this.destinationPath('package.json'),
        {
          includeSass: this.includeSass,
          includeBabel: this.options['babel'],
          includeJQuery: this.includeJQuery,
        }
      );
    },

    babel: function () {
      this.fs.copy(
        this.templatePath('babelrc'),
        this.destinationPath('.babelrc')
      );
    },

    git: function () {
      this.fs.copy(
        this.templatePath('gitignore'),
        this.destinationPath('.gitignore'));

      this.fs.copy(
        this.templatePath('gitattributes'),
        this.destinationPath('.gitattributes'));
    },

    bower: function () {
      var bowerJson = {
        name: _s.slugify(this.appname),
        private: true,
        dependencies: {}
      };

      if (this.includeBootstrap) {

        // Bootstrap 4
        bowerJson.dependencies = {
          'bootstrap': '~4.0.0-alpha.6'
        };
        bowerJson.overrides = {
          'bootstrap': {
            'main': [
              'scss/bootstrap.scss',
              'dist/js/bootstrap.js'
            ]
          }
        };
        if (!this.includeSass) {
          bowerJson.overrides.bootstrap.main.push('dist/css/bootstrap.css');
        }

        // Bootstrap 3
        if (this.legacyBootstrap) {
          if (this.includeSass) {
            bowerJson.dependencies = {
              'bootstrap-sass': '~3.3.5'
            };
            bowerJson.overrides = {
              'bootstrap-sass': {
                'main': [
                  'assets/stylesheets/_bootstrap.scss',
                  'assets/fonts/bootstrap/*',
                  'assets/javascripts/bootstrap.js'
                ]
              }
            };
          } else {
            bowerJson.dependencies = {
              'bootstrap': '~3.3.5'
            };
            bowerJson.overrides = {
              'bootstrap': {
                'main': [
                  'less/bootstrap.less',
                  'dist/css/bootstrap.css',
                  'dist/js/bootstrap.js',
                  'dist/fonts/*'
                ]
              }
            };
          }
        }

      } else if (this.includeJQuery) {
        bowerJson.dependencies['jquery'] = '^3.0.0';
      }

      if (this.includeModernizr) {
        bowerJson.dependencies['modernizr'] = '~2.8.1';
      }
	  
	  //my bower components
	  if (this.myBowerPackages.indexOf('neat_and_bourbon') !== -1) {
	    bowerJson.dependencies['neat'] = '^2.0.0';
	    bowerJson.dependencies['bourbon'] = 'v5.0.0.beta.7';
	  }
	  
	 if (this.myBowerPackages.indexOf('normalize-css') !== -1) {
	   bowerJson.dependencies['normalize-css'] = '^5.0.0';
	 }
	 
	 if (this.myBowerPackages.indexOf('slick-carousel') !== -1) {
	   bowerJson.dependencies['slick-carousel'] = '^1.6.0';
	 }
	 
	 if (this.myBowerPackages.indexOf('lightbox2') !== -1) {
	   bowerJson.dependencies['lightbox2'] = '^2.9.0';
	 }
	 
	 
	 //my bower overrides
	 if (this.myBowerPackages.indexOf('slick-carousel') !== -1) {
	   bowerJson.overrides = {
            'slick-carousel': {
              'main': [
                'slick/slick.js',
                'slick/slick.scss'
              ]
            }
          };
	 }
	 
      this.fs.writeJSON('bower.json', bowerJson);
      this.fs.copy(
        this.templatePath('bowerrc'),
        this.destinationPath('.bowerrc')
      );
    },

    editorConfig: function () {
      this.fs.copy(
        this.templatePath('editorconfig'),
        this.destinationPath('.editorconfig')
      );
    },

    h5bp: function () {
      this.fs.copy(
        this.templatePath('favicon.ico'),
        this.destinationPath('app/favicon.ico')
      );

      this.fs.copy(
        this.templatePath('apple-touch-icon.png'),
        this.destinationPath('app/apple-touch-icon.png')
      );

      this.fs.copy(
        this.templatePath('robots.txt'),
        this.destinationPath('app/robots.txt'));
    },

    styles: function () {
      var css = 'main';

      if (this.includeSass) {
        css += '.scss';
      } else {
        css += '.css';
      }

      this.fs.copyTpl(
        this.templatePath(css),
        this.destinationPath('app/css/' + css),
        {
          includeBootstrap: this.includeBootstrap,
          legacyBootstrap: this.legacyBootstrap
        }
      );
	  
	  this.fs.copy(
        this.templatePath('css'),
        this.destinationPath('app/css'));
    },

    scripts: function () {
      this.fs.copy(
        this.templatePath('main.js'),
        this.destinationPath('app/js/main.js')
      );
    },

    html: function () {
      var bsPath, bsPlugins;

      // path prefix for Bootstrap JS files
      if (this.includeBootstrap) {

        // Bootstrap 4
        bsPath = '/bower_components/bootstrap/js/dist/';
        bsPlugins = [
          'util',
          'alert',
          'button',
          'carousel',
          'collapse',
          'dropdown',
          'modal',
          'scrollspy',
          'tab',
          'tooltip',
          'popover'
        ];

        // Bootstrap 3
        if (this.legacyBootstrap) {
          if (this.includeSass) {
            bsPath = '/bower_components/bootstrap-sass/assets/javascripts/bootstrap/';
          } else {
            bsPath = '/bower_components/bootstrap/js/';
          }
          bsPlugins = [
            'affix',
            'alert',
            'dropdown',
            'tooltip',
            'modal',
            'transition',
            'button',
            'popover',
            'carousel',
            'scrollspy',
            'collapse',
            'tab'
          ];
        }

      }

      this.fs.copyTpl(
        this.templatePath('_default.njk'),
        this.destinationPath('app/templates/_default.njk'),
        {
          appname: this.appname,
          includeSass: this.includeSass,
          includeBootstrap: this.includeBootstrap,
          legacyBootstrap: this.legacyBootstrap,
          includeModernizr: this.includeModernizr,
          includeJQuery: this.includeJQuery,
          bsPath: bsPath,
          bsPlugins: bsPlugins
        }
      );
	  
	  this.fs.copy(
        this.templatePath('templates'),
        this.destinationPath('app/templates'));
			  
	  this.fs.copy(
        this.templatePath('index.njk'),
        this.destinationPath('app/index.njk'));
    },

    misc: function () {
      mkdirp('app/images');
      mkdirp('app/fonts');
      mkdirp('app/sprites');
      mkdirp('app/templates');
      mkdirp('psd');
    }
  },

  install: function () {
    this.installDependencies({
      skipMessage: this.options['skip-install-message'],
      skipInstall: this.options['skip-install']
    });
  },

  end: function () {
    var bowerJson = this.fs.readJSON(this.destinationPath('bower.json'));
    var howToInstall =
      '\nAfter running ' +
      chalk.yellow.bold('npm install & bower install') +
      ', inject your' +
      '\nfront end dependencies by running ' +
      chalk.yellow.bold('gulp wiredep') +
      '.';

    if (this.options['skip-install']) {
      this.log(howToInstall);
      return;
    }

    // wire Bower packages to .html
    wiredep({
      bowerJson: bowerJson,
      directory: 'bower_components',
      exclude: ['bootstrap-sass', 'bootstrap.js'],
      ignorePath: /^(\.\.\/)*\.\./,
	  fileTypes: {
         njk: {
           block: /(([ \t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi,
           detect: {
             js: /<script.*src=['"]([^'"]+)/gi,
             css: /<link.*href=['"]([^'"]+)/gi
           },
           replace: {
             js: '<script src="{{filePath}}"></script>',
             css: '<link rel="stylesheet" href="{{filePath}}" />'
           }
         }
       },
      src: 'app/templates/_default.njk'
    });

    if (this.includeSass) {
      // wire Bower packages to .scss
      wiredep({
        bowerJson: bowerJson,
        directory: 'bower_components',
        ignorePath: /^(\.\.\/)+/,
        src: 'app/css/*.scss'
      });
    }
  }
});
