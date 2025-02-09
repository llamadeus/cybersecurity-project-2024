import { trpc } from "$lib/trpc/client";
import { encrypt, randomKey } from "$lib/tulip";
import { encodeBase64Url } from "$lib/utils/base64url";
import { utf8ToBytes } from "@noble/ciphers/utils";
import { ed25519 } from "@noble/curves/ed25519";


interface CreateVaultInput {
  name: string;
  slots: Slot[];
}

interface Slot {
  name: string;
  maxSize: number;
}

interface CreateVaultResult {
  id: string;
  token: string;
  vaultKey: Uint8Array;
}

export async function createVault(masterKey: Uint8Array, values: CreateVaultInput): Promise<CreateVaultResult> {
  const attributes = JSON.stringify({
    name: values.name,
  });
  const vaultKey = randomKey();
  const encryptedVaultKey = encrypt(masterKey, vaultKey);
  const encryptedAttributes = encrypt(vaultKey, utf8ToBytes(attributes));
  const slots = values.slots.map((slot) => {
    const slotAttributes = JSON.stringify({
      name: slot.name,
    });

    return ({
      attributes: encrypt(vaultKey, utf8ToBytes(slotAttributes)),
      maxSize: slot.maxSize,
    });
  });

  const authEd25519PrivateKey = ed25519.utils.randomPrivateKey();
  const authEd25519PublicKey = ed25519.getPublicKey(authEd25519PrivateKey);
  const encryptedAuthEd25519PrivateKey = encrypt(vaultKey, authEd25519PrivateKey);

  const vault = await trpc().createVault.mutate({
    key: encodeBase64Url(encryptedVaultKey),
    attributes: encodeBase64Url(encryptedAttributes),
    authEd25519PrivateKey: encodeBase64Url(encryptedAuthEd25519PrivateKey),
    authEd25519PublicKey: encodeBase64Url(authEd25519PublicKey),
    slots: slots.map((slot) => ({
      attributes: encodeBase64Url(slot.attributes),
      maxSize: slot.maxSize,
    })),
  });

  return {
    id: vault.id,
    token: vault.token,
    vaultKey,
  };
}
