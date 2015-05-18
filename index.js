'use strict';

var utils	= require('./pouch-utils');
var uuid	= require("uuid");
var PouchDB	= require("pouchdb");

exports.QuorumPouch = function (opts, callback) {
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

			// Sanity check on if the backend is an object and has 'adapter' specified.
			if (typeof(backend) !== "object") {
				return reject("Backend must be an object. Read the docs.");
			}

			// Allow no options to be specified; If that is the case, an empty
			// object is used.
			backend.options = backend.options || { };

			// Sanity check on the adapter; We want to force explicit adapters.
			if (!backend.adapter) {
				return reject("The adapter must be specified explicitly.");
			}

			try {
				return new api.PouchDB(backend.adapter, backend.options);
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
	

	api.type = function () {
		return 'quorum';
	};

	api._id = utils.toPromise(function (callback) {
		callback(null, api._meta.instanceId);
	});
	
	/*
	api._bulkDocs = function (req, opts, callback) {
		
	};

	api._get = function (id, opts, callback) {
		
	};

	api._getAttachment = function (attachment, opts, callback) {
		
	};

	api._info = function (callback) {
		
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

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(exports);
}
