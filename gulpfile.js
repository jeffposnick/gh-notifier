var bower = require('gulp-bower');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var del = require('del');
var gulp = require('gulp');
var gutil = require('gulp-util');
var runSequence = require('run-sequence');
var size = require('gulp-size');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var spawn = require('child_process').spawn;
var vulcanize = require('gulp-vulcanize');
var watchify = require('watchify');

var DEV_DIR = 'dev/';
var DIST_DIR = 'dist/';

gulp.task('js', bundle);
var bundler = watchify(browserify('./dev/scripts/main.js', watchify.args));
bundler.on('update', bundle);
function bundle() {
  return bundler.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(DEV_DIR + 'bundled_scripts'))
    .pipe(size({title: 'Bundled JavaScript'}));
}

gulp.task('bower', function() {
  return bower({
    cwd: DEV_DIR
  });
});

gulp.task('npm-install', function(callback) {
  var backend = spawn('npm', ['install']);
  backend.on('exit', function(code) {
    callback(code === 0 ? null : 'Error status from spawned process: ' + code);
  });
});

gulp.task('serve:dev', ['js'], function() {
  browserSync({
    server: {
      baseDir: DEV_DIR
    },
    notify: false,
    open: false
  });

  gulp.watch(DEV_DIR + '**/*.{html,css,png}', browserSync.reload);
  gulp.watch(DEV_DIR + 'bundled_scripts/bundle.js', browserSync.reload);
  gulp.watch(DEV_DIR + 'bower.json', ['bower']);
});

gulp.task('backend', function(callback) {
  var backend = spawn('node', ['server.js'], {stdio: 'inherit'});
  backend.on('exit', function(code) {
    callback(code === 0 ? null : 'Error status from spawned process: ' + code);
  });
});

gulp.task('vulcanize', function() {
  return gulp.src(DEV_DIR + 'elements.html')
    .pipe(vulcanize({
      dest: DIST_DIR,
      strip: true
    }))
    .pipe(gulp.dest(DIST_DIR));
});

gulp.task('clean', function(callback) {
  del(DIST_DIR, callback);
});

gulp.task('copy-assets', function() {
  return gulp.src([
    DEV_DIR + '{bundled_scripts,fonts,images,styles}/**/*',
    DEV_DIR + 'index.html',
    DEV_DIR + 'manifest.json',
    DEV_DIR + 'service-worker.js',
    DEV_DIR + '**/webcomponents.min.js'
  ]).pipe(gulp.dest(DIST_DIR));
});

gulp.task('build', function(callback) {
  runSequence('clean', ['vulcanize', 'js'], 'copy-assets', callback);
});

gulp.task('default', function() {
  runSequence(['npm-install', 'bower'], ['serve:dev', 'backend']);
});
