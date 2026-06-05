const fs = require('../../utils/filesystem')
const { isValidBranchName } = require('../../utils/validation')
const { branchPath } = require('../repository/paths')
const { ValidationError } = require('../../errors')
const {
    createReference,
    readReference,
    updateReference,
    deleteReference,
    referenceExists,
    buildReference
} = require('./references')

// Validation 

function validateBranchName(name) {
    if (!isValidBranchName(name)) {
        throw new ValidationError(`Invalid branch name: ${name}`)
    }
}

// Core

function createBranch(repo, branchName, hash='') {
    validateBranchName(branchName)

    createReference(branchPath(repo, branchName), hash)
} 

function readBranch(repo, branchName) {
    validateBranchName(branchName)

    return readReference(branchPath(repo, branchName))
}

function updateBranch(repo, branchName, hash='') {
    validateBranchName(branchName)

    updateReference(branchPath(repo, branchName), hash)
}

function deleteBranch(repo, branchName) {
    validateBranchName(branchName)

    deleteReference(branchPath(repo, branchName))
}

// Queries

function branchExists(repo, branchName) {
    validateBranchName(branchName)

    referenceExists(branchPath(repo, branchName))
}

function listBranches(repo) {
    const headsDir = repo.paths.heads
    if (!fs.exists(headsDir)) {
        return []
    }

    return fs.listDir(headsDir).sort()
}

function getBranchPath(repo, branchName) {
    validateBranchName(branchName)

    return branchPath(repo, branchName)
}

function getBranchReference(branchName) {
    validateBranchName(branchName)

    return buildReference('heads', branchName)
}

module.exports = {
    createBranch,
    readBranch,
    updateBranch,
    deleteBranch,

    branchExists,
    listBranches,

    getBranchPath,
    getBranchReference,

    validateBranchName
}

