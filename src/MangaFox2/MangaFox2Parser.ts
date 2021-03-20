import { Chapter, ChapterDetails, Tag, HomeSection, LanguageCode, Manga, MangaStatus, MangaTile, MangaUpdates, PagedResults, SearchRequest, TagSection } from "paperback-extensions-common";

export const parseMangaDetails = ($: CheerioStatic, mangaId: string): Manga => {
  const tagRegexp = new RegExp('\\/directory\\/(.*)\\/');
  const image = $('.detail-info-cover-img', $('.detail-info-cover')).attr('src') ?? '';
  const details = $('.detail-info');
  const title = $('span.detail-info-right-title-font', details).text().trim();
  const rawStatus = $('.detail-info-right-title-tip', details).text().trim();
  const rating = $('span.item-score', details).text().trim().replace(',', '.');
  const author = $('p.detail-info-right-say a', details).text().trim();
  let hentai = false;
  const description = $('p.fullcontent').text().trim();
  const titles = [];
  titles.push(title!);
  //Still gotta fix those tags as well tag advanced search :C
  const tagSections: TagSection[] = [createTagSection({ id: '0', label: 'genres', tags: [] }),
  createTagSection({ id: '1', label: 'format', tags: [] })];

  $('a', '.detail-info-right-tag-list').each((i, tag) => {
    const id = $(tag).attr('href')!.match(tagRegexp)![1];
    const label = $(tag).text().trim();
    if (["Adult", "Smut", "Mature"].includes(label)) hentai = true;
    tagSections[0].tags.push(createTag({ id: id, label: label! }));
  });

  let status = MangaStatus.ONGOING;
  switch (rawStatus) {
    case 'Ongoing':
      status = MangaStatus.ONGOING;
      break;
    case 'Completed':
      status = MangaStatus.COMPLETED;
      break;
    default:
      status = MangaStatus.ONGOING;
      break;
  }

  return createManga({
    id: mangaId,
    titles: titles,
    image,
    rating: Number(rating),
    status: status,
    author: author!,
    tags: tagSections,
    desc: description!,
    hentai: hentai
  })
}

export const parseChapters = ($: CheerioStatic, mangaId: string): Chapter[] => {
  const chapters: Chapter[] = [];
  const rawChapters = $('div#chapterlist ul li').children('a').toArray().reverse();
  const chapterIdRegex = new RegExp('\\/manga\\/[a-zA-Z0-9_]*\\/(.*)\\/');
  const chapterNumberRegex = new RegExp('c([0-9.]+)');
  const volumeRegex = new RegExp('Vol.(\\d+)');

  for (let element of rawChapters) {
    const title = $('p.title3', element).html() ?? '';
    const date = parseDate($('p.title2', element).html() ?? '');
    const chapterId = element.attribs['href'].match(chapterIdRegex)![1];
    const chapterNumber = Number("0" + chapterId.match(chapterNumberRegex)![1]);
    const volMatch = title.match(volumeRegex)
    const volume = volMatch != null && volMatch.length > 0 ? Number(volMatch[1]) : undefined;

    chapters.push(createChapter({
      id: chapterId,
      mangaId,
      name: title,
      langCode: LanguageCode.ENGLISH,
      chapNum: chapterNumber,
      time: date,
      volume: volume
    }))
  }
  return chapters;
}

export const parseChapterDetails = ($: CheerioStatic, mangaId: string, chapterId: string): ChapterDetails => {
  const pages: string[] = [];
  const rawPages = $('div#viewer').children('img').toArray();

  for (let page of rawPages) {
    let url = page.attribs['data-original'];
    if (url.startsWith("//")) {
      url = "https:" + url;
    }
    pages.push(url);
  }
  let chapterDetails = createChapterDetails({
    id: chapterId,
    mangaId: mangaId,
    pages: pages,
    longStrip: false
  });

  return chapterDetails;
}

export interface UpdatedManga {
  ids: string[];
  loadMore: boolean;
}

