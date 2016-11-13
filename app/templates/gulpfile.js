// generated on <%= date %> using <%= name %> <%= version %>
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');
const critical = require('critical').stream;

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

var dev = true;

gulp.task('styles', () => {
  <% if (includeSass) { %>
  return gulp.src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe($.preprocess({context: {DEV: dev}}))
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    <% } else { %>
  return gulp.src('app/styles/*.css')
    .pipe($.sourcemaps.init())
    <% } %>
    .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

<% if (includeBabel) { -%>
gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.babel())
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe(reload({stream: true}));
});
<% } -%>

function lint(files) {
  return gulp.src(files)
    .pipe($.eslint({ fix: true }))
    .pipe(reload({stream: true, once: true}))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
  return lint('app/scripts/**/*.js')
    .pipe(gulp.dest('app/scripts'));
});

gulp.task('lint:test', () => {
  return lint('test/spec/**/*.js')
    .pipe(gulp.dest('test/spec'));
});


gulp.task('nunjucks', () => {
  return gulp.src('app/*.njk')
    .pipe($.plumber())
    .pipe($.nunjucksRender({
      path: 'app'
    }))
    .pipe($.cached('njkCache'))
    .pipe($.print(function(filepath) {
      return "njk compiled: " + filepath;
    }))
    .pipe(gulp.dest('.tmp'))
    .pipe($.htmlhint())
    .pipe($.htmlhint.reporter())
    .pipe(reload({stream: true}));
});

<% if (includeBabel) { -%>
gulp.task('html', ['nunjucks', 'styles', 'scripts'], () => {
<% } else { -%>
gulp.task('html', ['nunjucks', 'styles'], () => {
<% } -%>
  return gulp.src(['app/*.html', '.tmp/*.html'])
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.if('*/main.css', $.replace('../../images/', '../images/')))
    .pipe($.if('*.html', $.replace('../images/', 'images/')))
    .pipe($.if('index.html', critical({
      inline: true,
      minify: true,
      base: 'dist/',
      //width: 320,
      //height: 480
      dimensions: [{
        height: 900,
        width: 1200
      }, {
        height: 320,
        width: 480
      }],
      pathPrefix: './' ,
      ignore: ['@font-face']
    })))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
  return gulp.src(require('main-bower-files')('**/*.{png,gif,jpg}', function (err) {})
    .concat(['app/images/**/*']))
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('sprites', () => {
  var spriteData =
      gulp.src('app/sprites/*.*')
          .pipe($.spritesmith({
            imgName: 'sprite.png',
            cssName: 'sprite.scss',
            imgPath: '../images/sprite.png',
            cssVarMap: function (sprite) {
              sprite.name = 'icon-' + sprite.name;
            }
          }));
  var imgStream = spriteData.img.pipe(gulp.dest('app/images'));
  var scssStream = spriteData.css.pipe(gulp.dest('app/styles/tools'));
});

gulp.task('bowerFonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {}))
    .pipe(gulp.dest('app/fonts/bowerFonts'))
});

gulp.task('fonts', ['bowerFonts'], () => {
  return gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*',
    '!app/*.html',
    '!app/*.njk'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', () => {
  runSequence(['wiredep'], ['nunjucks', 'styles'<% if (includeBabel) { %>, 'scripts'<% } %>, 'bowerFonts'], () => {
    browserSync.init({
      notify: false,
      port: 9000,
      server: {
        baseDir: ['.tmp', 'app'],
        routes: {
          '/bower_components': 'bower_components'
        }
      },
    browser: 'chrome'
    });

    gulp.watch([
      'app/*.html',
<% if (!includeBabel) { -%>
      'app/scripts/**/*.js',
<% } -%>
      'app/images/**/*',
    ]).on('change', reload);

  gulp.watch('app/**/*.njk', ['nunjucks']);
  gulp.watch('app/sprites/*', ['sprites']);
  gulp.watch('app/styles/**/*.<%= includeSass ? 'scss' : 'css' %>', ['styles']);
<% if (includeBabel) { -%>
    gulp.watch('app/scripts/**/*.js', ['scripts']);
<% } -%>
    gulp.watch('bower.json', ['wiredep', 'bowerFonts']);
  });
});

gulp.task('serve:dist', ['default'], () => {
  browserSync.init({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

<% if (includeBabel) { -%>
gulp.task('serve:test', ['scripts'], () => {
<% } else { -%>
gulp.task('serve:test', () => {
<% } -%>
  browserSync.init({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
<% if (includeBabel) { -%>
        '/scripts': '.tmp/scripts',
<% } else { -%>
        '/scripts': 'app/scripts',
<% } -%>
        '/bower_components': 'bower_components'
      }
    }
  });

<% if (includeBabel) { -%>
  gulp.watch('app/scripts/**/*.js', ['scripts']);
<% } -%>
  gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
<% if (includeSass) { %>
  gulp.src('app/styles/*.scss')
    .pipe($.filter(file => file.stat && file.stat.size))
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));
<% } %>
  gulp.src('app/templates/*.njk')
    .pipe(wiredep({
    <% if (includeBootstrap) { if (includeSass) { %>
      exclude: ['bootstrap-sass'],<% } else { %>
      exclude: ['bootstrap.js'],<% }} %>
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
       }
    }))
    .pipe(gulp.dest('app/templates'));
});

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('default', () => {
  return new Promise(resolve => {
    dev = false;
    runSequence(['clean', 'wiredep'], 'build' resolve);
  });
});
