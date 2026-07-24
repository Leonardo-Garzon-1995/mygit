class MygitError extends Error {
  constructor(msg) {
    super(msg)
    this.name = this.constructor.name
  }
  
}

class RepositoryNotFoundError extends Error {
  constructor() {
    super('fatal: not a mygit repository')
    this.name = this.constructor.name

    this.code = 'REPO_NOT_FOUND'
  }
}

class ObjectNotFoundError extends Error {
  constructor(hash) {
    super(`Object not found: ${hash.slice(0, 8)}...`)
    this.name = this.constructor.name

    this.code = 'OBJECT_NOT_FOUND'
    this.hash = hash
  }
}

class InvalidObjectError extends MygitError {
  constructor(message = 'Invalid or malformed object') {
    super(message)

    this.code = 'INVALID_OBJECT'
  }
}

class InvalidReferenceError extends MygitError {
  constructor(message = 'Invalid reference or ref format') {
    super(message)
    
    this.code = "INVALID_REFERENCE"
  }
}

class IndexFormatError extends Error {
  constructor(message = 'Invalid or corrupted index file format') {
    super(message)
    this.name = this.constructor.name

    this.code = 'INVALID_INDEX_FORMAT'
  }
}

class IndexNotFoundError extends MygitError {
  constructor(message = 'Index is empty or does not exist') {
    super(message)

    this.code = 'INDEX_NOT_FOUND'
  }
}

class InvalidHashError extends MygitError {
  constructor (hash) {
    super(`Inavlid hash: ${hash.slice(0, 8)}...`)

    this.code = 'INVALID_HASH'
    this.hash = hash
  } 
}

class InvalidConfigError extends MygitError {
  constructor(message) {
    super(message)

    this.code = 'INVALID_CONFIG'
  }
}

class ValidationError extends Error {
  constructor(message = 'Validation failed for input or arguments') {
    super(message)
    this.name = this.constructor.name

    this.code = 'VALIDATION_ERROR'
  }
}

class AmbiguousObjectError extends MygitError {
    constructor(prefix, matches) {
        super(`Object prefix '${prefix}' is ambiguous`)
        this.prefix = prefix
        this.matches = matches

        this.code = 'AMBIGUOUS_OBJECT_ERROR'
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
  AmbiguousObjectError
}