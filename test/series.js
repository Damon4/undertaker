'use strict';

var lab = exports.lab = require('lab').script();
var expect = require('code').expect;

var describe = lab.describe;
var it = lab.it;
var beforeEach = lab.beforeEach;

var Undertaker = require('../');

function fn1(done) {
  done(null, 1);
}

function fn2(done) {
  setTimeout(function() {
    done(null, 2);
  }, 500);
}

function fn3(done) {
  done(null, 3);
}

function fnError(done) {
  done(new Error('An Error Occurred'));
}

describe('series', function() {
  var taker;

  beforeEach(function(done) {
    taker = new Undertaker();
    taker.task('test1', fn1);
    taker.task('test2', fn2);
    taker.task('test3', fn3);
    taker.task('error', fnError);
    done();
  });

  it('should take all string names', function(done) {
    taker.series('test1', 'test2', 'test3')(function(err, results) {
      expect(results).to.deep.equal([1, 2, 3]);
      done(err);
    });
  });

  it('should take all functions', function(done) {
    taker.series(fn1, fn2, fn3)(function(err, results) {
      expect(results).to.deep.equal([1, 2, 3]);
      done(err);
    });
  });

  it('should take string names and functions', function(done) {
    taker.series('test1', fn2, 'test3')(function(err, results) {
      expect(results).to.deep.equal([1, 2, 3]);
      done(err);
    });
  });

  it('should take nested series', function(done) {
    var series1 = taker.series('test1', 'test2', 'test3');
    taker.series('test1', series1, 'test3')(function(err, results) {
      expect(results).to.deep.equal([1, [1, 2, 3], 3]);
      done(err);
    });
  });

  it('should stop processing on error', function(done) {
    taker.on('error', function() {
      // To keep the test from catching the emitted errors
    });
    taker.series('test1', 'error', 'test3')(function(err, results) {
      expect(err).to.be.an.instanceof(Error);
      expect(results).to.deep.equal([1, undefined, undefined]);
      done();
    });
  });

  it('should throw on unregistered task', function(done) {
    function unregistered() {
      taker.series('unregistered');
    }

    expect(unregistered).to.throw('Task never defined: unregistered');
    done();
  });

  it('should process all functions if settle flag is true', function(done) {
    taker.on('error', function() {
      // To keep the test from catching the emitted errors
    });
    taker._settle = true;
    taker.series(taker.series('test1', 'error'), 'test3')(function(err, results) {
      expect(err[0][0]).to.be.an.instanceof(Error);
      expect(results).to.deep.equal([3]);
      done();
    });
  });

});