export const parseUpdatedManga = ($: CheerioStatic, time: Date, ids: string[]): UpdatedManga => {
  const updatedManga: string[] = [];
  let loadMore = true;
  const idRegExp = new RegExp('\\/manga\\/(.*)\\/');

  const panel = $(".manga-list-4.mt15");
  for (let obj of $('.manga-list-4-list > li', panel).toArray()) {
    const id = $('a', obj).first().attr('href')!.match(idRegExp)![1];
    const dateContext = $('.manga-list-4-item-subtitle', $(obj));
    const date = $('span', dateContext).text();
    const mangaDate = parseDate(date);
    if (mangaDate > time)
      if (ids.includes(id))
        updatedManga.push(id);
      else loadMore = false;
  }

  return {
    ids: updatedManga,
    loadMore,
  }
}

export const parseHomeSections = ($: CheerioStatic, sections: HomeSection[], sectionCallback: (section: HomeSection) => void): void => {
  for (const section of sections) sectionCallback(section)
  const hotManga: MangaTile[] = [];
  const beingReadManga: MangaTile[] = [];
  const newManga: MangaTile[] = [];
  const latestManga: MangaTile[] = [];

  const idRegExp = new RegExp('\\/manga\\/(.*)\\/');
  const firstSection = $('div.main-large').first();
  const hotMangas = $('.manga-list-1', firstSection).first();
  const beingReadMangas = hotMangas.next();
  const newMangas = $('div.line-list');
  const latestMangas = $('ul.manga-list-4-list');

  for (let manga of $('li', hotMangas).toArray()) {
    const id = $('a', manga).first().attr('href')!.match(idRegExp)![1];
    const image = $('img', manga).first().attr('src');
    const title: string = $('.manga-list-1-item-title', manga).text().trim();
    const subtitle: string = $('.manga-list-1-item-subtitle', manga).text().trim();

    hotManga.push(createMangaTile({
      id: id,
      image: image!,
      title: createIconText({ text: title }),
      subtitleText: createIconText({ text: subtitle }),
    }));
  }

  for (let manga of $('li', beingReadMangas).toArray()) {
    const id = $('a', manga).first().attr('href')!.match(idRegExp)![1];
    const image = $('img', manga).first().attr('src');
    const title: string = $('.manga-list-1-item-title', manga).text().trim();
    const subtitle: string = $('.manga-list-1-item-subtitle', manga).text().trim();

    beingReadManga.push(createMangaTile({
      id: id,
      image: image!,
      title: createIconText({ text: title }),
      subtitleText: createIconText({ text: subtitle }),
    }));
  }

  for (let manga of $('li', newMangas).toArray()) {
    const id = $('a', manga).first().attr('href')!.match(idRegExp)![1];
    const image = $('img', manga).first().attr('src');
    const title: string = $('.manga-list-1-item-title', manga).text().trim();
    const subtitle: string = $('.manga-list-1-item-subtitle', manga).text().trim();

    newManga.push(createMangaTile({
      id: id,
      image: image!,
      title: createIconText({ text: title }),
      subtitleText: createIconText({ text: subtitle }),
    }));
  }

  for (let manga of $('.manga-list-4-list > li', latestMangas).toArray()) {
    const id = $('a', manga).first().attr('href')!.match(idRegExp)![1];
    const image = $('img', manga).first().attr('src');
    const title: string = $('.manga-list-4-item-title', manga).text().trim();
    const subtitle: string = $('.manga-list-4-item-subtitle', manga).text().trim();

    latestManga.push(createMangaTile({
      id: id,
      image: image!,
      title: createIconText({ text: title }),
      subtitleText: createIconText({ text: subtitle }),
    }));
  }

  sections[0].items = hotManga;
  sections[1].items = beingReadManga;
  sections[2].items = newManga;
  sections[3].items = latestManga;
  for (const section of sections) sectionCallback(section)
}

