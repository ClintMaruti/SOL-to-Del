/**
 * Catalog rate plan routes under services (service-level rate plans).
 * @see GET /api/catalog/services/{serviceId}/rate-plans
 * @see POST /api/catalog/services/{serviceId}/rate-plans
 */
export function serviceRatePlansUrl(serviceId: string): string {
  return `/catalog/services/${serviceId}/rate-plans`;
}

/**
 * Update summary fields.
 * @see PUT /api/catalog/services/rate-plans/{ratePlanId}
 */
export function catalogServiceRatePlanByIdUrl(ratePlanId: string): string {
  return `/catalog/services/rate-plans/${ratePlanId}`;
}

/**
 * @see PATCH /api/catalog/services/rate-plans/{ratePlanId}/activate
 */
export function catalogServiceRatePlanActivateUrl(ratePlanId: string): string {
  return `/catalog/services/rate-plans/${ratePlanId}/activate`;
}

/**
 * @see PATCH /api/catalog/services/rate-plans/{ratePlanId}/deactivate
 */
export function catalogServiceRatePlanDeactivateUrl(
  ratePlanId: string
): string {
  return `/catalog/services/rate-plans/${ratePlanId}/deactivate`;
}

/**
 * List and create rate rules under a rate plan.
 * @see GET /api/catalog/services/rate-plans/{ratePlanId}/rate-rules
 * @see POST /api/catalog/services/rate-plans/{ratePlanId}/rate-rules
 */
export function ratePlanRateRulesUrl(ratePlanId: string): string {
  return `/catalog/services/rate-plans/${ratePlanId}/rate-rules`;
}

/**
 * @see DELETE /api/catalog/rate-rules/{id}
 */
export function catalogRateRulesUrl(): string {
  return "/catalog/rate-rules";
}

/**
 * @see GET /api/catalog/rate-rules/residencies
 */
export function catalogRateRuleResidenciesUrl(): string {
  return `${catalogRateRulesUrl()}/residencies`;
}

/**
 * @see PUT /api/catalog/rate-rules/{rateRuleId}
 * @see DELETE /api/catalog/rate-rules/{id}
 */
export function catalogRateRuleUrl(rateRuleId: string): string {
  return `${catalogRateRulesUrl()}/${rateRuleId}`;
}
