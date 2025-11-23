var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply8,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(src_exports);
var import_koishi2 = require("koishi");

// src/components/Queue.ts
var Queue = class {
  static {
    __name(this, "Queue");
  }
  ctx;
  session;
  queue;
  manager;
  constructor(_ctx, _sess) {
    this.ctx = _ctx;
    this.session = _sess;
    this.manager = QueueManager.getInstance();
    const res = this.manager.withdrawQueue(_sess.channelId);
    if (res) this.queue = res;
    else {
      this.queue = new Array();
      this.manager.registerQueue(this.session.channelId, this.queue);
    }
  }
  enQueue(node) {
    this.queue.push(node);
    this.session.send(`关键词「${node.value}」已经加入队列。`);
  }
  // 运行元素出队并获取出队元素
  deQueue(key) {
    for (let index = 0; index < this.queue.length; index++) {
      if (!this.queue[index].running) {
        continue;
      }
      if (this.queue[index].value === key) {
        const e = this.queue.splice(index, 1)[0];
        if (this.queue.length === 0) this.manager.deregisterQueue(this.session.channelId);
        return e;
      }
    }
    throw new Error("未能删除指定任务!");
  }
  // 获取下一个任务，并激活运行
  next() {
    for (let index = 0; index < this.queue.length; index++) {
      if (!this.queue[index].running) {
        this.queue[index].running = true;
        return this.queue[index];
      }
    }
    return null;
  }
  chechStatus() {
    for (let i = 0; i < this.ctx.config.processNumber; i++) {
      if (!this.queue[i].running) {
        return true;
      }
    }
    return false;
  }
  cleanAll() {
    while (this.queue.length !== 0) {
      this.queue.shift();
    }
    this.manager.deregisterQueue(this.session.channelId);
  }
};
var QueueManager = class _QueueManager {
  static {
    __name(this, "QueueManager");
  }
  manager = /* @__PURE__ */ new Map();
  static Instance;
  constructor() {
  }
  static getInstance() {
    if (!_QueueManager.Instance) {
      _QueueManager.Instance = new _QueueManager();
    }
    return _QueueManager.Instance;
  }
  checkMap(session) {
    if (!session.channelId) throw new Error("错误的频道id！");
    let len = 0;
    const run = new Array();
    if (this.manager.has(session.channelId)) {
      this.manager.get(session.channelId).forEach((e) => {
        len++;
        if (e.running) run.push(`「${e.value}」`);
      });
      return `当前队列共有${len}个任务，正在进行${run.join("、")}...`;
    } else return "当前频道无搜索队列。";
  }
  registerQueue(id, queue) {
    if (id) this.manager.set(id, queue);
    else throw new Error("错误的频道id！");
  }
  deregisterQueue(id) {
    if (id) this.manager.delete(id);
    else throw new Error("错误的频道id！");
  }
  withdrawQueue(id) {
    if (id) {
      if (this.manager.has(id)) return this.manager.get(id);
      else return null;
    } else throw new Error("错误的频道id！");
  }
};

// src/commands/Admin.ts
function apply(ctx, main) {
  main.subcommand(".queue").alias("queue").action(async ({ session }) => {
    const manager = QueueManager.getInstance();
    session.send(manager.checkMap(session));
  });
}
__name(apply, "apply");

// src/components/ProcessManager.ts
var import_koishi = require("koishi");

