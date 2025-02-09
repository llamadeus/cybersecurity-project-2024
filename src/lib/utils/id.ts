import { customAlphabet } from "nanoid";


const ID_LENGTH = 7;

const ALPHA_LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const ALPHA_UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";

const generator = customAlphabet(ALPHA_LOWERCASE + ALPHA_UPPERCASE + DIGITS, 7);

export function randomId() {
  return generator(ID_LENGTH);
}

export function randomString(length: number) {
  return generator(length);
}
