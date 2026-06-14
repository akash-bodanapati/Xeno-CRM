import type { Customer, FilterRule, FilterRules } from '../types/index';

/**
 * Evaluates a single filter rule against a customer record.
 */
function evaluateRule(customer: Customer, rule: FilterRule): boolean {
  const raw = customer[rule.field];
  const value = rule.value;

  switch (rule.operator) {
    case 'eq':
      return String(raw) === String(value);

    case 'neq':
      return String(raw) !== String(value);

    case 'gt':
      return Number(raw) > Number(value);

    case 'gte':
      return Number(raw) >= Number(value);

    case 'lt':
      return Number(raw) < Number(value);

    case 'lte':
      return Number(raw) <= Number(value);

    case 'contains':
      if (Array.isArray(raw)) {
        return raw.includes(value as string);
      }
      return String(raw).toLowerCase().includes(String(value).toLowerCase());

    case 'not_contains':
      if (Array.isArray(raw)) {
        return !raw.includes(value as string);
      }
      return !String(raw).toLowerCase().includes(String(value).toLowerCase());

    case 'in':
      return Array.isArray(value) && value.includes(String(raw));

    case 'not_in':
      return Array.isArray(value) && !value.includes(String(raw));

    case 'days_ago_gt': {
      if (!raw) return false;
      const date = new Date(raw as string);
      const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      let days = Number(value);
      if (isNaN(days)) {
        const valDate = new Date(value as string);
        if (!isNaN(valDate.getTime())) {
          days = (Date.now() - valDate.getTime()) / (1000 * 60 * 60 * 24);
        }
      }
      return diffDays > days;
    }

    case 'days_ago_lt': {
      if (!raw) return false;
      const date = new Date(raw as string);
      const diffDays = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      let days = Number(value);
      if (isNaN(days)) {
        const valDate = new Date(value as string);
        if (!isNaN(valDate.getTime())) {
          days = (Date.now() - valDate.getTime()) / (1000 * 60 * 60 * 24);
        }
      }
      return diffDays < days;
    }

    default:
      console.warn(`[segmentFilter] Unknown operator: ${rule.operator as string}`);
      return false;
  }
}

/**
 * Evaluates a full set of filter rules against a list of customers.
 * Returns only the customers that match all rules (AND) or any rule (OR).
 *
 * @param customers  - Full list of customer records to filter
 * @param filterRules - The segment's filter_rules JSON object
 */
export function applySegmentFilter(
  customers: Customer[],
  filterRules: FilterRules
): Customer[] {
  const { rules, logic = 'AND' } = filterRules;

  if (!rules || rules.length === 0) {
    return customers; // No rules → match everyone
  }

  return customers.filter((customer) => {
    if (logic === 'OR') {
      return rules.some((rule) => evaluateRule(customer, rule));
    }
    // Default: AND
    return rules.every((rule) => evaluateRule(customer, rule));
  });
}

