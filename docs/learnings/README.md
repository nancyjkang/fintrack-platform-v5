# Development Learnings Repository

**Purpose**: Capture technical insights, lessons learned, and best practices discovered during development for future reference and knowledge sharing.

---

## 📁 **Structure**

### **By Category**
- **[database/](./database/)** - Database design, indexing, query optimization
- **[performance/](./performance/)** - Performance optimization techniques
- **[architecture/](./architecture/)** - System design decisions and patterns
- **[frontend/](./frontend/)** - UI/UX patterns and React best practices
- **[api/](./api/)** - API design and backend patterns
- **[deployment/](./deployment/)** - DevOps, CI/CD, and deployment learnings

### **By Format**
- **Quick Notes**: `YYYY-MM-DD-topic.md` - Immediate capture during development
- **Deep Dives**: `topic-analysis.md` - Comprehensive analysis of complex topics
- **Decision Records**: `ADR-NNNN-decision-title.md` - Architecture Decision Records

---

## 🏷️ **Tagging System**

Use frontmatter tags for easy filtering and searching:

```markdown
---
tags: [database, indexing, performance]
date: 2025-09-17
complexity: intermediate
impact: high
---
```

### **Tag Categories**
- **Technology**: `database`, `react`, `typescript`, `prisma`, `postgresql`
- **Domain**: `performance`, `security`, `ux`, `api-design`, `testing`
- **Complexity**: `beginner`, `intermediate`, `advanced`
- **Impact**: `low`, `medium`, `high`, `critical`

---

## 🚀 **Quick Capture Workflow**

### **During Development** (30 seconds)
```bash
# Quick note capture
echo "---
tags: [database, indexing]
date: $(date +%Y-%m-%d)
---

# Index Redundancy with Unique Constraints

Key insight: Unique constraints can serve as indexes for query optimization.

- Unique constraint on (a,b,c,d) covers queries filtering on (a), (a,b), (a,b,c)
- Separate indexes on prefixes are redundant
- Always check leftmost prefix coverage before adding indexes

Impact: Reduced 2 redundant indexes, improved write performance
" > docs/learnings/database/$(date +%Y-%m-%d)-index-redundancy.md
```

### **Weekly Review** (5 minutes)
- Review week's learnings
- Tag and categorize properly
- Cross-reference related learnings
- Update team knowledge base

---

## 🔍 **Search & Discovery**

### **Find by Tags**
```bash
# Find all database learnings
grep -r "tags:.*database" docs/learnings/

# Find high-impact learnings
grep -r "impact: high" docs/learnings/
```

### **Generate Learning Reports**
```bash
# Monthly learning summary
find docs/learnings -name "2025-09-*.md" | xargs grep -l "impact: high"
```

---

## 📚 **Learning Templates**

### **Quick Insight Template**
```markdown
---
tags: [category1, category2]
date: YYYY-MM-DD
complexity: beginner|intermediate|advanced
impact: low|medium|high
---

# Title

## Context
What were you working on?

## Insight
What did you learn?

## Impact
How does this help?

## Related
- Link to code/PR
- Related learnings
```

### **Decision Record Template**
```markdown
---
tags: [architecture, decision]
date: YYYY-MM-DD
status: proposed|accepted|rejected|superseded
---

# ADR-NNNN: Decision Title

## Context
What's the situation?

## Decision
What did you decide?

## Consequences
What are the trade-offs?
```

---

## 🎯 **Benefits**

- **Low Overhead**: 30-second capture during development
- **Searchable**: Tags and grep-friendly structure
- **Shareable**: Markdown format, easy to copy/reference
- **Contextual**: Captured when insights are fresh
- **Cumulative**: Builds institutional knowledge over time

---

**Start small, capture consistently, review regularly. Your future self (and team) will thank you!**
