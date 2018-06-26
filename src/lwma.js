// https://github.com/BTCGPU/BTCGPU/blob/c919e0774806601f8b192378d078f63f7804b721/src/pow.cpp#L74
var BigInteger = require('bigi')

function calcNextBits (currentBlock, previousBlocks, lwmaConfig) {
  if (!previousBlocks || previousBlocks.length <= lwmaConfig.averagingWindow) {
    throw new Error('LWMA need the last ' + (lwmaConfig.averagingWindow + 1) + ' blocks to determine the next target')
  }

  var prevBlocks = {}
  previousBlocks.forEach(b => {
    prevBlocks[b.height] = b
  })

  for (var i = currentBlock.height - lwmaConfig.averagingWindow - 1; i < currentBlock.height; i++) {
    if (!prevBlocks[i]) {
      throw new Error('Block with height ' + i + ' is missing, cannot calculate next target')
    }
  }

    // loss of precision when converting target to bits, comparing target to target (from bits) will result in different uint256
  var nextTarget = getLwmaTarget(currentBlock, prevBlocks, lwmaConfig)
  var bits = targetToBits(nextTarget)

  return bits
}

function getLwmaTarget (cur, prevBlocks, lwmaConfig) {
  var weight = lwmaConfig.adjustWeight
  var height = cur.height
  var prev = prevBlocks[height - 1]

    // Special testnet handling
  if (lwmaConfig.regtest) {
    return bitsToTarget(prev.bits)
  }

  var limitBig = new BigInteger(lwmaConfig.powLimit.toString())
  if (lwmaConfig.testnet && cur.timestamp > prev.timestamp + lwmaConfig.powTargetSpacing * 2) {
    return limitBig
  }

  var totalBig = BigInteger.ZERO
  var t = 0
  var j = 0
  var ts = 6 * lwmaConfig.powTargetSpacing
  var dividerBig = new BigInteger((weight * lwmaConfig.averagingWindow * lwmaConfig.averagingWindow).toString())

    // Loop through N most recent blocks.  "< height", not "<="
  for (var i = height - lwmaConfig.averagingWindow; i < height; i++) {
    cur = prevBlocks[i]
    prev = prevBlocks[i - 1]

    var solvetime = cur.timestamp - prev.timestamp
    if (lwmaConfig.solveTimeLimitation && solvetime > ts) {
      solvetime = ts
    }

    j += 1
    t += solvetime * j
    var targetBig = bitsToTarget(cur.bits)
    totalBig = totalBig.add(targetBig.divide(dividerBig))
  }

    // Keep t reasonable in case strange solvetimes occurred.
  if (t < Math.trunc(lwmaConfig.averagingWindow * weight / lwmaConfig.minDenominator)) {
    t = Math.trunc(lwmaConfig.averagingWindow * weight / lwmaConfig.minDenominator)
  }

  var newTargetBig = totalBig.multiply(new BigInteger(t.toString()))
  if (newTargetBig.compareTo(limitBig) >= 0) {
    newTargetBig = limitBig
  }

  return newTargetBig
}

function bitsToTarget (bits) {
  var bitsBig = new BigInteger(bits.toString())
  var size = bitsBig.shiftRight(24)
  var word = bits & 0x007fffff

  var wordBig = new BigInteger(word.toString())
  if (size <= 3) {
    return wordBig.shiftRight(8 * (3 - size))
  }

  return wordBig.shiftLeft(8 * (size - 3))
}

function targetToBits (target) {
  var nsize = Math.trunc((target.bitLength() + 7) / 8)
  var cBig = BigInteger.ZERO

  if (nsize <= 3) {
    cBig = target.shiftLeft(8 * (3 - nsize))
  } else {
    cBig = target.shiftRight(8 * (nsize - 3))
  }

  var c = Number(cBig.toString())
  if (c & 0x00800000) {
    c >>= 8
    nsize += 1
  }

  c |= nsize << 24
  return c
}

module.exports = {
  calcNextBits: calcNextBits
}
