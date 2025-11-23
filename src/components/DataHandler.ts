import { cmdType } from '../commands/Index'
import { Context } from 'koishi'
import Html from "./HtmlImage";
import Downloader from "./Downloader";
import { pathToFileURL } from 'url'
import { resolve } from 'path'



export class RequestHandler {
    static buildFields(type: cmdType, field: string): string {
        if (type === cmdType.Event) {
            if (field === cmdType.VN) return 'id,rating,released,alttitle,title,image{url}';
            else if (field === cmdType.Character) return 'id,name,original,birthday,image{url},vns{alttitle,title,id,rating}';
            else return '';
        } else {
            if (field === cmdType.VN) return 'id,average,rating,released,length,platforms,aliases,developers{id,original,name},titles{lang,title,official},image{url},alttitle,title';
            else if (field === cmdType.Character) return 'id,name,aliases,sex,birthday,waist,hips,bust,blood_type,weight,height,cup,original,description,image{url},vns{alttitle,title,id}';
            else if (field === cmdType.Producer) return 'id,name,original,aliases,lang,type,description';
            else return '';
        }
    }
}


export class ResponseHandler {
    private static failurePic = ''
    private static langDic = {
        'ja': '日文',
        'en': '英文',
        'zh-Hans': '简中',
        'zh-Hant': '繁中'
    }
    private static genderDic = {
        'm': '男性',
        'f': '女性',
        'b': '双性',
        'n': '无性'
    }
    private static typeDic = {
        'co': '公司',
        'in': '个人',
        'ng': '业余团体'
    }

    static async handleVN(ctx: Context, res: Array<object>, image: boolean = false): Promise<string> {
        const imgFile = await Downloader.downloadToPath(ctx, res["image"]["url"]);
        const img = image ? imgFile : `<img src="${pathToFileURL(resolve(imgFile)).href ?? this.failurePic}"/>`;
        const average = `平均分：${res["average"]}`;
        const rating = `贝叶斯评分：${res["rating"]}`;
        const released = res["released"] ? `发布日期：${res["released"]}` : '';
        const length = res["length"] ? `剧情长度：${res["length"]}` : '';
        const id = `VNDB唯一id：${res["id"]}`;
        const platforms = `支持平台：${res["platforms"].join("、")}`;
        const aliases = `别名：${res["aliases"].join("、")}`;


        const developers: Array<string> = [];
        res["developers"].forEach(e => {
            developers.push(`${e["original"] ?? e["name"]}（${e["id"]}）`);
        })
        const dev = `出版社（id）：${developers.join('\n')}`;

        let ja: string, en: string, fz: string, jz: string;
        res["titles"].forEach(v => {
            if (v["lang"] === "ja") ja = `日文标题（${v["official"] ? "官方" : "非官方"}）：${v["title"]}`;
            else if (v["lang"] === "en") en = `英文标题（${v["official"] ? "官方" : "非官方"}）：${v["title"]}`;
            else if (v["lang"] === "zh-Hans") jz = `简中标题（${v["official"] ? "官方" : "非官方"}）：${v["title"]}`;
            else if (v["lang"] === "zh-Hant") fz = `繁中标题（${v["official"] ? "官方" : "非官方"}）：${v["title"]}`;
        })
        if (!image) {
            const title = [ja, en, jz, fz].filter(e => e != undefined).join('\n');
            return [img, id, title, aliases, dev, released, average, rating, length, platforms]
                .filter(item => item !== '')
                .join('\n');
        } else {
            const title = [ja, en, jz, fz].filter(e => e != undefined).join('<br>');
            const html = new Html();

            return html.createContent({
                'res': {
                    'img': img,
                    'content': [id, title, aliases, dev, released, average, rating, length, platforms]
                        .filter(item => item !== '')
                }
            })
        }
    }

