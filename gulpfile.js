const {src, task, dest} = require("gulp");
const eslint = require("gulp-eslint");
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const imageminPngquant = require('imagemin-pngquant');
const imageResize = require('gulp-image-resize');
var rename = require("gulp-rename");

task("default", () => {
	return src(["js/*.js"])
	.pipe(eslint())
	.pipe(eslint.format())
	.pipe(eslint.failOnError());
});

task('default', function() {
    return src('img/*-sm.jpg')
        .pipe(imagemin({
            progressive: true,
            use: [imageminPngquant()]
        }))
        .pipe(webp())
        .pipe(dest('dist/images'));
});

// task('default', function () {
//   return src('img/*.webp')
//     .pipe(imageResize({
//       width : 400,
//       height : 400,
//       crop : true,
//       upscale : false,
//       quality: 0
//     }))
//     .pipe(rename(function (path) { path.basename += "-sm"; }))
//     .pipe(dest('dist/images'));
// });

