interface PromotionRulesSectionLabelProps {
  children: React.ReactNode;
  suffix?: React.ReactNode;
}

export function PromotionRulesSectionLabel({
  children,
  suffix,
}: PromotionRulesSectionLabelProps) {
  return (
    <div className="flex items-center gap-1.5">
      <p className="text-sm font-bold leading-5 tracking-[0.4px] text-text-tertiary uppercase">
        {children}
      </p>
      {suffix}
    </div>
  );
}
