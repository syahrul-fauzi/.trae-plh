export type RulePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export interface Rule {
    rule_id: string;
    name: string;
    priority: RulePriority;
    domain?: string;
    description?: string;
    trigger: {
        context: string;
        action_type?: string;
        [key: string]: any;
    };
    condition: {
        [key: string]: any;
    };
    action: {
        type: 'BLOCK' | 'WARN' | 'MANDATORY_HUMAN_REVIEW' | 'ENFORCE_MASKING' | 'ENFORCE_DEADLINE' | 'VALIDATE_MANDATORY_CLAUSES' | string;
        message: string;
        [key: string]: any;
    };
    on_fail?: string;
}
export declare class RuleEngine {
    private rules;
    private rulesPath;
    constructor(customPath?: string);
    private loadRules;
    private scanDirectory;
    private parseRuleFile;
    evaluate(action: any, context: any, taskRules?: Rule[]): Promise<{
        allowed: boolean;
        message?: string;
        triggeredRule?: string;
    }>;
    private matchesTrigger;
    private evalCondition;
    private evalSingleCondition;
}
