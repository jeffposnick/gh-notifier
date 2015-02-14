var bower = require('gulp-bower');
var browserSync = require('browser-sync');
var gulp = require('gulp');
var path = require('path');

var DEV_DIR = 'dev/';

gulp.task('bower', function() {
  return bower({
    cwd: DEV_DIR
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

gulp.task('default', ['bower', 'serve:dev']);
