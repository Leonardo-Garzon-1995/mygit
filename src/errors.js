class RepositoryNotFoundError extends Error {
  constructor() {
    super('fatal: not a mygit repository')
    this.name = 'RepositoryNotFoundError'
  }
}

class ObjectNotFoundError extends Error {
  constructor(hash) {
    super(`Object not found: ${hash}`)
    this.name = 'ObjectNotFoundError'
  }
}

class InvalidObjectError extends Error {
  constructor(message = 'Invalid or malformed object') {
    super(message)
    this.name = 'InvalidObjectError'
  }
}

class InvalidReferenceError extends Error {
  constructor(message = 'Invalid reference or ref format') {
    super(message)
    this.name = 'InvalidReferenceError'
  }
}

class IndexFormatError extends Error {
  constructor(message = 'Invalid or corrupted index file format') {
    super(message)
    this.name = 'IndexFormatError'
  }
}

class ValidationError extends Error {
  constructor(message = 'Validation failed for input or arguments') {
    super(message)
    this.name = 'ValidationError'
  }
}

module.exports = {
  RepositoryNotFoundError,
  ObjectNotFoundError,
  InvalidObjectError,
  InvalidReferenceError,
  IndexFormatError,
  ValidationError
}