// Pure-JS regression utilities for the calibration pipeline.
//
// Implements:
//   - Ridge regression (closed-form L2) — used for per-trait feature weights
//   - Logistic regression (gradient descent) — used for global comp distance weights
//   - Matrix utilities (multiply, transpose, invert via Gauss-Jordan)
//
// Sized for the calibration use case: <= 20 features, <= 1000 rows. NOT
// production-ML grade; sufficient for a one-shot fit that produces
// coefficients we freeze into scoringCalibration.json.

// ---------- MATRIX UTILS ----------

function transpose(A) {
  const m = A.length, n = A[0].length;
  const T = Array.from({ length: n }, () => new Array(m));
  for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) T[j][i] = A[i][j];
  return T;
}

function multiply(A, B) {
  const m = A.length, k = A[0].length, n = B[0].length;
  const C = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      let s = 0;
      for (let p = 0; p < k; p++) s += A[i][p] * B[p][j];
      C[i][j] = s;
    }
  }
  return C;
}

// Gauss-Jordan inversion. Throws on singular.
function invert(A) {
  const n = A.length;
  // Augmented [A | I]
  const M = Array.from({ length: n }, (_, i) =>
    A[i].concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))
  );
  for (let i = 0; i < n; i++) {
    // Pivot — find largest |M[k][i]| for k >= i
    let maxRow = i, maxVal = Math.abs(M[i][i]);
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > maxVal) { maxRow = k; maxVal = Math.abs(M[k][i]); }
    }
    if (maxVal < 1e-12) throw new Error("Matrix is singular at column " + i);
    if (maxRow !== i) [M[i], M[maxRow]] = [M[maxRow], M[i]];
    const piv = M[i][i];
    for (let j = 0; j < 2 * n; j++) M[i][j] /= piv;
    for (let k = 0; k < n; k++) {
      if (k === i) continue;
      const factor = M[k][i];
      for (let j = 0; j < 2 * n; j++) M[k][j] -= factor * M[i][j];
    }
  }
  return M.map((row) => row.slice(n));
}

function identity(n, scale = 1) {
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? scale : 0))
  );
}

// ---------- STANDARDIZATION ----------

// Standardize columns of X to z-scores (mean 0, std 1). Returns standardized
// X and the per-column { mean, std } so callers can re-use them at inference.
function standardize(X) {
  if (X.length === 0) return { X: [], stats: [] };
  const m = X.length, k = X[0].length;
  const stats = [];
  for (let j = 0; j < k; j++) {
    let sum = 0, sumSq = 0;
    for (let i = 0; i < m; i++) { sum += X[i][j]; sumSq += X[i][j] * X[i][j]; }
    const mean = sum / m;
    const variance = sumSq / m - mean * mean;
    const std = Math.sqrt(Math.max(variance, 1e-12));
    stats.push({ mean, std });
  }
  const Xs = X.map((row) => row.map((v, j) => (v - stats[j].mean) / stats[j].std));
  return { X: Xs, stats };
}

// ---------- RIDGE REGRESSION ----------

