/**
 * @file hash-object.js
 * @description Implements the `hash-object` command for hashing and storing objects in the repository.
 * 
 * Object types supported: 'blob', 'tree', 'commit'.
 *  Blob structure: `blob <size>\0<content>`
 *  Tree structure: `tree <size>\0<entries>`
 *  Commit structure: `commit <size>\0<content>`
 *  
 * */

const { InvalidObjectError, ValidationError } = require('../errors')
const { OBJECT_TYPES} = require('../constants')
const Output = require('../cli/output')
const Repository = require('../core/repository/repository')
const { writeBlobObject } = require('../core/objects/blobs')
const { computeObjectHash } = require('../core/objects/storage')
const path = require('../utils/paths')
const fs = require('../utils/filesystem')

module.exports = function hashObject(args=[], options={}) {

    try {
        const type = options.t || OBJECT_TYPES.BLOB
        const write = options.w || false

        if (!Object.values(OBJECT_TYPES).includes(type)) {
            throw new InvalidObjectError(`Invalid Object type: ${type}`)
        }

        const filePath = args[0]

        if (!filePath) {
            throw new ValidationError(`A file path must be provided`)
        }

        const absolutePath = path.resolve(filePath)
        if (!fs.exists(absolutePath)) {
            throw new InvalidObjectError(`File ${filePath} does not exist`)
        }
        
        const content = fs.readFileBuffer(absolutePath)

        if (write) {
            const repo = Repository.find()
            
            if (type === OBJECT_TYPES.BLOB) {
                const blobObj = writeBlobObject(repo, content)
                Output.success(blobObj)
            } else if (type === OBJECT_TYPES.TREE) {
                // not implemented yet
                return
            } else if (type === OBJECT_TYPES.COMMIT) {
                //not implemented yet
                return
            }
        } else {
            const hash = computeObjectHash(type, content)
            Output.success(hash)
        }

    } catch (error) {
        Output.error(error.message)
    }
}