    static async handleCharacter(ctx: Context, res: Array<object>, extra: Array<string>, image: boolean = false): Promise<string> {
        const imgFile = await Downloader.downloadToPath(ctx, res["image"]["url"]);
        const img = image ? imgFile : `<img src="${pathToFileURL(resolve(imgFile)) ?? this.failurePic}"/>`;
        const name = `姓名：${res["original"] ?? res["name"]}`;
        const id = `VNDB唯一id：${res["id"]}`;
        const aliases = res["aliases"].length !== 0 ? `别名：${res["aliases"].join("、")}` : '';
        const birthday = res["birthday"] ? `生日：${res["birthday"][0]}月${res["birthday"][1]}日` : '';

        const vnsList: Array<string> = [];
        res["vns"].forEach(e => {
            vnsList.push(`『${e["alttitle"] ?? e["title"]}』（${e["id"]}）`);
        })
        const vns = `出场作品（id）：${vnsList.join('、')}`;

        let blood: string, age: string, wh: string, gender_o, gender_i, bwh: string, cup: string, description: string;

        blood = extra.includes('血型') && res["blood_type"] ? `血型：${res["blood_type"]}` : '';
        age = extra.includes('年龄') && res["age"] ? `年龄：${res["age"]}` : '';
        wh = extra.includes('身高/体重') && (res["weight"] || res["height"])
            ? `身高/体重（cm/kg）：${res["height"] ?? '??'}/${res["weight"] ?? '??'}`
            : '';
        gender_o = extra.includes('表面性别（不剧透）') && res["sex"] ? `表面性别：${this.genderDic[res["sex"][0]]}` : '';
        gender_i = extra.includes('真实性别（含剧透）') && res["sex"] ? `真实性别：${this.genderDic[res["sex"][1]]}` : '';
        bwh = extra.includes('三围') && (res["bust"] || res["waist"] || res["hips"])
            ? `三围：${res["bust"] ?? '??'}-${res["waist"] ?? '??'}-${res["hips"] ?? '??'}`
            : '';
        cup = extra.includes('罩杯') && res["cup"] ? `罩杯：${res["cup"]}` : '';
        description = extra.includes('简介（未翻译）') && res["description"] ? `简介：${res["description"]}` : '';

        if (!image) {
            return [img, id, name, aliases, birthday, vns, blood, age, wh, gender_o, gender_i, bwh, cup, description]
                .filter(item => item !== '')
                .join('\n');
        } else {
            const html = new Html();

            return html.createContent({
                'res': {
                    'img': img,
                    'content': [id, name, aliases, birthday, vns, blood, age, wh, gender_o, gender_i, bwh, cup, description]
                        .filter(item => item !== '')
                }
            })
        }
    }

