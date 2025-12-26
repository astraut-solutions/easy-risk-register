import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../design-system'
import { integrationCatalog } from '../../integrations/integrationCatalog'

const integrationStatusTone = (enabled: boolean) => (enabled ? 'success' : 'neutral')

export const IntegrationSettingsPanel = () => {
  const items = integrationCatalog()

  return (
    <div className="space-y-4 border-t border-border-faint pt-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text-high">Integrations</p>
          <p className="mt-1 text-xs text-text-low">
            Feature flags are off by default. When enabled, integration credentials must be stored server-side only.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {items.map((item) => (
          <Card key={item.id} className="h-full">
            <CardHeader className="flex-row items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="truncate">{item.name}</CardTitle>
                <CardDescription className="mt-1">
                  Flag: <span className="font-mono text-[0.85em]">{item.flagEnvVar}</span>
                </CardDescription>
              </div>
              <Badge tone={integrationStatusTone(item.enabled)} subtle>
                {item.enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3 text-sm text-text-low">
              {item.dataLeavesDevice ? (
                <p>
                  <span className="font-semibold text-text-high">Data leaves device:</span> {item.disclosure}
                </p>
              ) : (
                <p>
                  <span className="font-semibold text-text-high">Local-only:</span> This integration does not transmit
                  data off-device.
                </p>
              )}

              {item.docsPath ? (
                <p>
                  Docs: <span className="font-mono text-[0.85em]">{item.docsPath}</span>
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

