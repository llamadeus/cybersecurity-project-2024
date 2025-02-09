import { trpc } from "$lib/trpc/client";
import { decrypt, encrypt } from "$lib/tulip";
import { generateDerivedKeys } from "$lib/tulip/auth";
import { decodeBase64Url, encodeBase64Url } from "$lib/utils/base64url";
import { utf8ToBytes } from "@noble/ciphers/utils";
import { x25519 } from "@noble/curves/ed25519";


interface LoginInput {
  username: string;
  password: string;
}

interface LoginResult {
  username: string;
  masterKey: Uint8Array;
  x25519PrivateKey: Uint8Array;
  x25519PublicKey: Uint8Array;
}

export async function login(values: LoginInput): Promise<LoginResult> {
  const crvResponse = await trpc().crv.query({
    u: values.username,
  });

  const [derivedEncryptionKey, derivedAuthenticationKey] = generateDerivedKeys(
    utf8ToBytes(values.password),
    decodeBase64Url(crvResponse.salt),
  );

  if (derivedEncryptionKey == null || derivedAuthenticationKey == null) {
    throw new Error("Could not generate derived keys");
  }

  const loginResponse = await trpc().login.mutate({
    u: values.username,
    ak: encodeBase64Url(derivedAuthenticationKey),
  });

  const [decryptedMasterKey] = decrypt(derivedEncryptionKey, decodeBase64Url(loginResponse.key));
  let x25519PrivateKey = loginResponse.x25519PrivateKey !== null ? decodeBase64Url(loginResponse.x25519PrivateKey) : null;
  let x25519PublicKey = loginResponse.x25519PublicKey !== null ? decodeBase64Url(loginResponse.x25519PublicKey) : null;

  if (x25519PrivateKey === null || x25519PublicKey === null) {
    x25519PrivateKey = x25519.utils.randomPrivateKey();
    x25519PublicKey = x25519.getPublicKey(x25519PrivateKey);

    const encryptedX25519PrivateKey = encrypt(decryptedMasterKey, x25519PrivateKey);

    await trpc().updateX25519.mutate({
      x25519PrivateKey: encodeBase64Url(encryptedX25519PrivateKey),
      x25519PublicKey: encodeBase64Url(x25519PublicKey),
    });
  }

  return {
    username: loginResponse.u,
    masterKey: decryptedMasterKey,
    x25519PrivateKey,
    x25519PublicKey,
  };
}