    static async handleProducer(ctx: Context, res: Array<object>, extra: Array<string>, image: boolean = false): Promise<string> {
        const id = `VNDB唯一id：${res["id"]}`;
        const name = `名称：${[res["original"] ?? '', res["name"] ?? ''].filter(item => item !== '').join('、')}`;
        const aliases = res["aliases"].length !== 0 ? `别名：${res["aliases"].join("、")}` : '';
        const lang = `开发语言：${this.langDic[res["lang"]]}`;
        const type = `类型：${this.typeDic[res["type"]]}`;
        const description = res["description"] ? `简介：${res["description"]}` : '';

        const vnArr: Array<string> = [];


        if (!image) {
            for (let index = 0; index < extra.length && index < 3; index++) {
                const imgFile = await Downloader.downloadToPath(ctx, extra[index]["image"]["url"]);
                const vnImg = `<img src="${pathToFileURL(resolve(imgFile)) ?? this.failurePic}"/>`;
                const vnTitle = `名称：『${extra[index]["alttitle"] ?? extra[index]["title"]}』`;
                const vnReleased = `发布日期：${extra[index]["released"]}`;
                const vnRating = `贝叶斯评分：${extra[index]["rating"]}`;
                const vnId = `VNDB唯一id：${extra[index]["id"]}`;
                vnArr.push([vnImg, vnTitle, vnReleased, vnRating, vnId].filter(item => item !== '').join('\n'));
            }

            const vns = `代表作品：\n${vnArr.join('\n')}`;
            return [id, name, aliases, lang, type, description, vns].filter(item => item !== '').join('\n');
        } else {
            for (let index = 0; index < extra.length && index < ctx.config.maxImageNumber; index++) {
                const vnImg = await Downloader.downloadToPath(ctx, extra[index]["image"]["url"]);
                const vnTitle = `名称：『${extra[index]["alttitle"] ?? extra[index]["title"]}』`;
                const vnReleased = `发布日期：${extra[index]["released"]}`;
                const vnRating = `贝叶斯评分：${extra[index]["rating"]}`;
                const vnId = `VNDB唯一id：${extra[index]["id"]}`;

                const htmlVN = new Html();


                vnArr.push(htmlVN.createContent({
                    'res': {
                        'img': vnImg,
                        'content': [vnTitle, vnReleased, vnRating, vnId].filter(item => item !== '')
                    }
                }));
            }
            const vns = `代表作品：<br>${vnArr.join('<br>')}`;
            const html = new Html();

            return html.createContent({
                'res': {
                    'content': [id, name, aliases, lang, type, description, vns].filter(item => item !== '')
                }
            })
        }
    }

    static async handleEvent(ctx: Context, resVN: Array<object>, resCha: Array<object>): Promise<string[]> {
        const resContent = new Array<string>();
        const html = new Html();
        if (resVN.length !== 0) {
            for (let index = 0; index < resVN.length; index++) {
                if (index === 0) resContent.push(html.createContentTitle('这些令人印象深刻的作品诞生于过去的今天！'));

                const img = await Downloader.downloadToPath(ctx, resVN[index]["image"]["url"]);
                const title = `名称：${resVN[index]["alttitle"] ?? resVN[index]["title"]}`;
                const id = `VNDB唯一id：${resVN[index]["id"]}`;
                const rating = `贝叶斯评分：${resVN[index]["rating"]}`;
                const released = resVN[index]["released"] ? `发布日期：${resVN[index]["released"]}` : '';

                resContent.push(html.createContent({
                    'res': {
                        'img': img,
                        'content': [id, title, rating, released]
                            .filter(item => item !== '')
                    }
                }));

            }
        } else {
            resContent.push(html.createContentTitle('历史上的今天没有令人印象深刻的作品诞生...'));
        }
        if (resCha.length !== 0) {
            for (let index = 0; index < resCha.length; index++) {
                if (index === 0) resContent.push(html.createContentTitle('这些令人印象深刻的角色的生日是今天！'));
                const vnsList: Array<string> = [];
                let skipping = true;
                resCha[index]["vns"].forEach(e => {
                    vnsList.push(`『${e["alttitle"] ?? e["title"]}』（${e["id"]}）`);
                    if (e["rating"] >= ctx.config.lowestRating) skipping = false;
                })
                if (skipping) continue;

                const img = await Downloader.downloadToPath(ctx, resCha[index]["image"]["url"]);
                const name = `姓名：${resCha[index]["original"] ?? resCha[index]["name"]}`;
                const id = `VNDB唯一id：${resCha[index]["id"]}`;
                const birthday = resCha[index]["birthday"] ? `生日：${resCha[index]["birthday"][0]}月${resCha[index]["birthday"][1]}日` : '';
                const vns = `出场作品（id）：${vnsList.join('、')}`;

                resContent.push(html.createContent({
                    'res': {
                        'img': img,
                        'content': [id, name, birthday, vns]
                            .filter(item => item !== '')
                    }
                }));
            }
        } else {
            resContent.push(html.createContentTitle('令人记忆深刻的角色们的生日都不是今天...'));
        }

        return html.getContent();
    }
}

