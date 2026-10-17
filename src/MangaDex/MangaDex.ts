import { Source, SourceInfo, ContentRating, SourceIntents, SearchRequest } from '@paperback/types'

const API = 'https://api.mangadex.org'
const SITE = 'https://mangadex.org'
const englishText = (value: any): string => value?.en || value?.['ja-ro'] || String(Object.values(value || {})[0] || '')
const mangaCover = (manga: any): string => {
    const cover = (manga.relationships || []).find((item: any) => item.type === 'cover_art')
    const file = cover?.attributes?.fileName
    return file ? `https://uploads.mangadex.org/covers/${manga.id}/${file}.256.jpg` : ''
}
export const MangaDexInfo: SourceInfo = {
    version: '0.1.1',
    name: 'MangaDex Personal',
    icon: 'icon.svg',
    author: 'Independent',
    description: 'Independent MangaDex API source for Paperback 0.8',
    websiteBaseURL: SITE,
    contentRating: ContentRating.MATURE,
    intents: SourceIntents.MANGA_CHAPTERS
}
export class MangaDex extends Source {
    requestManager = App.createRequestManager({ requestsPerSecond: 3, requestTimeout: 20000 })
    async getJSON(path: string): Promise<any> {
        const request = App.createRequest({ url: API + path, method: 'GET' })
        const response = await this.requestManager.schedule(request, 1)
        if (response.status >= 400) throw new Error('MangaDex API returned ' + response.status)
        return typeof response.data === 'string' ? JSON.parse(response.data) : response.data
    }
    async getMangaDetails(mangaId: string): Promise<any> {
        const response = await this.getJSON('/manga/' + encodeURIComponent(mangaId) + '?includes[]=cover_art')
        const manga = response.data
        const attributes = manga.attributes
        return App.createSourceManga({
            id: mangaId,
            mangaInfo: App.createMangaInfo({
                titles: [englishText(attributes.title)],
                image: mangaCover(manga),
                desc: englishText(attributes.description),
                status: attributes.status || 'unknown',
                author: '',
                artist: ''
            })
        })
    }
    async getChapters(mangaId: string): Promise<any[]> {
        const chapters: any[] = []
        for (let offset = 0; offset < 1000; offset += 100) {
            const query = '?manga=' + encodeURIComponent(mangaId) + '&translatedLanguage[]=en&limit=100&offset=' + offset + '&order[chapter]=desc'
            const data = await this.getJSON('/chapter' + query)
            for (const chapter of data.data || []) {
                const attr = chapter.attributes
                chapters.push(App.createChapter({
                    id: chapter.id,
                    chapNum: parseFloat(attr.chapter || '0') || 0,
                    name: attr.title || '',
                    langCode: 'en',
                    time: new Date(attr.publishAt || attr.createdAt)
                }))
            }
            if (offset + 100 >= data.total) break
        }
        return chapters
    }
    async getChapterDetails(mangaId: string, chapterId: string): Promise<any> {
        const result = await this.getJSON('/at-home/server/' + encodeURIComponent(chapterId))
        const chapter = result.chapter
        return App.createChapterDetails({
            id: chapterId,
            mangaId: mangaId,
            pages: chapter.data.map((file: string) => result.baseUrl + '/data/' + chapter.hash + '/' + file)
        })
    }
    async getSearchResults(query: SearchRequest, metadata: any): Promise<any> {
        const offset = metadata?.offset || 0
        const params = '?title=' + encodeURIComponent(query.title || '') + '&limit=30&offset=' + offset +
            '&includes[]=cover_art&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica'
        const page = await this.getJSON('/manga' + params)
        return App.createPagedResults({
            results: (page.data || []).map((manga: any) => App.createMangaTile({
                id: manga.id,
                image: mangaCover(manga),
                title: App.createIconText({ text: englishText(manga.attributes.title) })
            })),
            metadata: offset + 30 < page.total ? { offset: offset + 30 } : undefined
        })
    }
}
