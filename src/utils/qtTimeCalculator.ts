/* The formula to calculate quantum travel time is derived from
https://gitlab.com/Erecco/a-study-on-quantum-travel-time (calc_traveltime_real.m) */

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function qtTime(d: number, vMax: number, a1: number, a2: number): number {
  const accelSum = a1 + a2;
  const accelSumSq = accelSum ** 2;
  const reachThreshold = (4 * vMax ** 2 * (2 * a1 + a2)) / (3 * accelSumSq);

  // Eq. 16: sections reach vmax and stay at cruise speed for the remaining distance.
  if (d >= reachThreshold) {
    return (4 * vMax) / accelSum + d / vMax - (4 * vMax * (2 * a1 + a2)) / (3 * accelSumSq);
  }

  const delta = a2 - a1;
  const z = (3 * delta ** 2 * accelSumSq * d) / (8 * vMax ** 2 * a1 ** 3) - 1;
  const prefactor = (4 * a1 * vMax) / (a2 ** 2 - a1 ** 2);

  if (z > 1) {
    // Eq. 23: over-speed solution expressed with hyperbolic cosine / logarithm.
    const radicand = Math.max(z * z - 1, 0);
    const sqrtTerm = Math.sqrt(radicand);
    const logTerm = -Math.log(z - sqrtTerm);
    return prefactor * (2 * Math.cosh(logTerm / 3) - 1);
  }

  // Eq. 22: drive never reaches vmax, use cosine-based solution.
  const safeZ = clamp(z, -1, 1);
  return prefactor * (2 * Math.cos((1 / 3) * Math.acos(safeZ)) - 1);
}

export default qtTime;
