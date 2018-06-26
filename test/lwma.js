/* global describe, it */

var assert = require('assert')
var BlockGold = require('../src/block_gold')
var lwma = require('../src/lwma')
var networks = require('../src/networks')

var fixtures = require('./fixtures/lwma')

describe('lwma', function () {
  describe('calcNextBits', function () {
    fixtures.valid.forEach(function (f) {
      it('imports ' + f.description, function () {
        var block = BlockGold.fromHex(f.hex)
        var prevBlocks = []
        var network = networks[f.network]
        f.prevBlocksHex.forEach(b => {
          var blockGold = BlockGold.fromHex(b)
          prevBlocks.push(blockGold)
        })

        var bits = lwma.calcNextBits(block, prevBlocks, network.lwma)
        assert.strictEqual(block.bits, bits)
      })
    })

    fixtures.invalid.forEach(function (f) {
      it('imports ' + f.description, function () {
        var block = BlockGold.fromHex(f.hex)
        var prevBlocks = []
        var network = networks[f.network]
        f.prevBlocksHex.forEach(b => {
          var blockGold = BlockGold.fromHex(b)
          prevBlocks.push(blockGold)
        })

        try {
          lwma.calcNextBits(block, prevBlocks, network.lwma)
          throw new Error('caclNextBits did not throw exception')
        } catch (ex) {
          assert.strictEqual(ex.message, f.message)
        }
      })
    })
  })
})
