// https://en.bitcoin.it/wiki/List_of_address_prefixes
// Dogecoin BIP32 is a proposed standard: https://bitcointalk.org/index.php?topic=409731

module.exports = {
  bitcoingold: {
    messagePrefix: '\x1DBitcoin Gold Signed Message:\n',
    bech32: 'btg',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x26,
    scriptHash: 0x17,
    wif: 0x80,
    forkHeight: 491407,
    equihash: {
      n: 144,
      k: 5,
      person: 'BgoldPoW',
      equihashForkHeight: 536200,
      preEquihashFork: {
        n: 200,
        k: 9,
        person: 'ZcashPoW'
      }
    },
    lwma: {
      enableHeight: 536200,
      testnet: false,
      regtest: false,
      powTargetSpacing: 600,
      averagingWindow: 45,
      adjustWeight: 13772,
      minDenominator: 10,
      solveTimeLimitation: true,
      powLimit: '14134776517815698497336078495404605830980533548759267698564454644503805952'
    }
  },
  bitcoingoldtestnet: {
    messagePrefix: '\x1DBitcoin Gold Signed Message:\n',
    bech32: 'tbtg',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
    forkHeight: 1,
    equihash: {
      n: 144,
      k: 5,
      person: 'BgoldPoW',
      equihashForkHeight: 14300,
      preEquihashFork: {
        n: 200,
        k: 9,
        person: 'ZcashPoW'
      }
    },
    lwma: {
      enableHeight: 14300,
      testnet: true,
      regtest: false,
      powTargetSpacing: 600,
      averagingWindow: 45,
      adjustWeight: 13772,
      minDenominator: 10,
      solveTimeLimitation: false,
      powLimit: '14134776518227074636666380005943348126619871175004951664972849610340958207'
    }
  },
  bitcoingoldregtest: {
    messagePrefix: '\x1DBitcoin Gold Signed Message:\n',
    bech32: 'tbtg',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef,
    forkHeight: 2000,
    equihash: {
      n: 96,
      k: 5,
      person: 'BgoldPoW'
    },
    lwma: {
      enableHeight: 0,
      testnet: false,
      regtest: true,
      powTargetSpacing: 600,
      averagingWindow: 45,
      adjustWeight: 13772,
      minDenominator: 10,
      solveTimeLimitation: false,
      powLimit: '57896044618658097711785492504343953926634992332820282019728792003956564819967'
    }
  },
  bitcoin: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80
  },
  testnet: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'tb',
    bip32: {
      public: 0x043587cf,
      private: 0x04358394
    },
    pubKeyHash: 0x6f,
    scriptHash: 0xc4,
    wif: 0xef
  },
  litecoin: {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bip32: {
      public: 0x019da462,
      private: 0x019d9cfe
    },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0
  }
}
