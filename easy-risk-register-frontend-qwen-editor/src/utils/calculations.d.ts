import { Risk } from '../types';
export declare const calculateRiskScore: (probability: number, impact: number) => number;
export declare const getRiskColor: (score: number) => string;
export declare const getRiskSeverity: (score: number) => string;
export declare const formatDate: (dateString: string) => string;
export declare const sortByRiskScore: (risks: Risk[], order?: "asc" | "desc") => Risk[];
//# sourceMappingURL=calculations.d.ts.map