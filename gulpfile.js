const exec = require('child_process').exec;
const gulp = require('gulp');
const babel = require('gulp-babel');
const css = require('gulp-clean-css');
const livereload = require('gulp-livereload');
var map = require('map-stream');

gulp.task('copy', () => {
    return gulp.src('assets/**/*')
        .pipe(gulp.dest('app/assets'));
});

gulp.task('html', () => {
    return gulp.src('src/index.html')
        .pipe(gulp.dest('app/'))
        .pipe(livereload());
});

gulp.task('css', () => {
    return gulp.src('src/**/*.css')
        .pipe(css())
        .pipe(gulp.dest('app/'))
        .pipe(livereload());
});


gulp.task('json', () => {
    return gulp.src('src/**/*.json')
        .pipe(map(function(file, done) {
            var json = JSON.parse(file.contents.toString());
            var transformedJson = {
            "newRootLevel": json
            };
            file.contents = new Buffer(JSON.stringify(transformedJson));
            done(null, file);
        }))
        .pipe(gulp.dest('app/'))
        .pipe(livereload());
});


gulp.task('js', () => {
    return gulp.src(['main.js', 'src/**/*.js'])
         .pipe(babel())
         .pipe(gulp.dest('app/'))
         .pipe(livereload());
});

gulp.task('watch', async function() {
  livereload.listen();
  gulp.watch('src/**/*.html', gulp.series('html'));
  gulp.watch('src/**/*.css', gulp.series('css'));
  gulp.watch('src/**/*.js', gulp.series('js'));
  gulp.watch('src/**/*.json', gulp.series('json'));
});

gulp.task('build', gulp.series('copy', 'html', 'css', 'js', 'json'));

gulp.task('start', gulp.series('build', () => {
    return exec(
        __dirname+'/node_modules/.bin/electron .'
    ).on('close', () => process.exit());
}));

gulp.task('default', gulp.parallel('start', 'watch'));

gulp.task('release', gulp.series('build', () => {
    return exec(
        __dirname+'/node_modules/.bin/electron-builder .'
    ).on('close', () => process.exit());
}));
