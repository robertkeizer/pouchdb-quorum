'use strict';

var utils	= require('./pouch-utils');
var uuid	= require("uuid");
var PouchDB	= require("pouchdb");
var BlueBird	= require("bluebird");

var QuorumPouch = function (opts, callback) {

	var api = this;

	api._meta = { backendPromises: [ ], backends: [ ], _instanceId: uuid.v4() };

	// Help out the developer who doesn't read the docs.
	if (!callback && typeof(opts) === "function") {
		return opts("You need to specify some options; Why don't you go read the docs?");
	}

	// Lets make sure that the options are valid.
	if (!Array.isArray(opts.backends)) {
		return callback("backends is a required option.");
	}

	// Sanity on at least a single backend being specified.
	if (opts.backends.length === 0) {
		return callback("you must specify at least a single backend.");
	}

	// Because custom adapters could be injected before we start, we should
	// allow a PouchDB object to be passed in. This allows for 
	api.PouchDB = opts.PouchDB || PouchDB;

	// Lets iterate through and create the instance
	// of pouchdb that are defined in the options.
	opts.backends.forEach(function (backend) {
		api._meta.backendPromises.push(new utils.Promise(function (resolve, reject) {

			// We don't want any funny business; Bail we if don't get an
			// object as a backend value in the array.
	
			if (typeof(backend) !== "object") {
				return reject("Backend must be an object. Read the docs.");
			}

			// Allow no options to be specified; If that is the case, an empty
			// object is used; Pouch goes to work and does whatever it wants.
			backend.pouchOptions = backend.pouchOptions || { };

			try {
				var _instance = new api.PouchDB(backend.pouchOptions);
				_instance.then(function () {
					resolve(_instance);
				}, function (error) {
					reject(error);
				});
			}catch (error) {
				reject(error);
			}
		}));
	});

	// Wait for all the backends to start up; If they do, lets set them
	// instance wide, if they error, so should we.
	utils.Promise.all(api._meta.backendPromises).then(function (backends) {
		api._meta.backends = backends;
		callback(null, api);
	}, callback);

	// This function wraps the actual querying of the independant databases
	// in quorum logic; It enforces options that are either passed in or
	// set specifically in the adapter instance.
	api._runQuorum = function (func, options, callback) {

		// Lets allow options to be optional.
		if (!callback && typeof(options) === "function") {
			callback	= options;
			options		= { };
		}

		// Lets make things a little easier for ourselves later on down
		// the road by setting ignoreKeys if it isn't set.
		options.ignoreKeys = options.ignoreKeys || [ ];

		// We're going to want to run through all the backends
		// we have..
		var _promises = [];
		api._meta.backends.forEach(function (backend) {

			// We want a single promise when dealing with this particular backend.
			_promises.push(new utils.Promise(function (resolve, reject) {

				// We want to run a function with some arguments specified.
				func.call({ }, backend, resolve, reject);
			}));
		});

		// Lets figure out how many backends we need to come back
		// with a result before we can return. Right now this is done
		// with a simple half+1 majority, in the future it should be
		// expanded to include other forms.
		var minRequired = Math.ceil(api._meta.backends.length / 2);

		// We define the minimum required values back, before we can start
		// checking the results.
		var _required = BlueBird.some(_promises, minRequired);

		// When we have the minimum we've set we should verify the results;
		// If we don't have enough results that are equal ( given options and
		// particulars ), we change what the minimum number of required responses
		// are.
		_required.then(function (results) {

			// If we've only got one result back ( ie quorum that is only 1 required )
			if (results.length === 1) {
				return callback(null, results);
			}

			var makeArray = function (obj, prefix) {
				prefix = prefix || "";
				if (prefix && prefix[prefix.length - 1] !== '.') {
					prefix += ".";
				}

				var _return = [ ];
				Object.keys(obj).forEach(function (key) {
					if (Array.isArray(obj[key])) {
						makeArray(obj[key], prefix + key).forEach(function (toPush) {
							_return.push(toPush);
						});
					} else if (typeof(obj[key]) === 'object') {
						makeArray(obj[key], prefix + key).forEach(function (toPush) {
							_return.push(toPush);
						});
					} else {
						_return.push({ "path": prefix + key, "value": obj[key]});
					}
				});
				return _return;
			};

			// Take the results we've got so far and 
			// turn the results into a merged object that
			// contains counts of unique values.

			var singleArray = [ ];
			results.forEach(function (result) {
				makeArray(result).forEach(function (what) {
					singleArray.push(what);
				});
			});

			var singleObject = { };
			try {
				singleObject = singleArray.reduce(function (a, b) {
					if (typeof(a[b.path]) === "object") {
						// Lets see if this value exists; If it
						// does we want to increment the counter
						// rather than just set the value.
						if (typeof(a[b.path][b.value]) === "object") {
							a[b.path][b.value]++;
						} else {
							a[b.path][b.value] = 1;

							// Lets bail if we can no longer make quorum. This
							// is determined by counting how many different values we
							// have so far; If nonen of them meet the requirement, and
							// we now (given the difference in length of results) cannot
							// make quorum, throw an error.
							// Also remember to respect options.ignoreKeys
							//TODO
						}
					} else {
						a[b.path] = { };
						a[b.path][b.value] = 1;
					}
					return a;
				}, { });

			} catch (err) {
				// If we've errored out here it means that 
				// we've got a key that has more than the
				// allowable values; We should wait for some
				// more promises to resolve.
				console.log("I have error of ");
				console.log(err);
				return callback(err);
			}

			// Lets go through and normalize the damn thing now that
			// we've verified that we don't have 

			// We know we've got quorum, so we pick the most common one
			// to set to.

			// Given the single object go through and match on the quorum
			// values such that if any one key fails, the entire key is
			// marked as bad.
			console.log(singleObject);
			console.log(options);
			

			callback(null, singleObject);
		});

		// There was some kind of an error; Lets make sure to notify the
		// callback.
		_required.catch(callback);
	};
	
	api.type = function () {
		return 'quorum';
	};

	api._id = utils.toPromise(function (callback) {
		callback(null, api._meta.instanceId);
	});
	
	api._info = utils.toPromise(function (callback) {
		api._runQuorum(function (backend, resolve, reject) {
			backend.info(function (err, info) {
				if (err) {
					return reject(err);
				}

				return resolve(info);
			});
		}, { ignoreKeys: [ "db_name" ] }, callback);
	});

	/*
	api._bulkDocs = function (req, opts, callback) {
		
	};

	api._get = function (id, opts, callback) {
		
	};

	api._getAttachment = function (attachment, opts, callback) {
		
	};

	api._allDocs = function (opts, callback) {
		
	};

	api._changes = function (opts) {
	
	};

	api._close = function (callback) {
		
	};

	api._getRevisionTree = function (docId, callback) {
		
	};

	api._doCompaction = function (docId, revs, callback) {
		
	};

	api._getLocal = function (id, callback) {
		
	};

	api._putLocal = function (id, opts, callback) {
		
	};

	api._removeLocal = function (doc, callback) {
		
	};

	api._destroy = function (callback) {
		
	};
	*/
};

QuorumPouch.valid = function () {
	return true;
};

exports.QuorumPouch = QuorumPouch;

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}
