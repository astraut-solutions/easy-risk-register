import React from 'react';
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    helpText?: string;
    options: Array<{
        value: string;
        label: string;
    }>;
}
declare const Select: React.FC<SelectProps>;
export default Select;
//# sourceMappingURL=Select.d.ts.map