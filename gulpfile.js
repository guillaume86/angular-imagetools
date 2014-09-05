var gulp = require('gulp');
var coffee = require('gulp-coffee');
var concat = require('gulp-concat');

gulp.task('coffee', function() {
  return gulp.src('./src/*.coffee')
    .pipe(coffee())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('build', ['coffee'], function() {
  gulp.src([
      './bower_components/StackBlur/StackBlur.js', 
      './dist/angular-imagetools.js'
    ])
    .pipe(concat('angular-imagetools.all.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('default', ['build']);
