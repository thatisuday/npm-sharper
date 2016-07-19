/**
 *	@module sharper
 *	@desc <h2>Automatic image processor built on top of
 *	sharp and multer</h2>
 *	@author Uday Hiwarale <uhiwarale@gmail.com>
 *	@version v1.0.0
 *
 *	@requires graceful-fs
 *	@requires multer
 *	@requires sharp
 *	@requires lodash
 *	@requires async
 *	@requires randomstring
 *	@requires bytes
 *	@requires mime-types
**/

const
	fs 				=		require('graceful-fs'),
	multer			=		require('multer'),
	sharp			=		require('sharp'),
	_				=		require('lodash'),
	async			=		require('async'),
	dateformat		=		require('dateformat')
	randomstring	=		require('randomstring'),
	bytes			=		require('bytes'),
	mime			=		require('mime-types')
;


/**
 *	@function
 *	@desc Custom error object to throw error with custom fields
 *	@param {String} [message] Message to be attached to the error
 *	@param {String} [code] Error code
 *	@param {String} [field] Extra information field
**/
function sError(message, code, field) {
	this.name = 'Error';
	this.message = message || 'error occurred.';
	this.code = code || null;
	this.field = field || null;
}
sError.prototype = Object.create(Error.prototype);
sError.prototype.constructor = sError;


