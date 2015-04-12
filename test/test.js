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

var assert = require("assert");

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
		db = new Pouch(dbName, {"quorum": "foo"});
		return db;
	});

	afterEach(function () {
		return db.destroy();
	});

	describe(dbType + ": quorum test suite", function () {

		describe("Basics", function () {

			it("should have .quorumStatus defined", function () {
				assert.equal(typeof(db.quorumStatus), "function");
			});
		});

		describe("quorumStatus", function () {
			
			it("should return an object", function (cb) {
				db.quorumStatus().then(function (response) {
					assert.equal(typeof(response), "object");
					cb();
				});
			});
		});

		describe("put", function () {
			it("executes", function (cb) {
				db.put({"foo": "bar"}, "foobar").then(function () {
					cb();
				}, function (err) {
					return cb(err);
				});
			});
		});
	});
}
