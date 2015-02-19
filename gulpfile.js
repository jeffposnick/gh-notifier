/**
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var bower = require('gulp-bower');
var browserSync = require('browser-sync');
var browserify = require('browserify');
var buffer = require('vinyl-buffer');
var del = require('del');
var envify = require('envify');
var ghPages = require('gh-pages');
var glob = require('glob');
var gulp = require('gulp');
var gutil = require('gulp-util');
var merge = require('merge-stream');
var path = require('path');
var runSequence = require('run-sequence');
var size = require('gulp-size');
var source = require('vinyl-source-stream');
var sourcemaps = require('gulp-sourcemaps');
var spawn = require('child_process').spawn;
var vulcanize = require('gulp-vulcanize');
var watchify = require('watchify');

var DEV_DIR = 'dev/';
var BUNDLED_SCRIPTS_DIR = DEV_DIR + 'bundled_scripts';
var DIST_DIR = 'dist/';

function bundle(bundler, sourceScript) {
  return bundler.bundle()
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source(path.basename(sourceScript)))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(BUNDLED_SCRIPTS_DIR))
    .pipe(size({title: 'Bundled JavaScript'}));
}

gulp.task('js', function(callback) {
  del.sync(BUNDLED_SCRIPTS_DIR);
  var streams = glob.sync(DEV_DIR + 'scripts/*.js').map(function(sourceScript) {
    var bundler = browserify('./' + sourceScript);
    bundler.transform(envify.bind(envify, {_: 'purge'}));
    bundler.transform('uglifyify');
    return bundle(bundler, sourceScript);
  });

  if (streams.length === 0) {
    return;
  }

  if (streams.length === 1) {
    return streams[0];
  }

  var merged = merge(streams.pop(), streams.pop());
  streams.forEach(function(stream) {
    merged.add(stream);
  });
  return merged;
});

gulp.task('js-watch', function() {
  del.sync(BUNDLED_SCRIPTS_DIR);
  glob.sync(DEV_DIR + 'scripts/*.js').forEach(function(sourceScript) {
    var bundler = watchify(browserify('./' + sourceScript, watchify.args));
    bundler.transform(envify.bind(envify, {_: 'purge'}));
    bundle(bundler, sourceScript);
    bundler.on('update', bundle.bind(bundle, bundler, sourceScript));
  });
});

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

gulp.task('serve:frontend', ['bower', 'js-watch'], function() {
  browserSync({
    server: {
      baseDir: DEV_DIR
    },
    notify: false,
    open: false
  });

  gulp.watch(DEV_DIR + '**/*.{html,css,png}', browserSync.reload);
  gulp.watch(DEV_DIR + 'bundled_scripts/*.js', browserSync.reload);
  gulp.watch(DEV_DIR + 'bower.json', ['bower']);
});

gulp.task('serve:backend', ['npm-install'], function(callback) {
  var backend = spawn('node', ['server.js'], {stdio: 'inherit'});
  backend.on('exit', function(code) {
    callback(code === 0 ? null : 'Error status from spawned process: ' + code);
  });
});

gulp.task('serve', ['serve:frontend', 'serve:backend']);

gulp.task('vulcanize', function() {
  return gulp.src(DEV_DIR + 'elements.html')
    .pipe(vulcanize({
      dest: DEV_DIR,
      inline: true,
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
    DEV_DIR + '!(elements)*.html',
    DEV_DIR + 'manifest.json',
    DEV_DIR + 'service-worker.js',
    DEV_DIR + '**/webcomponents.min.js'
  ]).pipe(gulp.dest(DIST_DIR));
});

gulp.task('build', function(callback) {
  runSequence('clean', ['vulcanize', 'js'], 'copy-assets', callback);
});

gulp.task('gh-pages', ['build'], function(callback) {
  ghPages.publish(path.join(__dirname, DIST_DIR), callback);
});

gulp.task('default', ['serve']);
