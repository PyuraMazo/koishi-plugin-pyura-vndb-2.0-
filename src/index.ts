import { Context, Schema } from 'koishi'
import { } from 'koishi-plugin-puppeteer'
import * as Main from "./commands/Index";
import Init, { Initialization } from "./components/Initialization";
import Database from './components/Database';


export const name = 'pyura-vndb'

declare module "koishi" {
  interface Tables {
    vndb: {
      id: number;
      vndbID: string;
      date: Date;
      type: string;
      keyword: string;
      textData: string;
    };
  }
}


export interface Config {
  detailMsg: boolean,
  retryCount: number,
  backgroundPath: string,

  processNumber: number,
  outputContent: Array<string>,
  isMerge: boolean,

  characterOptions: Array<string>,

  maxImageNumber: number,

  lowestRating: number,

  databaseCache: number,
  localFileCache: number
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    detailMsg: Schema.boolean().default(true).description("向用户发送更详细的状态信息"),
    retryCount: Schema.number().min(1).max(10).default(3).description("请求服务器时最大重连次数"),
    backgroundPath: Schema.path().description("为生成的图片设置自定义的背景图路径"),

  }).description('全局配置'),

  Schema.object({
    processNumber: Schema.number().min(1).max(3).default(1).description("同时处理的任务数"),
    outputContent: Schema.array(Schema.union(['以图片方式发送', '以文本形式发送（最多三条）'])).role('checkbox').default(['以图片方式发送']).description("发送形式选项（至少选一个）"),
    isMerge: Schema.boolean().default(true).description("合并发送文字结果的多个内容")
  }).description('搜索通用配置'),

  Schema.object({
    characterOptions: Schema
      .array(Schema.union(['血型', '年龄', '身高/体重', '表面性别（不剧透）', '真实性别（含剧透）', '三围', '罩杯', '简介（未翻译）']))
      .role('checkbox')
      .description("人物信息额外配置，无数据时不发送"),
  }).description('vndb.character指令配置'),

  Schema.object({
    maxImageNumber: Schema.number().min(3).max(20).default(10).description("以图片发送时显示的最多代表作品数（数字越大越容易渲染失败）")
  }).description('vndb.producer指令配置'),

  Schema.object({
    lowestRating: Schema.number().min(60).max(95).default(75).description("仅展示rating不低于此值的作品及其角色")
  }).description('vndb.event指令配置'),

  Schema.object({
    databaseCache: Schema.number().min(0).default(1).description("数据库清理时间（0表示永不自动清理，配置更新仍会清理当天数据以更新）"),
    localFileCache: Schema.number().min(0).default(3).description("本地缓存清理时间（0表示永不自动清理)")
  }).description('缓存配置配置')
]
)


export const inject = {
  required: ["http", "database"],
  optional: ["puppeteer"]
}


export function apply(ctx: Context) {
  const init = new Init(ctx);
  init.initAll();
  
  Main.apply(ctx);
}
