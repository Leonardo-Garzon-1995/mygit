/**
 * Project-wide constants for mygit
 *
 * This module centralises all stable shared constants used across multiple
 * subsystems.  It intentionally contains no dynamic runtime values, no path
 * construction, no command logic, and no error messages.
 *
 * Usage:
 *   const { MYGIT_DIR, OBJECT_TYPES, INDEX, FILE_MODES } = require('../constants')
 */

// ── Repository constants ──────────────────────────────────────────────────────

/** Name of the repository metadata directory (equivalent to Git's `.git`). */
const MYGITDIR_NAME = '.mygit'

/** Default branch name created on `mygit init`. */
const DEFAULT_BRANCH = 'main'

// ── Hashing constants ─────────────────────────────────────────────────────────

/** Hash algorithm used for all object identifiers. */
const HASH_ALGORITHM = 'sha1'

/** Length (in hex characters) of a full object hash. */
const HASH_SIZE = 40

// ── Object type constants ─────────────────────────────────────────────────────

/**
 * Recognised Git object type strings.
 * @type {{ BLOB: string, TREE: string, COMMIT: string, TAG: string }}
 */
const OBJECT_TYPES = {
    BLOB:   'blob',
    TREE:   'tree',
    COMMIT: 'commit',
    TAG:    'tag',
}

// ── Index constants ───────────────────────────────────────────────────────────

/**
 * Index file format metadata (DIRC format, version 2).
 * @type {{ SIGNATURE: string, VERSION: number }}
 */
const INDEX = {
    SIGNATURE: 'DIRC',
    VERSION:   2,
}

// ── File mode constants ───────────────────────────────────────────────────────

/**
 * File-mode strings written into tree objects.
 * @type {{ NORMAL: string, EXECUTABLE: string, DIRECTORY: string, SYMLINK: string }}
 */
const FILE_MODES = {
    NORMAL:     '100644',
    EXECUTABLE: '100755',
    DIRECTORY:  '040000',
    SYMLINK:    '120000',
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
    MYGIT_DIR,
    DEFAULT_BRANCH,
    HASH_ALGORITHM,
    HASH_SIZE,
    OBJECT_TYPES,
    INDEX,
    FILE_MODES,
}
