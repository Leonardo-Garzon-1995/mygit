/**
 * @file inspect-object.js
 * @description it takes a hash, finds the object, parses it and prints formatted information about that object
 * 
 * @example
 * mygit inspect-object 0f039e9f097bd0b8710a6f3df51fb1e5322db828
 * 
 * type: commit
 * size: 126 bytes
 * ----------------------
 * tree edecf2b6733c66b01cfb285cca13d52bece9edd6
 * author Leonardo Garzon <example@gmail.com> 1785427912 -0600
 * committer Leonardo Garzon <example@gmail.com> 1785427912 -0600
 * 
 * first commit
 *  
 */

const Repository = require('../core/repository/repository.js')
const { formatObject } = require('../core/objects/formatter.js')
const { readObject } = require('../core/objects/storage.js')
const { ValidationError} = require('../errors.js')
const Output = require('../cli/output.js')


module.exports = function inspectObject(args=[], options={}) {
    if (!args[0]) {
        throw new ValidationError('Object hash is required')
    }

    const repo = Repository.find()

    const object = readObject(repo, args[0])

    const formatted = formatObject(object)

    Output.info(formatted)
}