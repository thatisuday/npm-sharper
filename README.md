# sharper [![Build Status](https://travis-ci.org/thatisuday/sharper.svg?branch=master)](https://travis-ci.org/thatisuday/sharper) ![dependencies](https://david-dm.org/thatisuday/sharper.svg)
Automatic image processor built on top of sharp and multer for express.

***

## How does it work?
When you are working on a website which needs to create multiple size copies of a single image uploaded by user, resize | crop | process and finally upload in a dynamic directory based on current date or time, then this module will save your entire lifetime.

Basically, this module provide an express middleware that do all above things at once. If something goes wrong, you can catch it in error middleware. You need to provide few options that will tell sharper about `location of upload`, `dynamic date format for upload folder to be created`, `accepted image types`, `upload size limits`, `output format`, and `output sizes with prefixes` etc.

This module is based on **[sharp](https://github.com/lovell/sharp)** node-js module for image processing. It's the fastest module there is and based on `libvips` library.

***

## Install
```
npm install --save sharper
```

***

## Configure

#### set options
```
const sharper = require('sharper');
var Sharper = sharper({
    field : 'file',
    location : '/var/www/uploads/',
    dirFormat : 'yyyy/mmm/d',
    maxFileSize: '20mb',
    fileNameLen : 50,
    accept : ['jpeg', 'jpg', 'png'],
    output : 'jpg',
    sizes : [
        {suffix : 'xlg', width : 1200, height : 1200},
        {suffix : 'lg', width : 800, height : 800},
        {suffix : 'md', width : 500, height : 500},
        {suffix : 'sm', width : 300, height : 300},
        {suffix : 'xs', width : 100, height : 100},
    ]
});
```

#### add middleware
```
app.post('/upload', Sharper, function(err, req, res, next){
    console.log(err);
    res.status(500).send('upload failed...');
}, function(req, res){
    console.log(res.sharper);
    res.send('upload successful...');
});
```

***

# Options
```
var Sharper = sharper(options);
```

#### sharper options
| option | default | role |
| ------ | ------- | ---- |
| field | 'file' | input file field in multipart form data. ex. `<input type="file" name="file"/>` |
| location | '/var/www/html/' | upload directory. |
| dirFormat | 'yyyy/mmm/d' | date pattern to follow for folder creation for image storage. Explore formats at `[node-format module](https://github.com/felixge/node-dateformat#mask-options)` |
| fileNameLen | 50 | length of the output image filename. |
| maxFileSize | '10mb' | maximum size of input/upload file to accept. |
| accept | ['png','jpeg','jpg'] | array of file types/extensions to accept. |
| output | 'jpg' | type of output file to produce. valid options : `jpg`, `png`, `gif`, `webp`, `tiff`, `bmp` |
| sizes | `[{suffix : 'lg', width : 500, height:500}, ...]` | Array of size specification object for output images (with filename suffix to produce `output-name.lg.jpg` format). |

#### sharp options
Please visit this sharp **[sharp](https://github.com/lovell/sharp)** for detailed overview of specific option.

| option | default | role |
| ------ | ------- | ---- |
| resize | true | resize images as per their sizes mentioned in `options.sizes` |
| crop | false | crop images as per their sizes mentioned in `options.sizes` |
| background | {r: 200 , g:200, b:200,  a:1} | set the background for the embed, flatten and extend operations. |
| embed | false | embed on canvas |
| max | false | set maximum output dimension  |
| min | false | set minimum output dimension |
| withoutEnlargement | false | do not enlarge small images |
| ignoreAspectRatio | false | ignore aspect ration while resizing images |
| extract | false | extract specific part of image |
| trim | false | Trim **boring** pixels from all edges |
| flatten | false | Merge alpha transparency channel, if any, with background. |
| extend | false | Extends/pads the edges of the image with background. |
| negate | false | Produces the **negative** of the image. |
| rotate | false | Rotate the output image by either an explicit angle |
| flip | false | Flip the image about the vertical Y axis. |
| flop | false | Flop the image about the horizontal X axis. |
| blur | false | Mild blur of the output image |
| sharpen | false | Mild sharpen of the output image |
| gamma | false | Apply a gamma correction. |
| grayscale *or* greyscale | false | Convert to 8-bit greyscale; 256 shades of grey. |
| normalize *or* normalise | false | Enhance output image contrast by stretching its luminance to cover the full dynamic range. |
| progressive | false | Use progressive (interlace) scan for JPEG and PNG output. |
| quality | false | The output quality to use for lossy JPEG, WebP and TIFF output formats. The default quality is 80. |

***

# Errors
You can catch errors in error middleware as shown previously. `err` object includes (but not limited to) following error codes (key ` code`).

| code | role |
| ------ | ------- |
| FILE_TYPE_UNSUPPORTED | Input file type is not acceptable to process. check `accept` option. |
| LIMIT_FILE_SIZE | Input file size is too large. Check `maxFileSize` option. |

***

# Success
Upon successful upload, sharper will add `sharper` object in `res` response object. It will have following properties.

| key | role |
| --- | ---- |
| dir | `dir` that was created for storing process image. |
| destination | absolute path of storage destination. |
| filename | name of the image files created using sharper. |

***

# Test
- npm install
- npm install -g mocha
- npm test

#### in practice
- Open terminal and run `node test-server.js` in demo folder of this module.
- Open your browser and go to `http://localhost:8800`.
- Upload a photo by clicking on dropzone.
- If upload sucessfully completes, check upload directory `/var/www/html`.
- If error occurs, check your terminal.
