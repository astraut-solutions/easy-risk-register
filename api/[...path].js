const audit = require('../server/api/audit')
const categories = require('../server/api/categories')
const compliance = require('../server/api/compliance')
const dataProtection = require('../server/api/data-protection')
const encrypt = require('../server/api/encrypt')
const playbookTemplates = require('../server/api/playbook-templates')
const reminders = require('../server/api/reminders')
const settings = require('../server/api/settings')
const users = require('../server/api/users')

const dashboardSummary = require('../server/api/dashboard/summary')

const exportPrivacyIncidentPdf = require('../server/api/exports/privacy-incident.pdf')
const exportRisksCsv = require('../server/api/exports/risks.csv')
const exportRisksPdf = require('../server/api/exports/risks.pdf')

const importRisksCsv = require('../server/api/imports/risks.csv')

const maturityAssessmentsIndex = require('../server/api/maturity-assessments/index')
const maturityAssessmentsLatest = require('../server/api/maturity-assessments/latest')
const maturityAssessmentsById = require('../server/api/maturity-assessments/[id]')

const risksIndex = require('../server/api/risks/index')
const risksById = require('../server/api/risks/[id]')
const riskActivity = require('../server/api/risks/[id]/activity')
const riskChecklists = require('../server/api/risks/[id]/checklists')
const riskChecklistItem = require('../server/api/risks/[id]/checklists/items/[itemId]')
const riskPlaybooks = require('../server/api/risks/[id]/playbooks')
const riskPlaybookById = require('../server/api/risks/[id]/playbooks/[playbookId]')
const riskPlaybookSteps = require('../server/api/risks/[id]/playbooks/steps')
const riskPlaybookStepById = require('../server/api/risks/[id]/playbooks/steps/[stepId]')
const riskTrends = require('../server/api/risks/[id]/trends')

const timeseriesQuery = require('../server/api/timeseries/query')
const timeseriesWrite = require('../server/api/timeseries/write')

const trendsIndex = require('../server/api/trends/index')

function getPathname(req) {
  const host = req.headers?.host || 'localhost'
  const url = new URL(req.url || '/', `http://${host}`)
  return url.pathname || '/'
}

const ROUTES = [
  { re: /^\/api\/audit\/?$/, handler: audit },
  { re: /^\/api\/categories\/?$/, handler: categories },
  { re: /^\/api\/compliance\/?$/, handler: compliance },
  { re: /^\/api\/data-protection\/?$/, handler: dataProtection },
  { re: /^\/api\/encrypt\/?$/, handler: encrypt },
  { re: /^\/api\/playbook-templates\/?$/, handler: playbookTemplates },
  { re: /^\/api\/reminders\/?$/, handler: reminders },
  { re: /^\/api\/settings\/?$/, handler: settings },
  { re: /^\/api\/users\/?$/, handler: users },

  { re: /^\/api\/dashboard\/summary\/?$/, handler: dashboardSummary },

  { re: /^\/api\/exports\/privacy-incident\.pdf\/?$/, handler: exportPrivacyIncidentPdf },
  { re: /^\/api\/exports\/risks\.csv\/?$/, handler: exportRisksCsv },
  { re: /^\/api\/exports\/risks\.pdf\/?$/, handler: exportRisksPdf },

  { re: /^\/api\/imports\/risks\.csv\/?$/, handler: importRisksCsv },

  { re: /^\/api\/maturity-assessments\/?$/, handler: maturityAssessmentsIndex },
  { re: /^\/api\/maturity-assessments\/latest\/?$/, handler: maturityAssessmentsLatest },
  { re: /^\/api\/maturity-assessments\/[^/]+\/?$/, handler: maturityAssessmentsById },

  { re: /^\/api\/risks\/?$/, handler: risksIndex },
  { re: /^\/api\/risks\/[^/]+\/?$/, handler: risksById },
  { re: /^\/api\/risks\/[^/]+\/activity\/?$/, handler: riskActivity },
  { re: /^\/api\/risks\/[^/]+\/checklists\/?$/, handler: riskChecklists },
  { re: /^\/api\/risks\/[^/]+\/checklists\/items\/[^/]+\/?$/, handler: riskChecklistItem },
  { re: /^\/api\/risks\/[^/]+\/playbooks\/?$/, handler: riskPlaybooks },
  { re: /^\/api\/risks\/[^/]+\/playbooks\/steps\/?$/, handler: riskPlaybookSteps },
  { re: /^\/api\/risks\/[^/]+\/playbooks\/steps\/[^/]+\/?$/, handler: riskPlaybookStepById },
  { re: /^\/api\/risks\/[^/]+\/playbooks\/[^/]+\/?$/, handler: riskPlaybookById },
  { re: /^\/api\/risks\/[^/]+\/trends\/?$/, handler: riskTrends },

  { re: /^\/api\/timeseries\/query\/?$/, handler: timeseriesQuery },
  { re: /^\/api\/timeseries\/write\/?$/, handler: timeseriesWrite },

  { re: /^\/api\/trends\/?$/, handler: trendsIndex },
]

module.exports = async function handler(req, res) {
  const pathname = getPathname(req)
  for (const route of ROUTES) {
    if (route.re.test(pathname)) {
      return route.handler(req, res)
    }
  }

  return res.status(404).json({ error: 'Not found' })
}

