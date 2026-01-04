"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngine = void 0;
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
class RuleEngine {
    constructor(customPath) {
        this.rules = [];
        this.rulesPath = customPath || path.join(process.cwd(), '.trae/rules');
        this.loadRules();
    }
    loadRules() {
        try {
            if (fs.existsSync(this.rulesPath)) {
                this.scanDirectory(this.rulesPath);
                console.log(`Loaded ${this.rules.length} rules from ${this.rulesPath}`);
            }
            else {
                console.warn(`Rules path not found: ${this.rulesPath}`);
            }
        }
        catch (error) {
            console.error('Error loading rules:', error);
        }
    }
    scanDirectory(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                this.scanDirectory(fullPath);
            }
            else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
                this.parseRuleFile(fullPath);
            }
        }
    }
    parseRuleFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const doc = yaml.load(content);
            if (Array.isArray(doc)) {
                doc.forEach(rule => {
                    if (rule && rule.rule_id) {
                        this.rules.push(rule);
                    }
                });
            }
            else if (doc && doc.rule_id) {
                this.rules.push(doc);
            }
        }
        catch (e) {
            console.error(`Failed to parse rule file ${filePath}:`, e);
        }
    }
    async evaluate(action, context, taskRules = []) {
        console.log(`Evaluating action: ${JSON.stringify(action)} in context: ${JSON.stringify(context)}`);
        const allRules = [...taskRules, ...this.rules];
        const sortedRules = allRules.sort((a, b) => {
            const priorities = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
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
    matchesTrigger(rule, action, context) {
        if (!rule.trigger)
            return false;
        if (rule.trigger.context && context.type !== rule.trigger.context) {
            return false;
        }
        if (rule.trigger.action_type && action.type !== rule.trigger.action_type) {
            return false;
        }
        return true;
    }
    evalCondition(rule, action, context) {
        if (!rule.condition)
            return true;
        if (rule.condition.all) {
            return rule.condition.all.every(cond => this.evalSingleCondition(cond, action, context));
        }
        if (rule.condition.any) {
            return rule.condition.any.some(cond => this.evalSingleCondition(cond, action, context));
        }
        return this.evalSingleCondition(rule.condition, action, context);
    }
    evalSingleCondition(condition, action, context) {
        for (const [key, value] of Object.entries(condition)) {
            if (key === 'all' || key === 'any' || key === 'not')
                continue;
            let actualValue = action[key] !== undefined ? action[key] : context[key];
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
            if (Array.isArray(value) && key === 'check_elements') {
                const providedElements = action.elements || context.elements || [];
                return value.every(el => providedElements.includes(el));
            }
            if (actualValue === undefined) {
                return false;
            }
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                const valObj = value;
                if (valObj.gt !== undefined && !(parseFloat(actualValue) > valObj.gt))
                    return false;
                if (valObj.lt !== undefined && !(parseFloat(actualValue) < valObj.lt))
                    return false;
                if (valObj.gte !== undefined && !(parseFloat(actualValue) >= valObj.gte))
                    return false;
                if (valObj.lte !== undefined && !(parseFloat(actualValue) <= valObj.lte))
                    return false;
                if (valObj.eq !== undefined && actualValue !== valObj.eq)
                    return false;
                if (valObj.ne !== undefined && actualValue === valObj.ne)
                    return false;
                if (valObj.in !== undefined && Array.isArray(valObj.in) && !valObj.in.includes(actualValue))
                    return false;
                if (valObj.not_in !== undefined && Array.isArray(valObj.not_in) && valObj.not_in.includes(actualValue))
                    return false;
                continue;
            }
            if (typeof value === 'string' && value.startsWith('>')) {
                const threshold = parseFloat(value.slice(1).trim());
                if (parseFloat(actualValue) <= threshold)
                    return false;
            }
            else if (typeof value === 'string' && value.startsWith('<')) {
                const threshold = parseFloat(value.slice(1).trim());
                if (parseFloat(actualValue) >= threshold)
                    return false;
            }
            else if (actualValue !== value) {
                return false;
            }
        }
        return true;
    }
}
exports.RuleEngine = RuleEngine;
//# sourceMappingURL=runtime_enforcer.js.map