var bower = require('gulp-bower');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var gulp = require('gulp');
var gutil = require('gulp-util');
var runSequence = require('run-sequence');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var spawn = require('child_process').spawn;
var watchify = require('watchify');

var DEV_DIR = 'dev/';

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
    .pipe(gulp.dest(DEV_DIR + 'bundled_scripts'));
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

  gulp.watch(DEV_DIR + '**/*.{js,html,css,png}', browserSync.reload);
  gulp.watch(DEV_DIR + 'bower.json', ['bower']);
});

gulp.task('backend', function(callback) {
  var backend = spawn('node', ['server.js'], {stdio: 'inherit'});
  backend.on('exit', function(code) {
    callback(code === 0 ? null : 'Error status from spawned process: ' + code);
  });
});

gulp.task('default', function() {
  runSequence(['npm-install', 'bower'], ['serve:dev', 'backend']);
});
