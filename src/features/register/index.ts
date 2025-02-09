import { trpc } from "$lib/trpc/client";
import { encrypt, randomKey } from "$lib/tulip";
import { generateDerivedKeys, generateHashedAuthenticationKey, generateSalt, randomClientValue } from "$lib/tulip/auth";
import { encodeBase64Url } from "$lib/utils/base64url";
import { utf8ToBytes } from "@noble/ciphers/utils";
import { x25519 } from "@noble/curves/ed25519";


interface CreateAccountInput {
  username: string;
  password: string;
}

interface CreateAccountResult {
  username: string;
  masterKey: Uint8Array;
  salt: Uint8Array;
  clientRandomValue: Uint8Array;
  encryptedMasterKey: Uint8Array;
  hashedAuthenticationKey: Uint8Array;
}

export async function createAccount(values: CreateAccountInput): Promise<CreateAccountResult> {
  const masterKey = randomKey();
  const clientRandomValue = randomClientValue();
  const salt = generateSalt(clientRandomValue);
  const [derivedEncryptionKey, derivedAuthenticationKey] = generateDerivedKeys(utf8ToBytes(values.password), salt);
  const encryptedMasterKey = encrypt(derivedEncryptionKey, masterKey);
  const hashedAuthenticationKey = generateHashedAuthenticationKey(derivedAuthenticationKey);

  const x25519PrivateKey = x25519.utils.randomPrivateKey();
  const x25519PublicKey = x25519.getPublicKey(x25519PrivateKey);
  const encryptedX25519PrivateKey = encrypt(masterKey, x25519PrivateKey);

  await trpc().register.mutate({
    u: values.username,
    crv: encodeBase64Url(clientRandomValue),
    key: encodeBase64Url(encryptedMasterKey),
    hak: encodeBase64Url(hashedAuthenticationKey),
    x25519PrivateKey: encodeBase64Url(encryptedX25519PrivateKey),
    x25519PublicKey: encodeBase64Url(x25519PublicKey),
  });

  return {
    username: values.username,
    masterKey,
    salt,
    clientRandomValue,
    encryptedMasterKey,
    hashedAuthenticationKey,
  };
}
