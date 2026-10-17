import { Source, SourceInfo, ContentRating, SourceIntents, MangaProviding, ChapterProviding, SearchResultsProviding } from '@paperback/types'
const API = 'https://api.mangadex.org'
const SITE = 'https://mangadex.org'
const titleOf = (attributes: any): string => attributes?.title?.en || Object.values(attributes?.title || {})[0] as string || 'Untitled'
const descriptionOf = (attributes: any): string => attributes?.description?.en || Object.values(attributes?.description || {})[0] as string || ''
const coverOf = (entry: any): string => {
  const cover = (entry.relationships || []).find((r: any) => r.type === 'cover_art')
  return cover?.attributes?.fileName ? `https://uploads.mangadex.org/covers/${entry.id}/${cover.attributes.fileName}.256.jpg` : ''
}
export const MangaDexInfo: SourceInfo = {
  version: '0.1.0', name: 'MangaDex Personal', icon: 'icon.png', author: 'Personal repo',
  description: 'Independent MangaDex source for Paperback 0.8',
  websiteBaseURL: SITE, contentRating: ContentRating.MATURE,
  intents: SourceIntents.MANGA_CHAPTERS
}
export class MangaDex extends Source implements MangaProviding, ChapterProviding, SearchResultsProviding {
  requestManager = App.createRequestManager({ requestsPerSecond: 3, requestTimeout: 20000 })
  async getJSON(path: string): Promise<any> {
    const response = await this.requestManager.schedule({ url: `${API}${path}`, method: 'GET' }, 1)
    if (response.status >= 400) throw new Error(`MangaDex API returned ${response.status}`)
    return JSON.parse(response.data)
  }
  async getMangaDetails(mangaId: string): Promise<any> {
    const { data } = await this.getJSON(`/manga/${mangaId}?includes[]=cover_art`)
    return createManga({ id: data.id, titles: [titleOf(data.attributes)], image: coverOf(data), desc: descriptionOf(data.attributes), status: data.attributes.status, author: '', artist: '' })
  }
  async getChapters(mangaId: string): Promise<any[]> {
    const chapters: any[] = []
    for (let offset = 0; offset < 1000; offset += 100) {
      const params = `manga=${encodeURIComponent(mangaId)}&translatedLanguage[]=en&limit=100&offset=${offset}&order[chapter]=desc&includes[]=scanlation_group`
      const page = await this.getJSON(`/chapter?${params}`)
      for (const ch of page.data || []) {
        chapters.push(createChapter({ id: ch.id, mangaId, chapNum: ch.attributes.chapter || '0', name: ch.attributes.title || '', langCode: 'en', time: new Date(ch.attributes.publishAt || ch.attributes.createdAt) }))
      }
      if (offset + 100 >= page.total) break
    }
    return chapters
  }
  async getChapterDetails(mangaId: string, chapterId: string): Promise<any> {
    const { baseUrl, chapter } = await this.getJSON(`/at-home/server/${chapterId}`)
    return createChapterDetails({ id: chapterId, mangaId, pages: chapter.data.map((file: string) => `${baseUrl}/data/${chapter.hash}/${file}`), longStrip: false })
  }
  async getSearchResults(query: any, metadata: any): Promise<any> {
    const offset = metadata?.offset || 0
    const title = encodeURIComponent(query.title || '')
    const page = await this.getJSON(`/manga?title=${title}&limit=30&offset=${offset}&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica`)
    return createPagedResults({ results: page.data.map((m: any) => createMangaTile({ id: m.id, image: coverOf(m), title: createIconText({ text: titleOf(m.attributes) }) })), metadata: offset + 30 < page.total ? { offset: offset + 30 } : undefined })
  }
}