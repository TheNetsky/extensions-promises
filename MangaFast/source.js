(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Source = void 0;
class Source {
    constructor(cheerio) {
        // <-----------        OPTIONAL METHODS        -----------> //
        /**
         * Manages the ratelimits and the number of requests that can be done per second
         * This is also used to fetch pages when a chapter is downloading
         */
        this.requestManager = createRequestManager({
            requestsPerSecond: 2.5,
            requestTimeout: 5000
        });
        this.cheerio = cheerio;
    }
    /**
     * (OPTIONAL METHOD) This function is called when ANY request is made by the Paperback Application out to the internet.
     * By modifying the parameter and returning it, the user can inject any additional headers, cookies, or anything else
     * a source may need to load correctly.
     * The most common use of this function is to add headers to image requests, since you cannot directly access these requests through
     * the source implementation itself.
     *
     * NOTE: This does **NOT** influence any requests defined in the source implementation. This function will only influence requests
     * which happen behind the scenes and are not defined in your source.
     */
    globalRequestHeaders() { return {}; }
    globalRequestCookies() { return []; }
    /**
     * A stateful source may require user input.
     * By supplying this value to the Source, the app will render your form to the user
     * in the application settings.
     */
    getAppStatefulForm() { return createUserForm({ formElements: [] }); }
    /**
     * When the Advanced Search is rendered to the user, this skeleton defines what
     * fields which will show up to the user, and returned back to the source
     * when the request is made.
     */
    getAdvancedSearchForm() { return createUserForm({ formElements: [] }); }
    /**
     * (OPTIONAL METHOD) Given a manga ID, return a URL which Safari can open in a browser to display.
     * @param mangaId
     */
    getMangaShareUrl(mangaId) { return null; }
    /**
     * If a source is secured by Cloudflare, this method should be filled out.
     * By returning a request to the website, this source will attempt to create a session
     * so that the source can load correctly.
     * Usually the {@link Request} url can simply be the base URL to the source.
     */
    getCloudflareBypassRequest() { return null; }
    /**
     * (OPTIONAL METHOD) A function which communicates with a given source, and returns a list of all possible tags which the source supports.
     * These tags are generic and depend on the source. They could be genres such as 'Isekai, Action, Drama', or they can be
     * listings such as 'Completed, Ongoing'
     * These tags must be tags which can be used in the {@link searchRequest} function to augment the searching capability of the application
     */
    getTags() { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) A function which should scan through the latest updates section of a website, and report back with a list of IDs which have been
     * updated BEFORE the supplied timeframe.
     * This function may have to scan through multiple pages in order to discover the full list of updated manga.
     * Because of this, each batch of IDs should be returned with the mangaUpdatesFoundCallback. The IDs which have been reported for
     * one page, should not be reported again on another page, unless the relevent ID has been detected again. You do not want to persist
     * this internal list between {@link Request} calls
     * @param mangaUpdatesFoundCallback A callback which is used to report a list of manga IDs back to the API
     * @param time This function should find all manga which has been updated between the current time, and this parameter's reported time.
     *             After this time has been passed, the system should stop parsing and return
     */
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) A function which should readonly allf the available homepage sections for a given source, and return a {@link HomeSection} object.
     * The sectionCallback is to be used for each given section on the website. This may include a 'Latest Updates' section, or a 'Hot Manga' section.
     * It is recommended that before anything else in your source, you first use this sectionCallback and send it {@link HomeSection} objects
     * which are blank, and have not had any requests done on them just yet. This way, you provide the App with the sections to render on screen,
     * which then will be populated with each additional sectionCallback method called. This is optional, but recommended.
     * @param sectionCallback A callback which is run for each independant HomeSection.
     */
    getHomePageSections(sectionCallback) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) This function will take a given homepageSectionId and metadata value, and with this information, should return
     * all of the manga tiles supplied for the given state of parameters. Most commonly, the metadata value will contain some sort of page information,
     * and this request will target the given page. (Incrementing the page in the response so that the next call will return relevent data)
     * @param homepageSectionId The given ID to the homepage defined in {@link getHomePageSections} which this method is to readonly moreata about
     * @param metadata This is a metadata parameter which is filled our in the {@link getHomePageSections}'s return
     * function. Afterwards, if the metadata value returned in the {@link PagedResults} has been modified, the modified version
     * will be supplied to this function instead of the origional {@link getHomePageSections}'s version.
     * This is useful for keeping track of which page a user is on, pagnating to other pages as ViewMore is called multiple times.
     */
    getViewMoreItems(homepageSectionId, metadata) { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) This function is to return the entire library of a manga website, page by page.
     * If there is an additional page which needs to be called, the {@link PagedResults} value should have it's metadata filled out
     * with information needed to continue pulling information from this website.
     * Note that if the metadata value of {@link PagedResults} is undefined, this method will not continue to run when the user
     * attempts to readonly morenformation
     * @param metadata Identifying information as to what the source needs to call in order to readonly theext batch of data
     * of the directory. Usually this is a page counter.
     */
    getWebsiteMangaDirectory(metadata) { return Promise.resolve(null); }
    // <-----------        PROTECTED METHODS        -----------> //
    // Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
    convertTime(timeAgo) {
        var _a;
        let time;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
        if (timeAgo.includes('minutes')) {
            time = new Date(Date.now() - trimmed * 60000);
        }
        else if (timeAgo.includes('hours')) {
            time = new Date(Date.now() - trimmed * 3600000);
        }
        else if (timeAgo.includes('days')) {
            time = new Date(Date.now() - trimmed * 86400000);
        }
        else if (timeAgo.includes('year') || timeAgo.includes('years')) {
            time = new Date(Date.now() - trimmed * 31556952000);
        }
        else {
            time = new Date(Date.now());
        }
        return time;
    }
    /**
     * When a function requires a POST body, it always should be defined as a JsonObject
     * and then passed through this function to ensure that it's encoded properly.
     * @param obj
     */
    urlEncodeObject(obj) {
        let ret = {};
        for (const entry of Object.entries(obj)) {
            ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
        }
        return ret;
    }
}
exports.Source = Source;

},{}],3:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);

},{"./Source":2}],4:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./APIWrapper"), exports);

},{"./APIWrapper":1,"./base":3,"./models":25}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],6:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],7:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],8:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],11:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],12:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],13:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],14:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],15:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],16:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],17:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],18:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],19:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],20:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],22:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],23:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],24:[function(require,module,exports){
arguments[4][5][0].apply(exports,arguments)
},{"dup":5}],25:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./TrackObject"), exports);
__exportStar(require("./OAuth"), exports);
__exportStar(require("./UserForm"), exports);

},{"./Chapter":5,"./ChapterDetails":6,"./Constants":7,"./HomeSection":8,"./Languages":9,"./Manga":10,"./MangaTile":11,"./MangaUpdate":12,"./OAuth":13,"./PagedResults":14,"./RequestHeaders":15,"./RequestManager":16,"./RequestObject":17,"./ResponseObject":18,"./SearchRequest":19,"./SourceInfo":20,"./SourceTag":21,"./TagSection":22,"./TrackObject":23,"./UserForm":24}],26:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaFast = exports.MangaFastInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const MangaFastParser_1 = require("./MangaFastParser");
const MF_DOMAIN = 'https://mangafast.net';
const method = 'GET';
exports.MangaFastInfo = {
    version: '1.0.0',
    name: 'MangaFast',
    icon: 'icon.png',
    author: 'Netsky',
    authorWebsite: 'https://github.com/TheNetsky',
    description: 'Extension that pulls manga from MangaFast.',
    hentaiSource: false,
    websiteBaseURL: MF_DOMAIN,
    sourceTags: []
};
class MangaFast extends paperback_extensions_common_1.Source {
    getMangaShareUrl(mangaId) { return `${MF_DOMAIN}/manga/${mangaId}`; }
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${MF_DOMAIN}/read/`,
                method,
                param: mangaId,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            return MangaFastParser_1.parseMangaDetails($, mangaId);
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${MF_DOMAIN}/read/`,
                method,
                param: mangaId,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            return MangaFastParser_1.parseChapters($, mangaId);
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            let metadata = { 'mangaId': mangaId, 'chapterId': chapterId, 'nextPage': false, 'page': 1 };
            const request = createRequestObject({
                url: `${MF_DOMAIN}/${chapterId}`,
                method: "GET",
                metadata: metadata,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            return MangaFastParser_1.parseChapterDetails($, mangaId, chapterId);
        });
    }
    /* No real place to the updates besides the 12 tiles on the homescreen.
      async filterUpdatedManga(mangaUpdatesFoundCallback: (updates: MangaUpdates) => void, time: Date, ids: string[]): Promise<void> {
        let page = 1;
        let updatedManga: UpdatedManga = {
          ids: [],
          loadMore: true
        };
    
        while (updatedManga.loadMore) {
          const request = createRequestObject({
            url: `${MF_DOMAIN}/manga?sortBy=-last_chapter_at&page=${page}`,
            method,
          })
    
          const response = await this.requestManager.schedule(request, 1)
          const $ = this.cheerio.load(response.data)
    
          updatedManga = parseUpdatedManga($, time, ids)
          if (updatedManga.ids.length > 0) {
            mangaUpdatesFoundCallback(createMangaUpdates({
              ids: updatedManga.ids
            }));
          }
        }
    
      }*/
    getHomePageSections(sectionCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            let section1 = createHomeSection({ id: 'new_manga', title: 'New Manga' });
            let section2 = createHomeSection({ id: 'top_manga', title: 'Top Manga' });
            let section3 = createHomeSection({ id: 'latest_manga_update', title: 'Latest Manga Update' });
            let section4 = createHomeSection({ id: 'top_weekly', title: 'Top Weekly Comic' });
            let section5 = createHomeSection({ id: 'latest_manhua_update', title: 'Latest Manhua Update' });
            let section6 = createHomeSection({ id: 'popular_manga', title: 'Popular Manga' });
            const sections = [section1, section2, section3, section4, section5, section6];
            for (const section of sections) {
                sectionCallback(section);
            }
            ;
            for (let section of sections) {
                let sectionID = "";
                switch (section.id) {
                    case "latest_manga_update":
                        sectionID = "/?section=latest-update";
                        break;
                    case "new_manga":
                        sectionID = "/?section=new-manga";
                        break;
                    case "latest_manhua_update":
                        sectionID = "/?section=latest-manhua";
                        break;
                    case "popular_manga":
                        sectionID = "/?section=popular-type";
                        break;
                    default:
                        break;
                }
                const request = createRequestObject({
                    url: MF_DOMAIN,
                    method,
                    param: sectionID
                });
                const response = yield this.requestManager.schedule(request, 1);
                let $ = this.cheerio.load(response.data);
                section.items = MangaFastParser_1.parseHomeSections($, section);
                sectionCallback(section);
            }
            ;
        });
    }
    searchRequest(query, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            const search = MangaFastParser_1.generateSearch(query);
            const request = createRequestObject({
                url: `${MF_DOMAIN}/page/${page}/?s=`,
                method,
                param: `${search}`
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            const manga = MangaFastParser_1.parseSearch($);
            metadata = !MangaFastParser_1.isLastPage($) ? { page: page + 1 } : undefined;
            return createPagedResults({
                results: manga,
                metadata
            });
        });
    }
    getTags() {
        return __awaiter(this, void 0, void 0, function* () {
            const request = createRequestObject({
                url: `${MF_DOMAIN}/genre/action`,
                method,
            });
            const response = yield this.requestManager.schedule(request, 1);
            const $ = this.cheerio.load(response.data);
            return MangaFastParser_1.parseTags($);
        });
    }
}
exports.MangaFast = MangaFast;

},{"./MangaFastParser":27,"paperback-extensions-common":4}],27:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isLastPage = exports.parseTags = exports.parseSearch = exports.generateSearch = exports.parseHomeSections = exports.parseChapterDetails = exports.parseChapters = exports.parseMangaDetails = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
exports.parseMangaDetails = ($, mangaId) => {
    var _a, _b, _c, _d;
    const titles = [];
    titles.push($("td:contains(Comic Title)").next().text().trim()); //Main English title
    const image = (_a = $("img.shadow", "div.text-center.ims").attr('src')) !== null && _a !== void 0 ? _a : "";
    const description = $("p.desc").text().trim();
    let hentai = false;
    const arrayTags = [];
    for (const tag of $("a", $("td:contains(Genre)").next()).toArray()) {
        const label = $(tag).text().trim();
        const id = encodeURI((_d = (_c = (_b = $(tag).attr("href")) === null || _b === void 0 ? void 0 : _b.trim()) === null || _c === void 0 ? void 0 : _c.split("/genre/")[1].replace("/", "")) !== null && _d !== void 0 ? _d : "");
        if (["ADULT", "SMUT", "MATURE"].includes(label.toUpperCase()))
            hentai = true;
        arrayTags.push({ id: id, label: label });
    }
    let tagSections = [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
    const author = $("td:contains(Author)").next().text().trim();
    let rawStatus = $("td:contains(Status)").next().text().trim();
    let status = paperback_extensions_common_1.MangaStatus.ONGOING;
    switch (rawStatus.toUpperCase()) {
        case 'ONGOING':
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
        case 'COMPLETED':
            status = paperback_extensions_common_1.MangaStatus.COMPLETED;
            break;
        default:
            status = paperback_extensions_common_1.MangaStatus.ONGOING;
            break;
    }
    return createManga({
        id: mangaId,
        titles: titles,
        image,
        rating: 0,
        status: status,
        author: author,
        tags: tagSections,
        desc: description,
        //hentai: hentai
        hentai: false //MangaDex down
    });
};
exports.parseChapters = ($, mangaId) => {
    var _a, _b;
    const chapters = [];
    for (const c of $("a", "div.chapter-link-w").toArray()) {
        const title = $("span.left", c).text().trim();
        const id = String((_a = $(c).attr('href')) === null || _a === void 0 ? void 0 : _a.split("mangafast.net/")[1]);
        const date = new Date($("span.right", c).text().trim());
        const chapterNumber = Number((_b = title.split("Chapter")[1].trim()) !== null && _b !== void 0 ? _b : 0);
        if (String(date) == "Invalid Date")
            continue;
        chapters.push(createChapter({
            id: id,
            mangaId,
            name: title,
            langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
            chapNum: chapterNumber,
            time: date,
        }));
    }
    return chapters;
};
exports.parseChapterDetails = ($, mangaId, chapterId) => {
    var _a, _b;
    const pages = [];
    for (const p of $("img", "div.content-comic.py-4").toArray()) {
        let image = (_a = $(p).attr("src")) !== null && _a !== void 0 ? _a : "";
        if (!image)
            image = (_b = $(p).attr("data-src")) !== null && _b !== void 0 ? _b : "";
        if (image.includes("adsense"))
            continue;
        pages.push(image);
    }
    let chapterDetails = createChapterDetails({
        id: chapterId,
        mangaId: mangaId,
        pages: pages,
        longStrip: false
    });
    return chapterDetails;
};
/* No real place to the updates besides the 12 tiles on the homescreen.
export const parseUpdatedManga = ($: CheerioStatic, time: Date, ids: string[]): UpdatedManga => {
  const updatedManga: string[] = [];
  let loadMore = true;

  for (let obj of $("article[class*=flex-item]", $("div.flex-container.row")).toArray()) {
    const id = $("a", obj).attr('href')?.split("manga/")[1] ?? "";
    const dateContext = $('.list-group-item ', $(obj));
    const date = $('span', dateContext).text();
    const mangaDate = new Date;
    if (mangaDate > time) {
      if (ids.includes(id)) {
        updatedManga.push(id);
      } else {
        loadMore = false;
      }
    }
  }
  return {
    ids: updatedManga,
    loadMore,
  }
}
*/
exports.parseHomeSections = ($, section) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const mangaTiles = [];
    switch (section.id) {
        //Top Manga 
        case "top_manga":
            for (const manga of $("div.ls23", "div.ls123").toArray()) {
                const id = (_a = $("a", manga).attr('href')) === null || _a === void 0 ? void 0 : _a.split("read/")[1].replace("/", "");
                const title = $("a", manga).attr('title');
                const image = (_c = (_b = $("img", manga).attr('src')) === null || _b === void 0 ? void 0 : _b.split("?")[0]) !== null && _c !== void 0 ? _c : "";
                const lastChapter = $("span.ls23s", manga).text().trim();
                const updateTime = $($("span.ls23t", manga)[1]).text().trim().replace(" in", "");
                if (!id || !title)
                    continue;
                mangaTiles.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: lastChapter }),
                    secondaryText: createIconText({ text: updateTime }),
                }));
            }
            break;
        //Latest Manga Update 
        case "latest_manga_update":
            for (const manga of $("div.ls4,last-updates-content", "div.ls4w").toArray()) {
                const id = (_d = $("a", manga).attr('href')) === null || _d === void 0 ? void 0 : _d.split("read/")[1].replace("/", "");
                const title = $("a", manga).attr('title');
                const image = (_f = (_e = $("img", manga).attr('src')) === null || _e === void 0 ? void 0 : _e.split("?")[0]) !== null && _f !== void 0 ? _f : "";
                const lastChapter = $("a.ls24", manga).text().trim();
                const updateTime = $("span.ls4s", manga).text().trim().split("  ")[1];
                if (!id || !title)
                    continue;
                mangaTiles.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: lastChapter }),
                    secondaryText: createIconText({ text: updateTime }),
                }));
            }
            break;
        //New Manga 
        case "new_manga":
            for (const manga of $("div.ls4,last-updates-content", "div.ls4w").toArray()) {
                const id = (_g = $("a", manga).attr('href')) === null || _g === void 0 ? void 0 : _g.split("read/")[1].replace("/", "");
                const title = $("a", manga).attr('title');
                const image = (_j = (_h = $("img", manga).attr('src')) === null || _h === void 0 ? void 0 : _h.split("?")[0]) !== null && _j !== void 0 ? _j : "";
                const lastChapter = $("a.ls24", manga).text().trim();
                const updateTime = $("span.ls4s", manga).text().trim().replace(" • ", " ");
                if (!id || !title)
                    continue;
                mangaTiles.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: lastChapter }),
                    secondaryText: createIconText({ text: updateTime }),
                }));
            }
            break;
        //Latest Manhua Update
        case "latest_manhua_update":
            for (const manga of $("div.ls4,last-updates-content", "div.ls4w").toArray()) {
                const id = (_k = $("a", manga).attr('href')) === null || _k === void 0 ? void 0 : _k.split("read/")[1].replace("/", "");
                const title = $("a", manga).attr('title');
                const image = (_m = (_l = $("img", manga).attr('src')) === null || _l === void 0 ? void 0 : _l.split("?")[0]) !== null && _m !== void 0 ? _m : "";
                const lastChapter = $("a.ls24", manga).text().trim();
                const updateTime = $("span.ls4s", manga).text().trim().split("  ")[1];
                if (!id || !title)
                    continue;
                mangaTiles.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: lastChapter }),
                    secondaryText: createIconText({ text: updateTime }),
                }));
            }
            break;
        //Popular Manga
        case "popular_manga":
            for (const manga of $("div.ls2", "div.ls12").toArray()) {
                const id = (_o = $("a", manga).attr('href')) === null || _o === void 0 ? void 0 : _o.split("read/")[1].replace("/", "");
                const title = $("a", manga).attr('title');
                const image = (_q = (_p = $("img", manga).attr('src')) === null || _p === void 0 ? void 0 : _p.split("?")[0]) !== null && _q !== void 0 ? _q : "";
                const lastChapter = $("a.ls2l", manga).text().trim();
                const updateTime = $("span.ls2t", manga).text().trim().split("  ")[1];
                if (!id || !title)
                    continue;
                mangaTiles.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: lastChapter }),
                    secondaryText: createIconText({ text: updateTime }),
                }));
            }
            break;
        //Top Weekly
        case "top_weekly":
            for (const manga of $("div.ls8", "div.ls8w").toArray()) {
                const id = (_r = $("a", manga).attr('href')) === null || _r === void 0 ? void 0 : _r.split("read/")[1].replace("/", "");
                const title = $("a", manga).attr('title');
                const image = (_t = (_s = $("img", manga).attr('src')) === null || _s === void 0 ? void 0 : _s.split("?")[0]) !== null && _t !== void 0 ? _t : "";
                const lastChapter = $("div.ls84", manga).text().trim();
                const updateTime = $("span", manga).text().trim();
                if (!id || !title)
                    continue;
                mangaTiles.push(createMangaTile({
                    id: id,
                    image: image,
                    title: createIconText({ text: title }),
                    subtitleText: createIconText({ text: lastChapter }),
                    secondaryText: createIconText({ text: updateTime }),
                }));
            }
            break;
        default:
            break;
    }
    return mangaTiles;
};
exports.generateSearch = (query) => {
    var _a;
    let search = (_a = query.title) !== null && _a !== void 0 ? _a : "";
    return encodeURI(search);
};
exports.parseSearch = ($) => {
    var _a, _b, _c, _d, _e;
    const mangas = [];
    const collectedIds = [];
    for (let obj of $(".list-content .ls4").toArray()) {
        const id = (_b = (_a = $("a", obj).attr('href')) === null || _a === void 0 ? void 0 : _a.split("read/")[1].replace("/", "")) !== null && _b !== void 0 ? _b : "";
        const title = $("a", obj).attr('title');
        const image = (_d = (_c = $("img", obj).attr('src')) === null || _c === void 0 ? void 0 : _c.split("?")[0]) !== null && _d !== void 0 ? _d : "";
        const subtitle = (_e = "Chapter " + $("a.ls24", obj).text().trim().replace(/^\D+/g, "")) !== null && _e !== void 0 ? _e : 0;
        if (!collectedIds.includes(id) && id && title) {
            mangas.push(createMangaTile({
                id,
                image: image,
                title: createIconText({ text: title }),
                subtitleText: createIconText({ text: subtitle }),
            }));
            collectedIds.push(id);
        }
    }
    return mangas;
};
exports.parseTags = ($) => {
    var _a, _b;
    const arrayTags = [];
    for (const tag of $("li", "ul.genre").toArray()) {
        const label = $("a", tag).text().trim();
        const id = (_b = (_a = $("a", tag).attr('href')) === null || _a === void 0 ? void 0 : _a.split("genre/")[1]) !== null && _b !== void 0 ? _b : "";
        arrayTags.push({ id: id, label: label });
    }
    const tagSections = [createTagSection({ id: '0', label: 'genres', tags: arrayTags.map(x => createTag(x)) })];
    return tagSections;
};
exports.isLastPage = ($) => {
    let isLast = false;
    if ($("a:contains(Next »)", "div.p-3.btn-w").length)
        isLast = true;
    return isLast;
};

},{"paperback-extensions-common":4}]},{},[26])(26)
});
