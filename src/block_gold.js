// Bitcoin Gold (BTG) block header has differences compared to Bitcoin block headers
// https://github.com/BTCGPU/BTCGPU/wiki/Technical-Spec

var Buffer = require('safe-buffer').Buffer
var varuint = require('varuint-bitcoin')

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

BlockGold.prototype.byteLength = function (headersOnly) {
  // Solution can have different size, for regtest/testnet is arround 140-170, for mainnet 1400-1500
  var headerSize = 140 + varuint.encodingLength(this.solutionLength) + this.solution.length
  if (headersOnly || !this.transactions) return headerSize

  return headerSize + varuint.encodingLength(this.transactions.length) + this.transactions.reduce(function (a, x) {
    return a + x.byteLength()
  }, 0)
}

BlockGold.fromHex = function (hex) {
  return BlockGold.fromBuffer(Buffer.from(hex, 'hex'))
}

// TODO: buffer, offset compatibility
BlockGold.prototype.toBuffer = function (headersOnly) {
  var buffer = Buffer.allocUnsafe(this.byteLength(headersOnly))

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
  writeInt32(this.height)
  writeSlice(this.reserved)
  writeUInt32(this.timestamp)
  writeUInt32(this.bits)
  writeSlice(this.nonce)
  varuint.encode(this.solutionLength, buffer, offset)
  offset += varuint.encode.bytes
  writeSlice(this.solution)

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

BlockGold.prototype.toHex = function (headersOnly) {
  return this.toBuffer(headersOnly).toString('hex')
}

module.exports = BlockGold