// Closed-form ridge: w = (X^T X + λ I)^-1 X^T y
// Adds intercept column automatically (last position). lambda applies to
// non-intercept columns only.
//
// Returns { weights: [w_1, ..., w_k], intercept: b, stats: [...standardization stats per feature] }
// Predictions: y_hat = sum(w_j * (x_j - mean_j) / std_j) + b
//
// Inputs: X is m×k array of arrays; y is length-m array.
function ridgeFit(X, y, lambda = 1.0) {
  if (X.length === 0 || X.length !== y.length) {
    throw new Error("ridgeFit: X and y must be non-empty and same length");
  }
  const { X: Xs, stats } = standardize(X);
  const m = Xs.length, k = Xs[0].length;
  // Augment with intercept column (1s) at position k
  const Xa = Xs.map((row) => row.concat(1));
  const Xt = transpose(Xa);
  const XtX = multiply(Xt, Xa);
  // Add λI but with 0 for the intercept term (don't penalize bias)
  const reg = identity(k + 1, lambda);
  reg[k][k] = 0;
  for (let i = 0; i <= k; i++) for (let j = 0; j <= k; j++) XtX[i][j] += reg[i][j];
  const XtY = multiply(Xt, y.map((v) => [v]));
  const W = multiply(invert(XtX), XtY);
  const weights = W.slice(0, k).map((row) => row[0]);
  const intercept = W[k][0];
  // Residual stats
  let ssRes = 0, ssTot = 0;
  const yMean = y.reduce((a, b) => a + b, 0) / m;
  for (let i = 0; i < m; i++) {
    let pred = intercept;
    for (let j = 0; j < k; j++) pred += weights[j] * Xs[i][j];
    ssRes += (y[i] - pred) ** 2;
    ssTot += (y[i] - yMean) ** 2;
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { weights, intercept, stats, n: m, r2 };
}

// Apply a fitted ridge model to a single feature vector. featureValues is a
// raw array (NOT pre-standardized).
function ridgePredict(model, featureValues) {
  let pred = model.intercept;
  for (let j = 0; j < featureValues.length; j++) {
    const z = (featureValues[j] - model.stats[j].mean) / model.stats[j].std;
    pred += model.weights[j] * z;
  }
  return pred;
}

// ---------- LOGISTIC REGRESSION ----------

// Binary logistic regression via gradient descent with L2 regularization.
// Used for the global comp-distance feature weight learner: predict
// P(outcomeTier in {Hit, Star, Legend}) | features.
//
// X is m×k array of arrays (will be standardized internally). y is length-m
// array of {0, 1}.
function sigmoid(z) {
  if (z > 30) return 1;
  if (z < -30) return 0;
  return 1 / (1 + Math.exp(-z));
}

function logisticFit(X, y, opts = {}) {
  const { lambda = 1.0, lr = 0.05, iters = 800 } = opts;
  if (X.length === 0 || X.length !== y.length) {
    throw new Error("logisticFit: X and y must be non-empty and same length");
  }
  const { X: Xs, stats } = standardize(X);
  const m = Xs.length, k = Xs[0].length;
  const w = new Array(k).fill(0);
  let b = 0;
  for (let it = 0; it < iters; it++) {
    // forward
    const grads_w = new Array(k).fill(0);
    let grad_b = 0;
    let logLoss = 0;
    for (let i = 0; i < m; i++) {
      let z = b;
      for (let j = 0; j < k; j++) z += w[j] * Xs[i][j];
      const p = sigmoid(z);
      const err = p - y[i];
      for (let j = 0; j < k; j++) grads_w[j] += err * Xs[i][j];
      grad_b += err;
      logLoss += -(y[i] * Math.log(Math.max(p, 1e-12)) + (1 - y[i]) * Math.log(Math.max(1 - p, 1e-12)));
    }
    // L2 penalty on w only (not b)
    for (let j = 0; j < k; j++) {
      w[j] -= lr * (grads_w[j] / m + lambda * w[j] / m);
    }
    b -= lr * (grad_b / m);
    // Optionally: log convergence every 200 iters
    // if (it % 200 === 0) console.log(`  iter ${it}  loss=${(logLoss/m).toFixed(4)}`);
  }
  // Final accuracy
  let correct = 0, posCorrect = 0, posTotal = 0;
  for (let i = 0; i < m; i++) {
    let z = b;
    for (let j = 0; j < k; j++) z += w[j] * Xs[i][j];
    const pred = sigmoid(z) >= 0.5 ? 1 : 0;
    if (pred === y[i]) correct++;
    if (y[i] === 1) { posTotal++; if (pred === 1) posCorrect++; }
  }
  return {
    weights: w,
    intercept: b,
    stats,
    n: m,
    accuracy: correct / m,
    recallPositive: posTotal > 0 ? posCorrect / posTotal : 0,
  };
}

module.exports = {
  ridgeFit,
  ridgePredict,
  logisticFit,
  standardize,
  // Internals exposed for testing / reuse
  transpose,
  multiply,
  invert,
};
