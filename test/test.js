/*jshint expr:true */
'use strict';

var Pouch = require('pouchdb');

//
// Include pouchdb-quorum
//
var quorumPlugin = require('../');
Pouch.plugin(quorumPlugin);

var chai = require('chai');
chai.use(require("chai-as-promised"));

//
// more variables you might want
//
chai.should(); // var should = chai.should();
require('bluebird'); // var Promise = require('bluebird');

var dbs;
if (process.browser) {
  dbs = 'testdb' + Math.random() +
    ',http://localhost:5984/testdb' + Math.round(Math.random() * 100000);
} else {
  dbs = process.env.TEST_DB;
}

dbs.split(',').forEach(function (db) {
  var dbType = /^http/.test(db) ? 'http' : 'local';
  tests(db, dbType);
});

function tests(dbName, dbType) {

	var db;

	beforeEach(function () {
		db = new Pouch(dbName);
		return db;
	});

	afterEach(function () {
		return Pouch.destroy(dbName);
	});

	describe(dbType + ": quorum test suite", function () {
		it("should have .quorumStatus", function () {
			return db.quorumStatus().then(function (response) {
				return typeof(response) === "object";
			});
		});
	});
}
