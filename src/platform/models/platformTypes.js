/**
 * @typedef {Object} ConnectorRunResult
 * @property {'success'|'partial'|'blocked'|'error'} status
 * @property {string} sourceName
 * @property {number} recordsSeen
 * @property {number} recordsWritten
 * @property {number} recordsRejected
 * @property {string=} message
 * @property {Object<string, unknown>=} metadata
 */

/**
 * @typedef {Object} ConnectorDefinition
 * @property {string} id
 * @property {string} displayName
 * @property {'primary'|'supplementary'|'manual'|'future'} reliabilityTier
 * @property {string} complianceMode
 * @property {string[]} rawTables
 * @property {string[]} normalizedTables
 * @property {string[]} supportedModes
 */

module.exports = {};
