const binaryConverter = require('./helpers/binaryConverter');
const roundHelpers = require('./value_storages/roundHelpers');
const boxes = require('./value_storages/s-boxes');
const entropy = require('./entropy');

const ROUNDS = 16;
const PART_LEN = 32;
const BOX_LEN = 6;
const BOX_QUANTITY = 8;
let L = '';
let R = '';

let R_ZERO = '';

let initialData = '';
let encryptedValue = '';

module.exports.mapThroughRounds = (inputData, keys, mode) => {
  if (mode === 'encrypt') {
    if (inputData.length !== 8 || typeof inputData !== 'string') {
      throw new Error('invalid input data');
    }

    for (let i = 0; i < inputData.length; i++) {
      let concreteSymbol = binaryConverter.toFullBinary(
        inputData[i].charCodeAt(0).toString(2)
      );
      initialData += concreteSymbol;
    }
  } else {
    initialData = inputData;
  }

  initialData = initialPermutation(initialData);

  L = initialData.slice(0, PART_LEN).join('');
  R = initialData.slice(PART_LEN).join('');

  if (mode === 'encrypt') {
    console.log('ENCRYPTION:\n');

    for (let i = 0; i < ROUNDS; i++) {
      mixer(keys[i], i + 1, true);
    }

    // entropy.calc(
    //   '1011110100100010100001000001000011000100000110100101011011011110'
    // );
  } else {
    console.log('DECRYPTION:\n');

    for (let i = ROUNDS - 1; i >= 0; i--) {
      mixer(keys[i], ROUNDS - i);
    }
  }

  encryptedValue = R + L;
  encryptedValue = finalPermutation(encryptedValue.split('')).join('');

  return encryptedValue;
};

function initialPermutation(data) {
  return roundHelpers.initialPermutationTable.map((bit) => data[bit - 1]);
}

function finalPermutation(data) {
  return roundHelpers.finalPermutationTable.map((bit) => data[bit - 1]);
}

function mixer(roundKey, iteration, entropyNeeded) {
  let funcOutput = mixerFunction(roundKey);
  let mixerRes = '';

  // xor with L
  for (let i = 0; i < funcOutput.length; i++) {
    mixerRes += funcOutput[i] ^ L[i];
  }

  // swapper
  L = R;
  R = mixerRes;

  console.log(`Round #${iteration}: \nL: ${L}`);
  console.log(`R: ${R}`);
  console.log(`Key: ${roundKey}\n`);

  if (entropyNeeded) {
    let entropyRes = entropy.calc(L + R);
    console.log(`Round entropy: ${entropyRes}\n`);
  }
}

function mixerFunction(roundKey) {
  let xorResult = '';

  // expansion permutation
  let permutKey = roundHelpers.expansionPermutation
    .map((bit) => R[bit - 1])
    .join('');

  //   xor
  for (let i = 0; i < permutKey.length; i++) {
    xorResult += permutKey[i] ^ roundKey[i];
  }

  let sBoxesArr = boxesDivision(xorResult);

  //   s-boxes convert

  for (let i = 0; i < sBoxesArr.length; i++) {
    let row = parseInt(
      sBoxesArr[i][0] + sBoxesArr[i][sBoxesArr[i].length - 1],
      2
    );
    let col = parseInt(sBoxesArr[i].substring(1, sBoxesArr[i].length - 1), 2);

    let sBoxesPart = boxes.sBoxes[i][row][col];

    sBoxesArr[i] = (sBoxesPart >>> 0).toString(2);

    let zeroStr = '';
    for (let j = 0; j < 4 - sBoxesArr[i].length; j++) {
      zeroStr += '0';
    }
    sBoxesArr[i] = zeroStr + sBoxesArr[i];
  }

  sBoxesArr = sBoxesArr.join('').split('');

  // straight permutation
  sBoxesArr = roundHelpers.straightPermutationTable.map(
    (bit) => sBoxesArr[bit - 1]
  );

  return sBoxesArr.join('');
}

function boxesDivision(xorRes) {
  const sBoxesArr = [];
  for (let i = 0; i < BOX_QUANTITY; i++) {
    sBoxesArr.push(xorRes.slice(BOX_LEN * i, BOX_LEN * i + BOX_LEN));
  }

  return sBoxesArr;
}
