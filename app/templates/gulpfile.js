// generated on <%= date %> using <%= name %> <%= version %>
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');
const critical = require('critical').stream;
const ftp = require( 'vinyl-ftp' );
const { gulpSassError } = require('gulp-sass-error');

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

var dev = true;
var wa_mode = false;

gulp.task('css', () => {
  var conn = ftp.create( {
    host:     'ftpHost',
    user:     'ftpUserName',
    password: 'ftpPassword',
    parallel: 10,
  } );
  <% if (includeSass) { %>
  return gulp.src('app/css/*.scss')
    .pipe($.plumber())
    .pipe($.preprocess({context: {DEV: dev}}))
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', gulpSassError(!dev)))<% } else { %>
  return gulp.src('app/css/*.css')
    .pipe($.if(dev, $.sourcemaps.init()))<% } %>
    .pipe($.if(!dev, $.replace('../../images/', '../images/')))
    .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    .pipe($.if(dev, $.sourcemaps.write()))
    .pipe($.if(wa_mode, conn.dest( '/wa-data/public/shop/themes/techauto/css' )))
    .pipe(gulp.dest(wa_mode ? 'dist_wa/css' : '.tmp/css'))
    .pipe(reload({stream: true}));
});

<% if (includeBabel) { -%>
gulp.task('js', () => {
  return gulp.src('app/js/**/*.js')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.babel())
    .pipe($.if(dev, $.sourcemaps.write('.')))
    .pipe(gulp.dest(wa_mode ? 'dist_wa/js' : '.tmp/js'))
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
  return lint('app/js/**/*.js')
    .pipe(gulp.dest('app/js'));
});

gulp.task('lint:test', () => {
  return lint('test/spec/**/*.js')
    .pipe(gulp.dest('test/spec'));
});

var njkEnvironment = function(environment) {
  // environment.addFilter('slug', function(str) {
  //   return str && str.replace(/\s/g, '-', str).toLowerCase();
  // });
  environment.addGlobal('wa_mode', wa_mode)
  environment.addGlobal('dev', dev)
}

gulp.task('nunjucks', () => {
  var njkSrc = wa_mode ? ['app/*.njk', 'app/templates_wa/*.njk'] : 'app/*.njk';
  return gulp.src(njkSrc)
    .pipe($.plumber())
    .pipe($.nunjucksRender({
      path: 'app',
      manageEnv: njkEnvironment
    }))
    .pipe($.cached('njkCache'))
    .pipe($.print(function(filepath) {
      return "NJK compiled: " + filepath;
    }))
    .pipe($.if(!dev, $.replace('../images/', 'images/')))
    .pipe($.if(wa_mode, $.replace('images/', '{$wa_theme_url}images/')))
    .pipe(gulp.dest(wa_mode ? 'dist_wa' : '.tmp'));
});

gulp.task('njkRefresh', ['nunjucks'], () => {
  reload();
});

<% if (includeBabel) { -%>
gulp.task('html', ['nunjucks', 'css', 'js'], () => {
<% } else { -%>
gulp.task('html', ['nunjucks', 'css'], () => {
<% } -%>
  return gulp.src(['app/*.html', '.tmp/*.html'])
    .pipe($.useref({searchPath: ['.tmp', 'app', '.']}))
    .pipe($.if( /.*\.(css|js)$/, $.cached('CSSandJScache')))
    .pipe($.if('*.css', $.print(function(filepath) {
      return "CSS combined: " + filepath;
    })))
    .pipe($.if('*.js', $.print(function(filepath) {
      return "JS compiled: " + filepath;
    })))
    .pipe($.if(!wa_mode,
      $.if('*.html',
        $.htmlhint())))
    .pipe($.if(!wa_mode,
      $.if('*.html',
        $.htmlhint.failReporter())))

    //.pipe($.if('index.html',
    //  critical({
    //    inline: true,
    //    minify: true,
    //    base: 'dist',
    //    //width: 320,
    //    //height: 480
    //    dimensions: [{
    //      height: 900,
    //      width: 1200
    //    }, {
    //      height: 320,
    //      width: 480
    //    }],
    //    pathPrefix: './',
    //    ignore: ['@font-face']
    //  })))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
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
  var scssStream = spriteData.css.pipe(gulp.dest('app/css/tools'));
});

gulp.task('bowerFonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) {}))
    .pipe(gulp.dest('app/fonts/bowerFonts'));
});

gulp.task('bowerImages', () => {
  return gulp.src(require('main-bower-files')('**/*.{png,gif,jpg}', function (err) {}))
    .pipe(gulp.dest('app/images/'));
});

gulp.task('fonts', () => {
  return gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*',
    '!app/*.html',
    '!app/sprites/',
    '!app/templates/',
    '!app/*.njk'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist', 'dist_wa']));

gulp.task('serve', () => {
  runSequence(['nunjucks', 'css'], () => {
    browserSync.init({
      notify: false,
      port: 9000,
      server: {
        index: "index.html",
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
      'app/js/**/*.js',
<% } -%>
      'app/images/**/*',
    ]).on('change', reload);

  gulp.watch('app/**/*.njk', ['njkRefresh']);
  gulp.watch('app/sprites/*', ['sprites']);
  gulp.watch('app/css/**/*.<%= includeSass ? 'scss' : 'css' %>', ['css']);
<% if (includeBabel) { -%>
  gulp.watch('app/js/**/*.js', ['js']);
<% } -%>
  gulp.watch('bower.json', ['wiredep']);
  });
});

gulp.task('set_wa_mode', () => {
  dev = false;
  wa_mode = true;
});

gulp.task('wa_serve', ['set_wa_mode'], () => {
  runSequence('css');

  gulp.watch('app/css/**/*.scss', ['css']);
});

gulp.task('wa_html', ['set_wa_mode'], () => {
  runSequence('nunjucks');
});

gulp.task('wa_css', ['set_wa_mode'], () => {
  runSequence('css');
});
<% if (includeBabel) { -%>
gulp.task('wa_js', ['set_wa_mode'], () => {
  runSequence('js');
});<% } -%>

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
gulp.task('serve:test', ['js'], () => {
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
        '/js': '.tmp/js',
<% } else { -%>
        '/js': 'app/js',
<% } -%>
        '/bower_components': 'bower_components'
      }
    }
  });

<% if (includeBabel) { -%>
  gulp.watch('app/js/**/*.js', ['js']);
<% } -%>
  gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', ['bowerFonts', 'bowerImages'] , () => {<% if (includeSass) { %>
  gulp.src('app/css/*.scss')
    .pipe($.filter(file => file.stat && file.stat.size))
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/css'));
<% } %>
  gulp.src('app/templates/*.njk')
    .pipe(wiredep({<% if (includeBootstrap) { if (includeSass) { %>
      exclude: ['bootstrap<% if (legacyBootstrap) { %>-sass<% } %>'],<% } else { %>
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
    runSequence(['clean', 'wiredep'], 'build', resolve);
  });
});
