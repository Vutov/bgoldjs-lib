/* global describe, it, beforeEach */

var assert = require('assert')
var BlockGold = require('../src/block_gold')

var fixtures = require('./fixtures/block_gold')

describe('BlockGold', function () {
  var bufferToLittleEndian = function (buffer) {
    return buffer.toString('hex').match(/.{2}/g).reverse().join('')
  }

  describe('fromBuffer/fromHex', function () {
    fixtures.valid.forEach(function (f) {
      it('imports ' + f.description, function () {
        var block = BlockGold.fromHex(f.hex)

        assert.strictEqual(block.version, f.version)
        assert.strictEqual(bufferToLittleEndian(block.prevHash), f.previousblockhash)
        assert.strictEqual(bufferToLittleEndian(block.merkleRoot), f.merkleroot)
        assert.strictEqual(block.height, f.height)
        assert.strictEqual(block.timestamp, f.time)
        assert.strictEqual(block.bits.toString(16), f.bits)
        assert.strictEqual(bufferToLittleEndian(block.nonce), f.nonce)
        assert.strictEqual(block.solution.toString('hex'), f.solution)
        assert.strictEqual(block.transactions.length, f.tx !== undefined ? f.tx.length : 0)
      })
    })

    fixtures.invalid.forEach(function (f) {
      it('throws on ' + f.exception, function () {
        assert.throws(function () {
          BlockGold.fromHex(f.hex)
        }, new RegExp(f.exception))
      })
    })
  })

  describe('toBuffer/toHex', function () {
    fixtures.valid.forEach(function (f) {
      var block

      beforeEach(function () {
        block = BlockGold.fromHex(f.hex)
      })

      it('exports ' + f.description, function () {
        var size = block.byteLength(true)
        assert.strictEqual(block.toHex(true), f.hex.slice(0, size * 2))
        assert.strictEqual(block.toHex(), f.hex)
      })
    })
  })
})
