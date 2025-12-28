# Financial Risk Quantification Features

The Easy Risk Register includes comprehensive financial risk quantification capabilities to help organizations understand and manage the financial implications of their risks. These features enable businesses to make data-driven decisions about risk mitigation investments and prioritize risks based on their potential financial impact.

## Features Overview

### 1. Estimated Financial Impact (EFI) Calculator

The EFI calculator allows users to estimate the potential financial impact of risks using range-based estimates. Users can input lower and upper bounds for potential financial losses, along with an expected mean value, to understand the range of possible financial outcomes.

**Key capabilities:**
- Range-based financial impact estimation
- Lower bound, upper bound, and expected mean calculations
- Multiple currency support (USD, EUR, GBP, JPY)
- Visual representation of impact ranges

### 2. Financial Risk Trend Visualization

The financial risk trend visualization provides a time-based view of potential financial impacts, mitigation investments, and net risk exposure. This chart helps organizations understand how their financial risk profile changes over time as they invest in risk mitigation measures.

**Key capabilities:**
- Time-series visualization of financial risk trends
- Three data series: Potential financial impact, mitigation investments, net exposure
- Monthly trend analysis over a 12-month period
- Summary statistics for current financial risk position

### 3. Return on Security Investment (ROSI) Calculator

The ROSI calculator enables organizations to evaluate the financial return on their security investments. By comparing the annual loss expected without controls to the annual loss expected with controls, and factoring in the cost of the controls, organizations can make informed decisions about which security measures provide the best financial return.

**Key capabilities:**
- Risk reduction percentage calculation (ROS)
- Return on investment percentage calculation (ROI)
- Annual Loss Expected (ALE) calculations with and without controls
- Financial justification for security investments

### 4. Interactive Cost Modeling

The interactive cost modeling feature allows organizations to build detailed financial models of their risk mitigation investments. Users can add multiple cost items categorized by type (security controls, compliance, training, etc.) to understand their total investment in risk management.

**Key capabilities:**
- Add/remove cost items with descriptions and categories
- Multiple category support (security, compliance, training, tools, personnel, consulting, insurance, recovery)
- Real-time calculation of total cost
- Cost breakdown visualization by category
- Export functionality for financial planning

### 5. Range-Based Impact Visualization

The range-based impact visualization provides a clear graphical representation of potential financial impacts with lower/upper bounds and expected mean. This visualization helps stakeholders quickly understand the potential financial range of risks.

**Key capabilities:**
- Gradient visualization of impact ranges
- Clear markers for lower bound, upper bound, and expected mean
- Numerical display of all three values
- Risk analysis summary with variance calculations
- Multiple currency support

## Integration with Risk Management Process

The financial risk quantification features are designed to integrate seamlessly with the existing risk management workflow:

1. **Risk Identification**: When creating or reviewing risks, users can access financial impact calculators
2. **Risk Analysis**: Financial metrics provide additional context for risk prioritization
3. **Risk Evaluation**: Financial impact helps determine if risks are acceptable or require treatment
4. **Risk Treatment**: Cost modeling and ROSI calculations help prioritize mitigation investments
5. **Monitoring & Review**: Financial trends help track the effectiveness of risk treatment investments

## Best Practices for Financial Risk Quantification

### Estimating Financial Impact
- Base estimates on historical data where available
- Consider both direct and indirect costs
- Include regulatory fines and legal costs
- Account for business interruption and reputation damage
- Consider the time value of money for long-term impacts

### Using ROSI Calculations
- Focus on risks with the highest potential financial impact
- Consider the probability of occurrence in addition to potential impact
- Account for the full lifecycle cost of security controls
- Consider the value of risk reduction beyond direct financial benefits

### Cost Modeling
- Include ongoing operational costs, not just initial investments
- Consider staff time and training requirements
- Account for maintenance and update costs
- Factor in the cost of risk acceptance (insurance, reserves)

## Technical Implementation

The financial risk quantification features are implemented as React components following the existing design system and architecture patterns:

- **Location**: `src/components/financial/`
- **Design System**: Components use the same styling and UI patterns as existing components
- **Data Integration**: Components can work independently or integrate with risk data
- **Testing**: Each component includes comprehensive unit tests
- **Accessibility**: All components meet WCAG 2.1 AA standards

## User Interface

All financial risk quantification components follow the existing UI/UX patterns of Easy Risk Register:

- Consistent panel styling with `rr-panel` class
- Responsive grid layouts that work on all device sizes
- Clear form labels and validation feedback
- Accessible color schemes and contrast ratios
- Intuitive interaction patterns consistent with other components

## Security Considerations

- Calculations happen client-side; results are stored with the risk record (currently via the risk `data` JSON in Supabase)
- No external services or APIs are used for financial calculations
- Input validation prevents injection attacks in financial data fields