export const generateSearch = (query: SearchRequest): string => {
  const genres = (query.includeGenre ?? []).join(',');
  const excluded = (query.excludeGenre ?? []).join(',,');
  const type = (query.includeFormat ?? [])[0];
  let status = "";
  switch (query.status) {
    case 0:
      status = '2';
      break;
    case 1:
      status = '1';
      break;
    default:
      status = '0'
  }

  let search: string = `name=${encodeURI(query.title ?? '')}&`;
  search += `author=${encodeURI(query.author || '')}&`;
  search += `artist=${encodeURI(query.artist || '')}&`;
  search += `type=${type}&genres=${genres}&nogenres=${excluded}&st=${status}`;
  return search
}

export const parseSearch = ($: CheerioStatic): MangaTile[] => {
  const mangas: MangaTile[] = [];
  const idRegExp = new RegExp('\\/manga\\/(.*)\\/');
  $('ul.manga-list-4-list').children('li').each((index, manga) => {
    const id = $('a', manga).first().attr('href')!.match(idRegExp)![1];
    const image = $('img', manga).first().attr('src');
    const title = $('p.manga-list-4-item-title a', manga).first().text().trim();
    const tips = $('p.manga-list-4-item-tip', manga).toArray();
    const author = $('a', tips[0]).text().trim();
    const lastUpdate = $('a', tips[1]).text().trim();
    const shortDesc = $(tips[2]).text().trim();

    mangas.push(createMangaTile({
      id,
      image: image!,
      title: createIconText({ text: title ?? '' }),
      subtitleText: createIconText({ text: author ?? '' }),
      primaryText: createIconText({ text: shortDesc ?? '' }),
      secondaryText: createIconText({ text: lastUpdate ?? '' }),
    }));
  });
  return mangas;
}

export const parseViewMore = ($: CheerioStatic, homepageSectionId: string): MangaTile[] => {
  const manga: MangaTile[] = [];
  const idRegExp = new RegExp('\\/manga\\/(.*)\\/');
  if (homepageSectionId === "latest_updates") {
    const panel = $(".manga-list-4.mt15");
    for (let p of $('.manga-list-4-list > li', panel).toArray()) {
      const id = $('a', p).first().attr('href')!.match(idRegExp)![1];
      const image = $('img', p).first().attr('src') ?? "";
      const title: string = $('.manga-list-4-item-title', p).text().trim();
      const subtitle: string = $('.manga-list-4-item-subtitle', p).text().trim();

      manga.push(createMangaTile({
        id,
        image,
        title: createIconText({ text: title }),
        subtitleText: createIconText({ text: subtitle }),
      }));
    }
    return manga;
  } else {
    const panel = $('.manga-list-1')
    for (let p of $('li', panel).toArray()) {
      const id = $('a', p).first().attr('href')!.match(idRegExp)![1];
      const image = $('img', p).first().attr('src') ?? '';
      const title: string = $('.manga-list-1-item-title', p).text().trim();
      const subtitle: string = $('.manga-list-1-item-subtitle', p).text().trim();

      manga.push(createMangaTile({
        id,
        image,
        title: createIconText({ text: title }),
        subtitleText: createIconText({ text: subtitle }),
      }));
    }
    return manga;
  }
}

const parseDate = (date: string): Date => {
  let dateObj: Date;
  if (date.includes("Today")) {
    dateObj = new Date();
  } else if (date.includes("Yesterday")) {
    dateObj = new Date();
    dateObj.setDate(dateObj.getDate() - 1);
  } else if (date.includes("hour")) {
    let hour = Number.parseInt(date.match("[0-9]*")![0]);
    if (hour == null) {
      hour = 0;
    }
    dateObj = new Date();
    dateObj.setHours(dateObj.getHours() - hour);
  } else if (date.includes("minute")) {
    let minute = Number.parseInt(date.match("[0-9]*")![0]);
    if (minute == null) {
      minute = 0;
    }
    dateObj = new Date();
    dateObj.setMinutes(dateObj.getMinutes() - minute);
  } else if (date.includes("second")) {
    let second = Number.parseInt(date.match("[0-9]*")![0]);
    if (second == null) {
      second = 0;
    }
    dateObj = new Date();
    dateObj.setSeconds(dateObj.getSeconds() - second);
  } else {
    dateObj = new Date(date);
  }
  return dateObj;
}
