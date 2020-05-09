const desHelpers = require('./desHelpers');
const binaryConverter = require('./binaryConverter');

const ROUNDS = 16;
const PART_LEN = 28;
const SHIFT_ONE = [1, 2, 9, 16];

let cArray = [];
let dArray = [];

module.exports.getKeys = (initialKey) => {
  const roundKeys = [];
  let currentKey = '';

  for (let i = 0; i < initialKey.length; i++) {
    let concreteSymbol = binaryConverter.toFullBinary(
      initialKey[i].charCodeAt(0).toString(2)
    );
    currentKey += concreteSymbol;
  }

  currentKey = parityDrop(currentKey.split(''));

  cArray = currentKey.slice(0, PART_LEN).join('');
  dArray = currentKey.slice(PART_LEN).join('');

  for (let i = 1; i <= ROUNDS; i++) {
    roundKeys.push(createKey(i));
  }

  return roundKeys;
};

function createKey(iteration) {
  let bytes = 0;
  let finalKey = '';
  if (SHIFT_ONE.includes(iteration)) {
    bytes = 1;
  } else {
    bytes = 2;
  }

  cArray = performLeftShift(bytes, cArray);
  dArray = performLeftShift(bytes, dArray);

  finalKey = (cArray + dArray).split('');

  // key compression
  finalKey = desHelpers.finalKeyPermutationTable
    .map((bit) => finalKey[bit - 1])
    .join('');

  return finalKey;
}

function parityDrop(key) {
  return desHelpers.initialKeyPermutationTable.map((bit) => key[bit - 1]);
}

function performLeftShift(bytes, keyPart) {
  return keyPart.substring(bytes) + keyPart.substring(0, bytes);
  // return (parseInt(keyPart, 2) << bytes).toString(2);
}