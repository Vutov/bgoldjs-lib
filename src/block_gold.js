// Bitcoin Gold (BTG) block header has differences compared to Bitcoin block headers
// https://github.com/BTCGPU/BTCGPU/wiki/Technical-Spec

var Buffer = require('safe-buffer').Buffer
var bcrypto = require('./crypto')
var varuint = require('varuint-bitcoin')
var networks = require('./networks')
var eq = require('equihashjs-verify')
var lwma = require('./lwma')

var Transaction = require('./transaction')
var Block = require('./block')

function BlockGold () {
  this.version = 1
  this.prevHash = null
  this.merkleRoot = null
  this.height = 0
  this.reserved = null
  this.timestamp = 0
  this.bits = 0
  this.nonce = null
  this.solutionLength = 0
  this.solution = null
  this.transactions = []
}

BlockGold.prototype = Object.create(Block.prototype)

BlockGold.fromBuffer = function (buffer) {
  if (buffer.length < 140) throw new Error('Buffer too small (< 140 bytes)')

  var offset = 0
  function readSlice (n) {
    offset += n
    return buffer.slice(offset - n, offset)
  }

  function readUInt32 () {
    var i = buffer.readUInt32LE(offset)
    offset += 4
    return i
  }

  function readInt32 () {
    var i = buffer.readInt32LE(offset)
    offset += 4
    return i
  }

  function readVarInt () {
    var vi = varuint.decode(buffer, offset)
    offset += varuint.decode.bytes
    return vi
  }

  var block = new BlockGold()
  block.version = readInt32()
  block.prevHash = readSlice(32)
  block.merkleRoot = readSlice(32)
  block.height = readUInt32()
  block.reserved = readSlice(28)
  block.timestamp = readUInt32()
  block.bits = readUInt32()
  block.nonce = readSlice(32)
  block.solutionLength = readVarInt()
  block.solution = readSlice(block.solutionLength)

  if (buffer.length === offset) {
    return block
  }

  function readTransaction () {
    var tx = Transaction.fromBuffer(buffer.slice(offset), true)
    offset += tx.byteLength()
    return tx
  }

  var nTransactions = readVarInt()
  block.transactions = []

  for (var i = 0; i < nTransactions; ++i) {
    var tx = readTransaction()
    block.transactions.push(tx)
  }

  return block
}

BlockGold.prototype.byteLength = function (headersOnly, useLegacyFormat) {
  var headerSize = 0
  if (useLegacyFormat) {
    headerSize = 80
  } else {
    // Solution can have different size, for regtest/testnet is arround 140-170, for mainnet 1400-1500
    headerSize = 140 + varuint.encodingLength(this.solutionLength) + this.solution.length
  }

  if (headersOnly || !this.transactions) return headerSize

  return headerSize + varuint.encodingLength(this.transactions.length) + this.transactions.reduce(function (a, x) {
    return a + x.byteLength()
  }, 0)
}

BlockGold.fromHex = function (hex) {
  return BlockGold.fromBuffer(Buffer.from(hex, 'hex'))
}

BlockGold.prototype.getHash = function (network) {
  network = network || networks.bitcoingold
  var useLegacyFormat = false

  // Pre-Fork blocks
  if (this.height < network.forkHeight) {
    useLegacyFormat = true
  }

  return bcrypto.hash256(this.toBuffer(true, useLegacyFormat))
}

// TODO: buffer, offset compatibility
BlockGold.prototype.toBuffer = function (headersOnly, useLegacyFormat) {
  var buffer = Buffer.allocUnsafe(this.byteLength(headersOnly, useLegacyFormat))

  var offset = 0
  function writeSlice (slice) {
    slice.copy(buffer, offset)
    offset += slice.length
  }

  function writeInt32 (i) {
    buffer.writeInt32LE(i, offset)
    offset += 4
  }
  function writeUInt32 (i) {
    buffer.writeUInt32LE(i, offset)
    offset += 4
  }

  writeInt32(this.version)
  writeSlice(this.prevHash)
  writeSlice(this.merkleRoot)
  if (useLegacyFormat) {
    writeUInt32(this.timestamp)
    writeUInt32(this.bits)
    writeUInt32(this.nonce.slice(0, 4).readUInt32LE())
  } else {
    writeInt32(this.height)
    writeSlice(this.reserved)
    writeUInt32(this.timestamp)
    writeUInt32(this.bits)
    writeSlice(this.nonce)
    varuint.encode(this.solutionLength, buffer, offset)
    offset += varuint.encode.bytes
    writeSlice(this.solution)
  }

  if (headersOnly || !this.transactions) return buffer

  varuint.encode(this.transactions.length, buffer, offset)
  offset += varuint.encode.bytes

  this.transactions.forEach(function (tx) {
    var txSize = tx.byteLength() // TODO: extract from toBuffer?
    tx.toBuffer(buffer, offset)
    offset += txSize
  })

  return buffer
}

BlockGold.prototype.toHex = function (headersOnly, useLegacyFormat) {
  return this.toBuffer(headersOnly, useLegacyFormat).toString('hex')
}

BlockGold.prototype.checkProofOfWork = function (validateSolution, network, previousBlocks) {
  network = network || networks.bitcoingold
  var validTarget = false

  // Testnet with old lwma params are not supported yet, if needed to validate such blocks - add new network in Network.js
  if (network.lwma && this.height >= network.lwma.enableHeight) {
    var bits = lwma.calcNextBits(this, previousBlocks, network.lwma)
    validTarget = this.bits === bits
  } else {
    var hash = this.getHash().reverse()
    var target = Block.calculateTarget(this.bits)
    validTarget = hash.compare(target) <= 0
  }

  if (!validTarget) {
    return false
  }

  if (validateSolution && this.height >= network.forkHeight) {
    var header = this.toHex(true)
    var equihashParams = network.equihash || eq.networks.bitcoingold
    if (network.equihash && network.equihash.equihashForkHeight && this.height <= network.equihash.equihashForkHeight) {
      equihashParams = network.equihash.preEquihashFork
    }

    var equihash = new eq.Equihash(equihashParams)
    return equihash.verify(Buffer.from(header, 'hex'), this.solution)
  } else {
    return true
  }
}

module.exports = BlockGold
