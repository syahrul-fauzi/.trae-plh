import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

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

export class RuleEngine {
  private rules: Rule[] = [];
  private rulesPath: string;

  constructor(customPath?: string) {
    this.rulesPath = customPath || this.findRulesPath();
    this.loadRules();
  }

  private findRulesPath(): string {
    let currentDir = process.cwd();
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      const potentialPath = path.join(currentDir, '.trae/rules');
      if (fs.existsSync(potentialPath)) {
        return potentialPath;
      }
      currentDir = path.dirname(currentDir);
    }

    // Fallback to original behavior if not found
    return path.join(process.cwd(), '.trae/rules');
  }

  private loadRules() {
    try {
      if (fs.existsSync(this.rulesPath)) {
        this.scanDirectory(this.rulesPath);
        console.log(`Loaded ${this.rules.length} rules from ${this.rulesPath}`);
      } else {
        console.warn(`Rules path not found: ${this.rulesPath}`);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  }

  private scanDirectory(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        this.scanDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
        this.parseRuleFile(fullPath);
      }
    }
  }

  private parseRuleFile(filePath: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const doc = yaml.load(content) as any;
      
      if (Array.isArray(doc)) {
        doc.forEach(rule => {
          if (rule && rule.rule_id) {
            this.rules.push(rule as Rule);
          }
        });
      } else if (doc && doc.rule_id) {
        this.rules.push(doc as Rule);
      }
    } catch (e) {
      console.error(`Failed to parse rule file ${filePath}:`, e);
    }
  }

  async evaluate(action: any, context: any, taskRules: Rule[] = []): Promise<{ allowed: boolean; message?: string; triggeredRule?: string }> {
    console.log(`Evaluating action: ${JSON.stringify(action)} in context: ${JSON.stringify(context)}`);
    
    // Combine loaded rules with dynamic task rules
    // Task rules (Level 3) have highest priority if we want to override
    const allRules = [...taskRules, ...this.rules];
    
    // Sort rules by priority: CRITICAL (0) > HIGH (1) > MEDIUM (2) > LOW (3)
    const sortedRules = allRules.sort((a, b) => {
      const priorities: Record<string, number> = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
      return (priorities[a.priority] ?? 4) - (priorities[b.priority] ?? 4);
    });

    for (const rule of sortedRules) {
      if (this.matchesTrigger(rule, action, context)) {
        if (this.evalCondition(rule, action, context)) {
          return {
            allowed: rule.action.type !== 'BLOCK' && rule.action.type !== 'MANDATORY_HUMAN_REVIEW',
            message: rule.action.message,
            triggeredRule: rule.rule_id
          };
        }
      }
    }

    return { allowed: true };
  }

  private matchesTrigger(rule: Rule, action: any, context: any): boolean {
    if (!rule.trigger) return false;
    
    // Check context type
    if (rule.trigger.context && context.type !== rule.trigger.context) {
      return false;
    }

    // Check action_type if specified
    if (rule.trigger.action_type && action.type !== rule.trigger.action_type) {
      return false;
    }
    
    return true;
  }

  private evalCondition(rule: Rule, action: any, context: any): boolean {
    if (!rule.condition) return true;

    // Support for root-level logical operators
    if (rule.condition.all) {
      return (rule.condition.all as any[]).every(cond => this.evalSingleCondition(cond, action, context));
    }
    if (rule.condition.any) {
      return (rule.condition.any as any[]).some(cond => this.evalSingleCondition(cond, action, context));
    }

    return this.evalSingleCondition(rule.condition, action, context);
  }

  private evalSingleCondition(condition: Record<string, any>, action: any, context: any): boolean {
    for (const [key, value] of Object.entries(condition)) {
      // Skip logical operator keys if nested
      if (key === 'all' || key === 'any' || key === 'not') continue;

      let actualValue = action[key] !== undefined ? action[key] : context[key];
      
      // Handle nested properties (e.g., "user.role")
      if (key.includes('.')) {
        const parts = key.split('.');
        let obj = action;
        for (const part of parts) {
          obj = obj?.[part];
        }
        if (obj === undefined) {
          obj = context;
          for (const part of parts) {
            obj = obj?.[part];
          }
        }
        actualValue = obj;
      }

      // Handle array contains check (e.g., check_elements)
      if (Array.isArray(value) && key === 'check_elements') {
        const providedElements = action.elements || context.elements || [];
        return value.every(el => providedElements.includes(el));
      }

      if (actualValue === undefined) {
        return false;
      }

      // Handle comparison objects: { gt: 0.5, lt: 1.0, eq: 0.8 }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const valObj = value as any;
        if (valObj.gt !== undefined && !(parseFloat(actualValue) > valObj.gt)) return false;
        if (valObj.lt !== undefined && !(parseFloat(actualValue) < valObj.lt)) return false;
        if (valObj.gte !== undefined && !(parseFloat(actualValue) >= valObj.gte)) return false;
        if (valObj.lte !== undefined && !(parseFloat(actualValue) <= valObj.lte)) return false;
        if (valObj.eq !== undefined && actualValue !== valObj.eq) return false;
        if (valObj.ne !== undefined && actualValue === valObj.ne) return false;
        if (valObj.in !== undefined && Array.isArray(valObj.in) && !valObj.in.includes(actualValue)) return false;
        if (valObj.not_in !== undefined && Array.isArray(valObj.not_in) && valObj.not_in.includes(actualValue)) return false;
        continue;
      }

      // Handle string shortcuts: "> 0.5", "< 0.8"
      if (typeof value === 'string' && value.startsWith('>')) {
        const threshold = parseFloat(value.slice(1).trim());
        if (parseFloat(actualValue) <= threshold) return false;
      } else if (typeof value === 'string' && value.startsWith('<')) {
        const threshold = parseFloat(value.slice(1).trim());
        if (parseFloat(actualValue) >= threshold) return false;
      } else if (actualValue !== value) {
        return false;
      }
    }
    return true;
  }
}
