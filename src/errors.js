class MygitError extends Error {
  constructor(msg) {
    super(msg)
    this.name = this.constructor.name
    this.code = 'UNKNOWN_ERROR'
    this.exitCode = 1 //general failure, the operation was valid but the input was bad or the answer is "no."
  }
}

class RepositoryNotFoundError extends MygitError {
  constructor() {
    super('fatal: not a mygit repository')

    this.code = 'REPO_NOT_FOUND'
    this.exitCode = 128 // fatal, the operation couldn't even be attempted (bad repo state, bad reference, corrupt data)
  }
}

class ObjectNotFoundError extends MygitError {
  constructor(hash) {
    super(`Object not found: ${hash}`)

    this.code = 'OBJECT_NOT_FOUND'
    this.exitCode = 128
    this.hash = hash
  }
}

class InvalidObjectError extends MygitError {
  constructor(message = 'Invalid or malformed object') {
    super(message)

    this.code = 'INVALID_OBJECT'
    this.exitCode = 1
  }
}

class CorruptObjectError extends MygitError {   // on-disk data failed to parse
  constructor(message = 'Repository object is corrupt') {
      super(message)
      this.code = 'CORRUPT_OBJECT'
      this.exitCode = 128
  }
}

class InvalidReferenceError extends MygitError {
  constructor(message = 'Invalid reference or ref format') {
    super(message)
    
    this.code = "INVALID_REFERENCE"
    this.exitCode = 128
  }
}

class IndexFormatError extends Error {
  constructor(message = 'Invalid or corrupted index file format') {
    super(message)
    this.name = this.constructor.name

    this.code = 'INVALID_INDEX_FORMAT'
    this.exitCode = 128
  }
}

class IndexNotFoundError extends MygitError {
  constructor(message = 'Index is empty or does not exist') {
    super(message)

    this.code = 'INDEX_NOT_FOUND'
    this.exitCode = 1
  }
}

class InvalidHashError extends MygitError {
  constructor (hash) {
    super(`Inavlid hash: ${hash}`)

    this.hash = hash
    this.code = 'INVALID_HASH'
    this.exitCode = 1
    
  } 
}

class InvalidConfigError extends MygitError {
  constructor(message) {
    super(message)

    this.code = 'INVALID_CONFIG'
    this.exitCode = 128
  }
}

class ValidationError extends Error {
  constructor(message = 'Validation failed for input or arguments') {
    super(message)
    this.name = this.constructor.name

    this.code = 'VALIDATION_ERROR'
    this.exitCode = 1
  }
}

class AmbiguousObjectError extends MygitError {
    constructor(prefix, matches) {
        super(`Object prefix '${prefix}' is ambiguous`)
        this.prefix = prefix
        this.matches = matches

        this.code = 'AMBIGUOUS_OBJECT_ERROR'
        this.exitCode = 128
    }
}

module.exports = {
  RepositoryNotFoundError,
  ObjectNotFoundError,
  InvalidObjectError,
  InvalidReferenceError,
  IndexFormatError,
  IndexNotFoundError,
  InvalidHashError,
  InvalidConfigError,
  ValidationError,
  AmbiguousObjectError,
  CorruptObjectError
}