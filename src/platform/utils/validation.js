function required(value, field) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new Error(`Missing required field: ${field}`);
  }
  return value;
}

function optionalNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function enumValue(value, allowed, fallback = null) {
  if (!value) return fallback;
  return allowed.includes(value) ? value : fallback;
}

module.exports = {
  required,
  optionalNumber,
  enumValue,
};