// src/components/HtmlImage.ts
var import_path = __toESM(require("path"));
var fs = __toESM(require("fs"));
var HtmlImage = class {
  static {
    __name(this, "HtmlImage");
  }
  // private keyword: string;
  imgPath = import_path.default.join(__dirname, "resources/bg.png");
  // private imgPath: string = "./resources/bg.png";
  title = "";
  content = new Array();
  build() {
    return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {
                    padding: 0;
                    margin: 0;
                    font-size: 40px;
                }
                body {
                    display: flex;
                    flex-direction: column;
                    background-image: url("${this.imageToBase64(this.imgPath.replace(/\\/g, "/"))}");
                    background-size: cover;
                    background-repeat: no-repeat;
                    width: 900px;
                }
                h2 {
                    font-size: 80px;
                    text-align: center;
                }
                .content {
                    margin: 20px 0;
                    width: stretch;
                    overflow-x: hidden;
                }
                img {
                    display: block;
                    width: 400px;
                    height: auto;
                }
            </style>
        </head>
        <body>
            ${this.title}
            ${this.content.join("")}
        </body>
        </html>
        `;
  }
  changeBg(path5) {
    this.imgPath = path5;
  }
  createEventTitle(date) {
    const dayDic = ["日", "月", "火", "水", "木", "金", "土"];
    let y, m, d;
    [y, m, d] = date.split("-");
    const formatDate = [y, m.padStart(2, "0"), d.padStart(2, "0")];
    const D = new Date(formatDate.join("-"));
    this.title = `<h2>~  ${formatDate[0]}年${formatDate[1]}月${formatDate[2]}日  ~</h2>
                    <h2>~  ${dayDic[D.getDay()]}曜日  ~</h2>`;
  }
  createContentTitle(title) {
    const contentTitle = `<h3>·${title}</h3>`;
    this.content.push(contentTitle);
    return contentTitle;
  }
  createContent(context) {
    if (context["res"]["img"]) {
      const content = `<div class="content">
                        <img src="${this.imageToBase64(context["res"]["img"].replace(/\\/g, "/"))}" alt="图片出错了">
                        ${context["res"]["content"].join("<br>")}
                    </div>`;
      this.content.push(content);
      return content;
    } else {
      const content = `<div class="content">
                        ${context["res"]["content"].join("<br>")}
                    </div>`;
      this.content.push(content);
      return content;
    }
  }
  getContent() {
    return this.content;
  }
  setContent(content) {
    this.content = content;
  }
  imageToBase64(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64 = imageBuffer.toString("base64");
      const mimeType = "image/jpg";
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.log(`无法读取图片: ${imagePath}`, error.message);
      return "";
    }
  }
};
var HtmlImage_default = HtmlImage;

// src/components/Downloader.ts
var fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
var Downloader = class {
  static {
    __name(this, "Downloader");
  }
  static async downloadToPath(ctx, url) {
    const targetDir = import_path2.default.join(__dirname, "cache/image");
    if (fs2.existsSync(targetDir)) {
      const name2 = this.cutFileName(url);
      const file = import_path2.default.join(targetDir, `${name2}.jpg`);
      if (!fs2.existsSync(file)) {
        for (let index = 0; index < ctx.config.retryCount; index++) {
          try {
            const buffer = await ctx.http.get(url, { responseType: "arraybuffer" });
            await fs2.promises.writeFile(file, Buffer.from(buffer));
            break;
          } catch (err) {
            if (index + 1 === ctx.config.retryCount) {
              if (ctx.config.detailMsg) ctx.logger.warn(`最后一次下载图片「${url}」失败！将用备用图片替代。`);
              return import_path2.default.join(__dirname, "resources/short.png");
            }
            if (ctx.config.detailMsg) ctx.logger.warn(`第${index + 1}次下载图片「${url}」失败...`);
          }
        }
      }
      return file;
    } else throw new Error("初始化文件夹失败，下载图片失败！" + targetDir);
  }
  static cutFileName(url) {
    return url.split("/").pop().split(".")[0];
  }
};
var Downloader_default = Downloader;

// src/components/DataHandler.ts
var import_url = require("url");
var import_path3 = require("path");
var RequestHandler = class {
  static {
    __name(this, "RequestHandler");
  }
  static buildFields(type, field) {
    if (type === "event" /* Event */) {
      if (field === "vn" /* VN */) return "id,rating,released,alttitle,title,image{url}";
      else if (field === "character" /* Character */) return "id,name,original,birthday,image{url},vns{alttitle,title,id,rating}";
      else return "";
    } else {
      if (field === "vn" /* VN */) return "id,average,rating,released,length,platforms,aliases,developers{id,original,name},titles{lang,title,official},image{url},alttitle,title";
      else if (field === "character" /* Character */) return "id,name,aliases,sex,birthday,waist,hips,bust,blood_type,weight,height,cup,original,description,image{url},vns{alttitle,title,id}";
      else if (field === "producer" /* Producer */) return "id,name,original,aliases,lang,type,description";
      else return "";
    }
  }
};
var ResponseHandler = class {
  static {
    __name(this, "ResponseHandler");
  }
  static failurePic = "";
  static langDic = {
    "ja": "日文",
    "en": "英文",
    "zh-Hans": "简中",
    "zh-Hant": "繁中"
  };
  static genderDic = {
    "m": "男性",
    "f": "女性",
    "b": "双性",
    "n": "无性"
  };
  static typeDic = {
    "co": "公司",
    "in": "个人",
    "ng": "业余团体"
  };
  static async handleVN(ctx, res, image = false) {
    const imgFile = await Downloader_default.downloadToPath(ctx, res["image"]["url"]);
    const img = image ? imgFile : `<img src="${(0, import_url.pathToFileURL)((0, import_path3.resolve)(imgFile)).href ?? this.failurePic}"/>`;
    const average = `平均分：${res["average"]}`;
    const rating = `贝叶斯评分：${res["rating"]}`;
    const released = res["released"] ? `发布日期：${res["released"]}` : "";
    const length = res["length"] ? `剧情长度：${res["length"]}` : "";
    const id = `VNDB唯一id：${res["id"]}`;
    const platforms = `支持平台：${res["platforms"].join("、")}`;
    const aliases = `别名：${res["aliases"].join("、")}`;
    const developers = [];
    res["developers"].forEach((e) => {
      developers.push(`${e["original"] ?? e["name"]}（${e["id"]}）`);
    });
    const dev = `出版社（id）：${developers.join("\n")}`;
    let ja, en, fz, jz;
    res["titles"].forEach((v) => {
      if (v["lang"] === "ja") ja = `日文标题（${v["official"] ? "官方" : "非官方"}）：${v["title"]}`;
      else if (v["lang"] === "en") en = `英文标题（${v["official"] ? "官方" : "非官方"}）：${v["title"]}`;
      else if (v["lang"] === "zh-Hans") jz = `简中标题（${v["official"] ? "官方" : "非官方"}）：${v["title"]}`;
      else if (v["lang"] === "zh-Hant") fz = `繁中标题（${v["official"] ? "官方" : "非官方"}）：${v["title"]}`;
    });
    if (!image) {
      const title = [ja, en, jz, fz].filter((e) => e != void 0).join("\n");
      return [img, id, title, aliases, dev, released, average, rating, length, platforms].filter((item) => item !== "").join("\n");
    } else {
      const title = [ja, en, jz, fz].filter((e) => e != void 0).join("<br>");
      const html = new HtmlImage_default();
      return html.createContent({
        "res": {
          "img": img,
          "content": [id, title, aliases, dev, released, average, rating, length, platforms].filter((item) => item !== "")
        }
      });
    }
  }
  static async handleCharacter(ctx, res, extra, image = false) {
    const imgFile = await Downloader_default.downloadToPath(ctx, res["image"]["url"]);
    const img = image ? imgFile : `<img src="${(0, import_url.pathToFileURL)((0, import_path3.resolve)(imgFile)) ?? this.failurePic}"/>`;
    const name2 = `姓名：${res["original"] ?? res["name"]}`;
    const id = `VNDB唯一id：${res["id"]}`;
    const aliases = res["aliases"].length !== 0 ? `别名：${res["aliases"].join("、")}` : "";
    const birthday = res["birthday"] ? `生日：${res["birthday"][0]}月${res["birthday"][1]}日` : "";
    const vnsList = [];
    res["vns"].forEach((e) => {
      vnsList.push(`『${e["alttitle"] ?? e["title"]}』（${e["id"]}）`);
    });
    const vns = `出场作品（id）：${vnsList.join("、")}`;
    let blood, age, wh, gender_o, gender_i, bwh, cup, description;
    blood = extra.includes("血型") && res["blood_type"] ? `血型：${res["blood_type"]}` : "";
    age = extra.includes("年龄") && res["age"] ? `年龄：${res["age"]}` : "";
    wh = extra.includes("身高/体重") && (res["weight"] || res["height"]) ? `身高/体重（cm/kg）：${res["height"] ?? "??"}/${res["weight"] ?? "??"}` : "";
    gender_o = extra.includes("表面性别（不剧透）") && res["sex"] ? `表面性别：${this.genderDic[res["sex"][0]]}` : "";
    gender_i = extra.includes("真实性别（含剧透）") && res["sex"] ? `真实性别：${this.genderDic[res["sex"][1]]}` : "";
    bwh = extra.includes("三围") && (res["bust"] || res["waist"] || res["hips"]) ? `三围：${res["bust"] ?? "??"}-${res["waist"] ?? "??"}-${res["hips"] ?? "??"}` : "";
    cup = extra.includes("罩杯") && res["cup"] ? `罩杯：${res["cup"]}` : "";
    description = extra.includes("简介（未翻译）") && res["description"] ? `简介：${res["description"]}` : "";
    if (!image) {
      return [img, id, name2, aliases, birthday, vns, blood, age, wh, gender_o, gender_i, bwh, cup, description].filter((item) => item !== "").join("\n");
    } else {
      const html = new HtmlImage_default();
      return html.createContent({
        "res": {
          "img": img,
          "content": [id, name2, aliases, birthday, vns, blood, age, wh, gender_o, gender_i, bwh, cup, description].filter((item) => item !== "")
        }
      });
    }
  }
  static async handleProducer(ctx, res, extra, image = false) {
    const id = `VNDB唯一id：${res["id"]}`;
    const name2 = `名称：${[res["original"] ?? "", res["name"] ?? ""].filter((item) => item !== "").join("、")}`;
    const aliases = res["aliases"].length !== 0 ? `别名：${res["aliases"].join("、")}` : "";
    const lang = `开发语言：${this.langDic[res["lang"]]}`;
    const type = `类型：${this.typeDic[res["type"]]}`;
    const description = res["description"] ? `简介：${res["description"]}` : "";
    const vnArr = [];
    if (!image) {
      for (let index = 0; index < extra.length && index < 3; index++) {
        const imgFile = await Downloader_default.downloadToPath(ctx, extra[index]["image"]["url"]);
        const vnImg = `<img src="${(0, import_url.pathToFileURL)((0, import_path3.resolve)(imgFile)) ?? this.failurePic}"/>`;
        const vnTitle = `名称：『${extra[index]["alttitle"] ?? extra[index]["title"]}』`;
        const vnReleased = `发布日期：${extra[index]["released"]}`;
        const vnRating = `贝叶斯评分：${extra[index]["rating"]}`;
        const vnId = `VNDB唯一id：${extra[index]["id"]}`;
        vnArr.push([vnImg, vnTitle, vnReleased, vnRating, vnId].filter((item) => item !== "").join("\n"));
      }
      const vns = `代表作品：
${vnArr.join("\n")}`;
      return [id, name2, aliases, lang, type, description, vns].filter((item) => item !== "").join("\n");
    } else {
      for (let index = 0; index < extra.length && index < ctx.config.maxImageNumber; index++) {
        const vnImg = await Downloader_default.downloadToPath(ctx, extra[index]["image"]["url"]);
        const vnTitle = `名称：『${extra[index]["alttitle"] ?? extra[index]["title"]}』`;
        const vnReleased = `发布日期：${extra[index]["released"]}`;
        const vnRating = `贝叶斯评分：${extra[index]["rating"]}`;
        const vnId = `VNDB唯一id：${extra[index]["id"]}`;
        const htmlVN = new HtmlImage_default();
        vnArr.push(htmlVN.createContent({
          "res": {
            "img": vnImg,
            "content": [vnTitle, vnReleased, vnRating, vnId].filter((item) => item !== "")
          }
        }));
      }
      const vns = `代表作品：<br>${vnArr.join("<br>")}`;
      const html = new HtmlImage_default();
      return html.createContent({
        "res": {
          "content": [id, name2, aliases, lang, type, description, vns].filter((item) => item !== "")
        }
      });
    }
  }
  static async handleEvent(ctx, resVN, resCha) {
    const resContent = new Array();
    const html = new HtmlImage_default();
    if (resVN.length !== 0) {
      for (let index = 0; index < resVN.length; index++) {
        if (index === 0) resContent.push(html.createContentTitle("这些令人印象深刻的作品诞生于过去的今天！"));
        const img = await Downloader_default.downloadToPath(ctx, resVN[index]["image"]["url"]);
        const title = `名称：${resVN[index]["alttitle"] ?? resVN[index]["title"]}`;
        const id = `VNDB唯一id：${resVN[index]["id"]}`;
        const rating = `贝叶斯评分：${resVN[index]["rating"]}`;
        const released = resVN[index]["released"] ? `发布日期：${resVN[index]["released"]}` : "";
        resContent.push(html.createContent({
          "res": {
            "img": img,
            "content": [id, title, rating, released].filter((item) => item !== "")
          }
        }));
      }
    } else {
      resContent.push(html.createContentTitle("历史上的今天没有令人印象深刻的作品诞生..."));
    }
    if (resCha.length !== 0) {
      for (let index = 0; index < resCha.length; index++) {
        if (index === 0) resContent.push(html.createContentTitle("这些令人印象深刻的角色的生日是今天！"));
        const vnsList = [];
        let skipping = true;
        resCha[index]["vns"].forEach((e) => {
          vnsList.push(`『${e["alttitle"] ?? e["title"]}』（${e["id"]}）`);
          if (e["rating"] >= ctx.config.lowestRating) skipping = false;
        });
        if (skipping) continue;
        const img = await Downloader_default.downloadToPath(ctx, resCha[index]["image"]["url"]);
        const name2 = `姓名：${resCha[index]["original"] ?? resCha[index]["name"]}`;
        const id = `VNDB唯一id：${resCha[index]["id"]}`;
        const birthday = resCha[index]["birthday"] ? `生日：${resCha[index]["birthday"][0]}月${resCha[index]["birthday"][1]}日` : "";
        const vns = `出场作品（id）：${vnsList.join("、")}`;
        resContent.push(html.createContent({
          "res": {
            "img": img,
            "content": [id, name2, birthday, vns].filter((item) => item !== "")
          }
        }));
      }
    } else {
      resContent.push(html.createContentTitle("令人记忆深刻的角色们的生日都不是今天..."));
    }
    return html.getContent();
  }
};

// src/components/Request.ts
var Request = class {
  static {
    __name(this, "Request");
  }
  ctx;
  baseUrl = "https://api.vndb.org/kana/";
  type;
  keyword;
  url;
  field;
  method;
  filters;
  constructor(_ctx, _elem) {
    this.ctx = _ctx;
    this.type = _elem.type;
    this.keyword = _elem.value;
    this.method = _elem.method ?? "search";
    this.field = _elem.field ?? this.type;
    this.filters = _elem.filters ?? [this.method, "=", this.keyword];
    this.url = this.baseUrl + this.field;
  }
  async request() {
    for (let i = 0; i < this.ctx.config.retryCount; i++) {
      try {
        let payload = this.buildPayload();
        return await this.ctx.http.post(this.url, payload, {
          headers: { "Content-Type": "application/json" }
        });
      } catch {
        this.ctx.logger.warn(`${this.url}第${i + 1}次请求失败...`);
      }
    }
    throw new Error(`${this.url}多次请求失败...`);
  }
  buildPayload() {
    const fields = RequestHandler.buildFields(this.type, this.field);
    if (this.field === "vn" /* VN */) {
      return {
        "filters": this.filters,
        "fields": fields,
        "sort": "rating",
        "reverse": true
      };
    } else if (this.field === "character" /* Character */ || this.field === "producer" /* Producer */) {
      return {
        "filters": this.filters,
        "fields": fields
      };
    } else throw new Error("错误的构建命令类型！");
  }
};
var Request_default = Request;

// src/components/Database.ts
var Database = class {
  static {
    __name(this, "Database");
  }
  static async refresh(ctx, date) {
    const res = await ctx.database.get("vndb", {
      date: {
        $lte: date,
        $gte: /* @__PURE__ */ new Date(1)
      }
    });
    ctx.database.remove("vndb", {
      date: {
        $lte: date,
        $gte: /* @__PURE__ */ new Date(1)
      }
    });
    return res;
  }
  static async refreshToday(ctx) {
    try {
      const now = /* @__PURE__ */ new Date();
      const res = ctx.database.remove("vndb", {
        date: {
          $lte: now,
          $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      });
      ctx.logger.success("重新加载插件，今日数据库数据自动清空...");
      if (ctx.config.detailMsg) ctx.logger.success(`删除今日数据库缓存数据共${(await res).matched}条！`);
      return res;
    } catch (e) {
      ctx.model.extend("vndb", {
        "id": "unsigned",
        vndbID: "string",
        date: "date",
        type: "string",
        keyword: "string",
        textData: "text"
      }, {
        primary: "id",
        autoInc: true
      });
    }
  }
  static async select(ctx, type, keyword, id) {
    let data = [];
    if (id) {
      data = await ctx.database.get("vndb", {
        type,
        vndbID: id
      });
    }
    if (data.length === 0) {
      data = await ctx.database.get("vndb", {
        type,
        keyword
      });
    }
    if (data.length === 0) return null;
    else if (data.length === 1) {
      return data[0];
    } else throw new Error("数据库记录重复数据！");
  }
  static async insert(ctx, type, keyword, id, textData) {
    return ctx.database.create("vndb", {
      vndbID: id ?? "",
      date: /* @__PURE__ */ new Date(),
      type,
      keyword,
      textData: textData ?? ""
    });
  }
  static formattingDate(date) {
    if (!date) {
      date = /* @__PURE__ */ new Date();
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
};
var Database_default = Database;

// src/components/ProcessManager.ts
var fs3 = __toESM(require("fs"));
var import_path4 = __toESM(require("path"));
var ProcessManager = class {
  static {
    __name(this, "ProcessManager");
  }
  processes = /* @__PURE__ */ new Map();
  ctx;
  sess;
  queue;
  constructor(_ctx, _sess, _queue) {
    this.ctx = _ctx;
    this.sess = _sess;
    this.queue = _queue;
  }
  async startListening() {
    if (this.processes.size === this.ctx.config.processNumber) return;
    else if (this.processes.size > this.ctx.config.processNumber) throw new Error("处理队伍过长！");
    const task = this.queue.next();
    this.processes.set(task.value, this.runTasks(task));
    while (this.processes.size > 0) {
      try {
        const result = await Promise.race(this.processes.values());
        this.queue.deQueue(result);
        this.processes.delete(result);
        const task2 = this.queue.next();
        if (task2) this.processes.set(task2.value, this.runTasks(task2));
      } catch (e) {
        this.queue.cleanAll();
        this.processes.clear();
        this.ctx.logger.error(`错误发生了：${e.message}，清空当前队列！`);
        this.sess.send(`错误发生了：${e.message}，清空当前队列！`);
        throw e;
      }
    }
  }
  async runTasks(task) {
    if (await this.checkFromDB(task.type, task.value)) return task.value;
    let buffer;
    let singleID;
    let textContent;
    if (task.type === "event" /* Event */) {
      const resVN = await new Request_default(this.ctx, {
        type: "event" /* Event */,
        value: task.value,
        running: task.running,
        field: task.field[0],
        filters: task.filters[0]
      }).request();
      const resCha = await new Request_default(this.ctx, {
        type: "event" /* Event */,
        value: task.value,
        running: task.running,
        field: task.field[1],
        filters: task.filters[1]
      }).request();
      const html = new HtmlImage();
      html.createEventTitle(task.value);
      const content = await ResponseHandler.handleEvent(this.ctx, resVN["results"], resCha["results"]);
      if (this.ctx.config.backgroundPath) html.changeBg(import_path4.default.join(this.ctx.baseDir, this.ctx.config.backgroundPath));
      html.setContent(content);
      const source = html.build();
      buffer = await this.renderAndShot(source);
    } else {
      const res = await new Request_default(this.ctx, task).request();
      if (res["results"].length === 0) {
        this.sess.send(`关键词「${task.value}」不存在，切换简繁体或者更换别名可能解决问题。`);
        return task.value;
      }
      singleID = res["results"].length === 1 ? res["results"][0]["id"] : "";
      const output = this.ctx.config.outputContent;
      for (let index = 0; index < output.length; index++) {
        if (output[index] === "以文本形式发送（最多三条）") {
          const cmdArr = [];
          for (let index2 = 0; index2 < res["results"].length && index2 < 3; index2++) {
            let body;
            if (task.type === "vn" /* VN */) {
              body = await ResponseHandler.handleVN(this.ctx, res["results"][index2]);
            } else if (task.type === "character" /* Character */) {
              body = await ResponseHandler.handleCharacter(this.ctx, res["results"][index2], this.ctx.config.characterOptions);
            } else if (task.type === "producer" /* Producer */) {
              const exBody = await new Request_default(this.ctx, {
                type: "vn" /* VN */,
                value: "",
                running: false,
                filters: ["developer", "=", ["id", "=", res["results"][index2]["id"]]]
              }).request();
              body = await ResponseHandler.handleProducer(this.ctx, res["results"][index2], exBody["results"]);
            }
            cmdArr.push(`<message>${body}</message>`);
          }
          if (this.ctx.config.isMerge) textContent = `<message forward>${cmdArr.join("")}</message>`;
          else textContent = cmdArr.join("");
          this.sess.send(textContent);
        } else if (output[index] === "以图片方式发送") {
          const cmdArr = new Array();
          let type;
          for (let index2 = 0; index2 < res["results"].length; index2++) {
            let body;
            if (task.type === "vn" /* VN */) {
              body = await ResponseHandler.handleVN(this.ctx, res["results"][index2], true);
              type = "vn" /* VN */;
            } else if (task.type === "character" /* Character */) {
              body = await ResponseHandler.handleCharacter(this.ctx, res["results"][index2], this.ctx.config.characterOptions, true);
            } else if (task.type === "producer" /* Producer */) {
              const exBody = await new Request_default(this.ctx, {
                type: "vn" /* VN */,
                value: "",
                running: false,
                filters: ["developer", "=", ["id", "=", res["results"][index2]["id"]]]
              }).request();
              body = await ResponseHandler.handleProducer(this.ctx, res["results"][index2], exBody["results"], true);
            }
            cmdArr.push(body);
          }
          const html = new HtmlImage();
          if (this.ctx.config.backgroundPath) html.changeBg(import_path4.default.join(this.ctx.baseDir, this.ctx.config.backgroundPath));
          html.setContent(cmdArr);
          const source = html.build();
          buffer = await this.renderAndShot(source);
        } else throw new Error("发送内容配置错误！");
      }
    }
    const fileName = (await Database_default.insert(this.ctx, task.type, task.value, singleID, textContent)).id;
    fs3.writeFile(import_path4.default.join(__dirname, `cache/buffer/${fileName}.bin`), buffer, (err) => {
      if (err) throw new Error("写入文件错误！");
    });
    return task.value;
  }
  async checkFromDB(type, keyword, id) {
    const dataDB = await Database_default.select(this.ctx, type, keyword, id ?? "");
    if (dataDB) {
      if (this.ctx.config.outputContent.includes("以图片方式发送")) {
        const bufferFile = import_path4.default.join(__dirname, `cache/buffer/${dataDB.id}.bin`);
        if (fs3.existsSync(bufferFile)) {
          const img = fs3.readFileSync(bufferFile);
          this.sess.send(import_koishi.h.image(img, "image/png"));
        } else throw new Error("数据库未记录img信息！");
      }
      if (this.ctx.config.outputContent.includes("以文本形式发送（最多三条）")) {
        if (dataDB.textData) this.sess.send(dataDB.textData);
      }
      this.ctx.logger.success("数据库中有当前关键字的记录，将调用数据库中的结果。");
      return true;
    } else return false;
  }
  async renderAndShot(source) {
    try {
      const page = await this.ctx.puppeteer.page();
      await page.setViewport({ width: 900, height: 600 });
      await page.setContent(source, {
        waitUntil: "domcontentloaded"
      });
      const buffer = await page.screenshot({
        type: "jpeg",
        quality: 100,
        fullPage: true,
        encoding: "binary",
        optimizeForSpeed: true
      });
      this.sess.send(import_koishi.h.image(buffer, "image/jpg"));
      return buffer;
    } catch (e) {
      this.ctx.logger.error("图片渲染失败：" + e);
      this.sess.send("图片渲染失败！");
    }
  }
};

// src/commands/VN.ts
function apply2(ctx, main) {
  main.subcommand(".vn <keyword:text>").alias("vndb.v", "vn").action(async ({ session }, keyword) => {
    const queue = new Queue(ctx, session);
    const node = {
      type: "vn" /* VN */,
      value: keyword,
      running: false
    };
    queue.enQueue(node);
    new ProcessManager(ctx, session, queue).startListening();
  });
}
__name(apply2, "apply");

// src/commands/Character.ts
function apply3(ctx, main) {
  main.subcommand(".character <keyword:text>").alias("vndb.c", "character").action(async ({ session }, keyword) => {
    const queue = new Queue(ctx, session);
    const node = {
      type: "character" /* Character */,
      value: keyword,
      running: false
    };
    queue.enQueue(node);
    new ProcessManager(ctx, session, queue).startListening();
  });
}
__name(apply3, "apply");

// src/commands/Producer.ts
function apply4(ctx, main) {
  main.subcommand(".producer <keyword:text>").alias("vndb.p", "producer").action(async ({ session }, keyword) => {
    const queue = new Queue(ctx, session);
    const node = {
      type: "producer" /* Producer */,
      value: keyword,
      running: false
    };
    queue.enQueue(node);
    new ProcessManager(ctx, session, queue).startListening();
  });
}
__name(apply4, "apply");

// src/commands/ID.ts
function apply5(ctx, main) {
  main.subcommand(".id <string:text>").alias("vndb.i", "id").action(async ({ session }, keyword) => {
    let type;
    if (keyword[0] === "v") {
      type = "vn" /* VN */;
    } else if (keyword[0] === "c") {
      type = "character" /* Character */;
    } else if (keyword[0] === "p") {
      type = "producer" /* Producer */;
    } else {
      session.send(`id「${keyword}」无法匹配当前所支持的类型或者有误！`);
      return;
    }
    const queue = new Queue(ctx, session);
    const node = {
      type,
      value: keyword,
      running: false,
      method: "id"
    };
    queue.enQueue(node);
    new ProcessManager(ctx, session, queue).startListening();
  });
}
__name(apply5, "apply");

// src/commands/Event.ts
function apply6(ctx, main) {
  main.subcommand(".event [date: string]").alias("vndb.e", "event").action(async ({ session }, date) => {
    const today = /* @__PURE__ */ new Date();
    const year = today.getFullYear();
    let month, day;
    if (!date) {
      month = today.getMonth() + 1;
      day = today.getDate();
    } else {
      const dateStr = date.split("-");
      month = Number(dateStr[0]);
      day = Number(dateStr[1]);
    }
    const whole = `${year}-${month}-${day}`;
    const dateList = ["or"];
    for (let index = year - 1; index >= 2e3; index--) {
      dateList.push(["released", "=", `${index}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`]);
    }
    const queue = new Queue(ctx, session);
    const node = {
      type: "event" /* Event */,
      value: whole,
      running: false,
      field: ["vn", "character"],
      filters: [
        ["and", dateList, ["rating", ">=", ctx.config.lowestRating]],
        ["birthday", "=", [month, day]]
      ]
    };
    queue.enQueue(node);
    new ProcessManager(ctx, session, queue).startListening();
  });
}
__name(apply6, "apply");

// src/commands/Index.ts
function apply7(ctx) {
  const main = ctx.command("vndb");
  apply(ctx, main);
  apply2(ctx, main);
  apply3(ctx, main);
  apply4(ctx, main);
  apply5(ctx, main);
  apply6(ctx, main);
}
__name(apply7, "apply");

// src/components/Initialization.ts
var fs4 = __toESM(require("fs"));
var import_path5 = __toESM(require("path"));
var Initialization = class {
  static {
    __name(this, "Initialization");
  }
  ctx;
  constructor(_ctx) {
    this.ctx = _ctx;
  }
  initAll() {
    this.initConfig();
    this.createFolder();
    this.downloadSources();
    this.cleanCache();
    Database_default.refreshToday(this.ctx);
  }
  initConfig() {
    if (!this.ctx.config.outputContent) this.ctx.logger.warn("发送形式选项设置为空，将不会发送任何结果！");
  }
  createFolder() {
    if (!fs4.existsSync(import_path5.default.join(__dirname, `cache/buffer`))) {
      fs4.mkdir(import_path5.default.join(__dirname, `cache/buffer`), { recursive: true }, (error) => {
        if (error) {
          this.ctx.logger.error("buffer文件初始化失败！");
        }
      });
    }
    this.ctx.logger.success("buffer文件夹初始化成功！");
    if (!fs4.existsSync(import_path5.default.join(__dirname, `cache/image`))) {
      fs4.mkdir(import_path5.default.join(__dirname, `cache/image`), { recursive: true }, (error) => {
        if (error) {
          this.ctx.logger.error("image文件夹初始化失败！");
        }
      });
    }
    this.ctx.logger.success("image文件夹初始化成功！");
  }
  async downloadSources() {
    const folder = import_path5.default.join(__dirname, `resources`);
    if (!fs4.existsSync(folder)) {
      fs4.mkdir(folder, async (error) => {
        if (error) {
          this.ctx.logger.error("resources文件夹初始化失败！");
        }
        const bg = await this.ctx.http.get("https://img.cdn1.vip/i/68dde984e2362_1759373700.webp", { responseType: "arraybuffer" });
        fs4.writeFile(import_path5.default.join(folder, "bg.png"), Buffer.from(bg), (e) => {
          if (e) this.ctx.logger.error("bg文件下载失败！");
        });
        const err = await this.ctx.http.get("https://img.cdn1.vip/i/68ddeae4c7eac_1759374052.webp", { responseType: "arraybuffer" });
        fs4.writeFile(import_path5.default.join(folder, "short.png"), Buffer.from(err), (e) => {
          if (e) this.ctx.logger.error("short文件下载失败！");
        });
      });
    }
    this.ctx.logger.success("sources文件夹初始化成功！");
  }
  cleanCache() {
    const now = /* @__PURE__ */ new Date();
    const nowTimestamp = now.getTime();
    const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayZeroTimestamp = todayZero.getTime();
    const oneDayInterval = 24 * 60 * 60 * 1e3;
    if (this.ctx.config.databaseCache > 0) {
      const nextExecutionTime = todayZeroTimestamp + oneDayInterval - nowTimestamp + (this.ctx.config.databaseCache - 1) * oneDayInterval;
      this.ctx.setTimeout(() => {
        this.ctx.setInterval(() => {
          this.cleanDBAndBuffer(oneDayInterval);
        }, oneDayInterval);
        this.cleanDBAndBuffer(oneDayInterval);
      }, nextExecutionTime);
    }
    if (this.ctx.config.localFileCache > 0) {
      const nextExecutionTime = todayZeroTimestamp + oneDayInterval - nowTimestamp + (this.ctx.config.localFileCache - 1) * oneDayInterval;
      this.ctx.setTimeout(() => {
        this.cleanLocalImage();
        this.ctx.setInterval(() => {
          this.cleanLocalImage();
        }, this.ctx.config.localFileCache * oneDayInterval);
      }, nextExecutionTime);
    }
  }
  cleanLocalImage() {
    const folderPath = import_path5.default.join(__dirname, "cache/image");
    fs4.rm(folderPath, {
      recursive: true,
      force: true
    }, (err) => {
      if (err) this.ctx.logger.error("image缓存清除错误！\n" + err);
      this.createFolder();
    });
    this.ctx.logger.success("image缓存清除成功！\n时间：" + /* @__PURE__ */ new Date());
  }
  async cleanDBAndBuffer(oneDayInterval) {
    const folderPath = import_path5.default.join(__dirname, "cache/buffer");
    const nowTimeStamp = (/* @__PURE__ */ new Date()).getTime();
    const res = await Database_default.refresh(this.ctx, new Date(nowTimeStamp - (this.ctx.config.databaseCache - 1) * oneDayInterval));
    const firstID = res.at(0).id;
    const lastID = res.at(-1).id;
    for (let index = firstID; index <= lastID; index++) {
      fs4.rm(import_path5.default.join(folderPath, `${index}.bin`), (err) => {
        if (err) this.ctx.logger.error(`buffer缓存清除错误！(${index})
` + err);
      });
    }
  }
};
var Initialization_default = Initialization;

// src/index.ts
var name = "pyura-vndb";
var Config = import_koishi2.Schema.intersect(
  [
    import_koishi2.Schema.object({
      detailMsg: import_koishi2.Schema.boolean().default(true).description("向用户发送更详细的状态信息"),
      retryCount: import_koishi2.Schema.number().min(1).max(10).default(3).description("请求服务器时最大重连次数"),
      backgroundPath: import_koishi2.Schema.path().description("为生成的图片设置自定义的背景图路径")
    }).description("全局配置"),
    import_koishi2.Schema.object({
      processNumber: import_koishi2.Schema.number().min(1).max(3).default(1).description("同时处理的任务数"),
      outputContent: import_koishi2.Schema.array(import_koishi2.Schema.union(["以图片方式发送", "以文本形式发送（最多三条）"])).role("checkbox").default(["以图片方式发送"]).description("发送形式选项（至少选一个）"),
      isMerge: import_koishi2.Schema.boolean().default(true).description("合并发送文字结果的多个内容")
    }).description("搜索通用配置"),
    import_koishi2.Schema.object({
      characterOptions: import_koishi2.Schema.array(import_koishi2.Schema.union(["血型", "年龄", "身高/体重", "表面性别（不剧透）", "真实性别（含剧透）", "三围", "罩杯", "简介（未翻译）"])).role("checkbox").description("人物信息额外配置，无数据时不发送")
    }).description("vndb.character指令配置"),
    import_koishi2.Schema.object({
      maxImageNumber: import_koishi2.Schema.number().min(3).max(20).default(10).description("以图片发送时显示的最多代表作品数（数字越大越容易渲染失败）")
    }).description("vndb.producer指令配置"),
    import_koishi2.Schema.object({
      lowestRating: import_koishi2.Schema.number().min(60).max(95).default(75).description("仅展示rating不低于此值的作品及其角色")
    }).description("vndb.event指令配置"),
    import_koishi2.Schema.object({
      databaseCache: import_koishi2.Schema.number().min(0).default(1).description("数据库清理时间（0表示永不自动清理，配置更新仍会清理当天数据以更新）"),
      localFileCache: import_koishi2.Schema.number().min(0).default(3).description("本地缓存清理时间（0表示永不自动清理)")
    }).description("缓存配置配置")
  ]
);
var inject = {
  required: ["http", "database"],
  optional: ["puppeteer"]
};
function apply8(ctx) {
  const init = new Initialization_default(ctx);
  init.initAll();
  apply7(ctx);
}
__name(apply8, "apply");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  inject,
  name
});
