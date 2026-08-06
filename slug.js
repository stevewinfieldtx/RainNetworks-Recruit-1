// Short, unguessable, URL-safe slugs. 64 bits of entropy -> non-enumerable.
const crypto = require('crypto');

function newSlug() {
  return crypto.randomBytes(8).toString('base64url'); // ~11 URL-safe chars
}

module.exports = { newSlug };