/**
 *	@function sharper
 *	@desc sharper function containing all ingredients 
 *
 *	@param {Object} options sharper configurations
 *	@returns {Function}
**/
var sharper = function(options){
	
	/**
	 *	@var
	 *	@desc Default sharper configuration options  
	**/
	var defaultOptions = {
		
		/**
		 *	@member {string}
		 *	@desc name of the image file field in multipart for data
		**/
		field : 'file',
		
		/**
		 *	@member {string}
		 *	@desc date-format to create upload directory
		**/
		dirFormat : 'yyyy/mmm/d',

		/**
		 *	@member {Number}
		 *	@desc length of the filename to be created
		**/
		fileNameLen : 50,

		/**
		 *	@member {string}
		 *	@desc maximum size of the file to be uploaded
		**/
		maxFileSize : '10mb',

		/**
		 *	@member {Array}
		 *	@desc type of files to be accepted (file extensions)
		**/
		accept : ['png','jpeg','jpg'],

		/**
		 *	@member {string}
		 *	@desc output extension of the image file
		**/
		output : 'jpg',

		/**
		 *	@member {Array}
		 *	@desc output images sizes and name suffix
		**/
		sizes : [
		    {suffix : 'lg', width : 500, height:500},
		    {suffix : 'md', width : 300, height:300},
		    {suffix : 'sm', width : 100, height:100}
		],

		/*
		 *	sharp-libvips options
		 *	to process an image
		**/
		resize : true,
		crop : false,
		background : {r:200, g:200, b:200, a:1},
		embed : false,
		max : false,
		min : false,
		withoutEnlargement : false,
		ignoreAspectRatio : false,
		extract : false,
		trim : false,
		flatten : false,
		extend : false,
		negate : false,
		rotate : false,
		flip : false,
		flop : false,
		blur : false,
		sharpen : false,
		gamma : false,
		grayscale : false,
		greyscale : false,
		normalize : false,
		normalise : false,
		progressive : false,
		quality : false,
	};


	/**
	 *	@var
	 *	@desc Transformed options to be applied to sharper  
	**/
	var options = _.assign(defaultOptions, options);


	/********************************************************************/


	/**
	 *	@function middleware
	 *	@desc Express middleware function to be returned by sharper
	**/
	return function(req, res, next){
		
		/**
		 *	@name waterfall
		 *	@desc using async waterfall function,
		 *	run multiple tasks in series
		**/
		async.waterfall(
			[
				/**
				 *	@function preflight
				 *	@desc Checks if all config options are OK
				 *	@param {Function} callback async callback function
				**/
				function(callback){
					// Check for upload location
					if(!_.has(options, 'location')) return callback(new sError('upload location empty', 'EMPTY_LOCATION'));
					
					callback(null);
				},


				/**
				 *	@function masterUpload
				 *	@desc Upload master image file using multer
				 *	@param {Function} callback async callback function
				**/
				function(callback){
					// Create config variables
					var dir = dateformat(new Date(), options.dirFormat);
					var destination = options.location + dir;
					var filename = randomstring.generate(
						options.fileNameLen
					);

					// Create master upload function
					var masterUploader = multer({
						storage : multer.diskStorage({
							destination: destination,
							filename: function(req, file, cb){
								cb(null, filename);
							}
						}),
						limits : {
							// this will return error object
							fileSize : bytes(options.maxFileSize),
							files : 1
						},
						fileFilter : function(req, file, cb){
							var fileExt = mime.extension(file.mimetype);
							if(!_.includes(options.accept, fileExt)){
								cb(new sError('file not acceptable', 'FILE_TYPE_UNSUPPORTED', fileExt));
							}
							else{
								cb(null, true);
							}
						}
					}).single(options.field);

					// Run master uploader
					masterUploader(req, res, function(err){
						if(err) return callback(err);
						
						callback(null, {
							dir : dir,
							destination : destination,
							filename : filename
						});
					});
				},


				/**
				 *	@function processImages
				 *	@desc Process all images in sharp
				 *	@param {Object} state upload state object received from
				 *	masterUpload callback function
				 *	@param {Function} callback async callback function
				**/
				function(state, callback){
					// Get instance of sharp with master image file
					var master = sharp(state.destination + '/' + state.filename);

					// Process images with sizes [in config options]
					async.each(
						options.sizes,
						function(size, _cb){
							// resize by default
							var $query = master.background(options.background);

							// check resize
							if(options.resize == true){
								$query = $query.resize(size.width, size.height);
							}

							// check crop (on valid crop option)
							if(options.crop != false && _.has(sharp.gravity, options.crop)){
								$query = $query.crop(sharp.gravity[options.crop]);
							}

							// check embed
							if(options.embed == true){
								$query = $query.embed();
							}

							// check max
							if(options.max == true){
								$query = $query.max();
							}

							// check min
							if(options.min == true){
								$query = $query.min();
							}

							// check withoutEnlargement
							if(options.withoutEnlargement == true){
								$query = $query.withoutEnlargement();
							}

							// check ignoreAspectRatio
							if(options.ignoreAspectRatio == true){
								$query = $query.ignoreAspectRatio();
							}

							// check extract
							if(options.extract != false){
								$query = $query.extract(options.extract);
							}

							// check trim
							if(options.trim != false){
								$query = $query.trim(_.toInteger(options.trim));
							}

							// check flatten
							if(options.flatten == true){
								$query = $query.flatten();
							}

							// check extend
							if(options.extend != false){
								$query = $query.extend(options.extend);
							}

							// check negate
							if(options.negate == true){
								$query = $query.negate();
							}

							// check rotate
							if(_.includes([0,90,180,270], options.rotate)){
								$query = $query.rotate(options.rotate);
							}

							// check flip
							if(options.flip == true){
								$query = $query.flip();
							}

							// check flop
							if(options.flop == true){
								$query = $query.flop();
							}

							// check blur
							if(options.blur != false){
								if(options.blur == true) $query = $query.blur();
								else $query = $query.blur(_.toNumber(options.blur));
							}

							// check sharpen
							if(options.sharpen == true){
								$query = $query.sharpen();
							}

							// check gamma
							if(options.gamma != false){
								if(options.gamma == true) $query = $query.gamma();
								else $query = $query.gamma(_.toNumber(options.gamma));
							}

							// check grayscale
							if(options.grayscale == true || options.greyscale == true){
								$query = $query.grayscale();
							}

							// check normalize
							if(options.normalize == true || options.normalise == true){
								$query = $query.normalize();
							}

							// check quality
							if(options.quality != false){
								$query = $query.quality(_.toInteger(options.quality));
							}

							// check progressive
							if(options.progressive == true){
								$query = $query.progressive();
							}


							// run query
							$query.toFile(
								state.destination + '/' + state.filename + '.' +
								size.suffix + '.' + options.output, 
								function(err){
									if(err) return _cb(err)
									_cb(null);
								}
							);
						},

						// each callback
						function(err){
							if(err) return callback(err);
							callback(null, state);
						}
					);
				},


				/**
				 *	@function deleteMaster
				 *	@desc Delete master image file from file system
				 *	@param {Object} state upload state object received from
				 *	masterUpload callback function
				 *	@param {Function} callback async callback function
				**/
				function(state, callback){
					// Unlock master image
					sharp.cache(false);
					
					// Unlink file
					fs.unlink(state.destination + '/' + state.filename, function(err){
						if(err)	return callback(err);
						callback(null, state);
					});
				}
			],


			/**
			 *	@function waterfallCallback
			 *	@desc callback function for async watefall
			 *	@param {Error} err Error received from waterfall functions
			 *	@param {Function} state upload state object received from
			 *	deleteMaster callback function
			**/
			function(err, state){
				// Call next error middleware
				if(err) return next(err);

				// Add state to express response object
				res.sharper = state;
				
				// Call next middleware
				next();
			}
		);
	}
}


/**********************************************************************/


/**
 *	Export sharper function
**/
module.exports = exports = sharper;