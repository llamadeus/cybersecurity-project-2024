# sv

## Use cases

- [x] Register
  - Username
  - Password
    -> Returns session token and user database chunk
- [x] Login
  - Username
  - Password
    -> Returns session token and user database chunk
- [x] Get current session
- [x] Change password
- [ ] Upload file
  1. Select file
  2. Chunk file using fast-cdc
  3. Encrypt file
  4. Upload chunks
  5. Update local database
  6. Chunk local database using fast-cdc
  7. Encrypt local database
  8. Upload chunks
- [ ] Download file
  1. Download chunks
  2. Join chunks and restore blob
  3. Decrypt blob
- [ ] Delete file
  1. Delete chunks
  2. Update local database
  3. Encrypt local database
  4. Chunk local database using fast-cdc
  5. Upload chunks

## Thoughts

- Use `zlib` to compress the local database

## Current issues

- Registration leaks the information whether a username exists or not
- Does the second request of the login procedure properly prevent timing attacks?
- Is my own implementation of signing the session id secure?
- Is sending the signed session id as a cookie secure?
- What if an upload takes longer than 24 hours when the `upload` record is deleted?
- We have to take all data of the user into consideration when calculating their storage usage because evil people could
  just hide their data in the database
  - Take the 40 bytes overhead into consideration
  - Encrypted file attributes
  - Any keys the user uploads 
