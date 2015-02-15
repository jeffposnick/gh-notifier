var bower = require('gulp-bower');
var browserSync = require('browser-sync');
var gulp = require('gulp');
var path = require('path');
var runSequence = require('run-sequence');
var spawn = require('child_process').spawn;

var DEV_DIR = 'dev/';

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

gulp.task('serve:dev', function() {
  browserSync({
    server: {
      baseDir: DEV_DIR
    },
    notify: false
  });
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
