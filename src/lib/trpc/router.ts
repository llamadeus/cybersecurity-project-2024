import { accessVault } from "$lib/trpc/routes/access-vault";
import { auth } from "$lib/trpc/routes/auth";
import { cleanStorage } from "$lib/trpc/routes/clean-storage";
import { clearSlot } from "$lib/trpc/routes/clear-slot";
import { createVault } from "$lib/trpc/routes/create-vault";
import { crv } from "$lib/trpc/routes/crv";
import { deleteFile } from "$lib/trpc/routes/delete-file";
import { deleteVault } from "$lib/trpc/routes/delete-vault";
import { file } from "$lib/trpc/routes/file";
import { files } from "$lib/trpc/routes/files";
import { login } from "$lib/trpc/routes/login";
import { logout } from "$lib/trpc/routes/logout";
import { register } from "$lib/trpc/routes/register";
import { requestVault } from "$lib/trpc/routes/request-vault";
import { slot } from "$lib/trpc/routes/slot";
import { updateX25519 } from "$lib/trpc/routes/updateX25519";
import { upload } from "$lib/trpc/routes/upload";
import { uploadWithTicket } from "$lib/trpc/routes/upload-with-ticket";
import { vaults } from "$lib/trpc/routes/vaults";
import { t } from "$lib/trpc/t";


export const router = t.router({
  // Auth
  auth,

  // Registration
  register,

  // Login
  crv,
  login,

  // Authenticated routes
  updateX25519,
  logout,
  file,
  files,
  upload,
  uploadWithTicket,
  cleanStorage,
  deleteFile,

  // Vaults
  createVault,
  deleteVault,
  vaults,
  slot,
  clearSlot,

  // Public vault access
  requestVault,
  accessVault,
});

export const createCaller = t.createCallerFactory(router);

export type Router = typeof router;
