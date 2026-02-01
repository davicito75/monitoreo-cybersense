export const SLA_THRESHOLDS = {
  green: Number(process.env.SLA_GREEN_PCT || 99),
  yellow: Number(process.env.SLA_YELLOW_PCT || 95),
};

export const DEFAULT_SLA_PERIODS = (process.env.SLA_PERIODS || '7,30,90').split(',').map((p) => Number(p));

export default {
  SLA_THRESHOLDS,
  DEFAULT_SLA_PERIODS,
};
