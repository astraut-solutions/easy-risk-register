import React from 'react';
import { Risk, RiskFormData } from '../../types';
interface RiskFormProps {
    onSubmit: (data: RiskFormData) => void;
    onCancel: () => void;
    initialData?: Risk;
    mode?: 'create' | 'edit';
}
declare const RiskForm: React.FC<RiskFormProps>;
export default RiskForm;
//# sourceMappingURL=RiskForm.d.ts.map