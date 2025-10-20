import { JsonjsdbBuilder } from './JsonjsdbBuilder'

export async function initJsonjsdbBuilder(
  paths: {
    dbPath: string
    dbSourcePath?: string
    previewPath?: string
    mdPath?: string
    configPath?: string
  },
  options: {
    isDevelopment?: boolean
    compact?: boolean
  } = {},
) {
  const builder = new JsonjsdbBuilder({
    configPath: paths.configPath,
    compact: options.compact,
  })

  await builder.setOutputDb(paths.dbPath)

  const updatePromises: Promise<void>[] = []

  if (paths.dbSourcePath) {
    updatePromises.push(builder.updateDb(paths.dbSourcePath))
  }

  if (paths.previewPath) {
    updatePromises.push(builder.updatePreview('preview', paths.previewPath))
  }

  if (paths.mdPath) {
    updatePromises.push(builder.updateMdDir('md-doc', paths.mdPath))
  }

  await Promise.all(updatePromises)

  if (options.isDevelopment && paths.dbSourcePath) {
    builder.watchDb(paths.dbSourcePath)
  }

  return builder
}
