# 📜 Agentic Rules for Lawyers Hub

This directory contains the rules and configurations for the AI Agents within the Lawyers Hub project.

## 📂 Structure

- `config/`: System-wide configurations for the rule engine.
- `core/`: Fundamental rules (Autonomy, Privacy, Security).
- `domains/`: Legal-specific rules (Corporate, Litigation, etc.).
- `validation/`: Schema definitions for rule files.
- `enforcement/`: Implementation logic for the rule engine.
- `documentation/`: Detailed guides and use cases.
- `examples/`: Sample rules for testing.

## 🚀 Getting Started

1. Define a new rule in the appropriate `domains/` or `core/` subdirectory.
2. Ensure it follows the YAML schema in `validation/syntax/`.
3. Use the `RuleEngine` to evaluate actions at runtime.

For more details, see the [Comprehensive Design Document](../../docs/rancangan komprehensif rules.md).
