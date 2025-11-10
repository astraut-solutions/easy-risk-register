import React from 'react';
import { Risk } from '../../types';
interface RiskCardProps {
    risk: Risk;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
}
declare const RiskCard: React.FC<RiskCardProps>;
export default RiskCard;
//# sourceMappingURL=RiskCard.d.ts.map