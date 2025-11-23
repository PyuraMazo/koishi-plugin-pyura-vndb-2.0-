import { Context, Session, h } from 'koishi'
import Request from './Request';
import { ResponseHandler } from "./DataHandler";
import { Queue, QueueElement } from './Queue'
import { cmdType } from '../commands/Index';
import DB from "./Database";
import { HtmlImage } from "./HtmlImage";
import * as fs from 'fs';
import path from "path";


export class ProcessManager {
    private processes = new Map<string, Promise<string>>();
    private readonly ctx: Context;
    private readonly sess: Session;
    private readonly queue: Queue;

    constructor(_ctx: Context, _sess: Session, _queue: Queue) {
        this.ctx = _ctx;
        this.sess = _sess;
        this.queue = _queue;
    }

    async startListening() {
        if (this.processes.size === this.ctx.config.processNumber) return;
        else if (this.processes.size > this.ctx.config.processNumber) throw new Error('处理队伍过长！');

        const task = this.queue.next();
        this.processes.set(task.value, this.runTasks(task));

        while (this.processes.size > 0) {
            try {
                const result = await Promise.race(this.processes.values());

                this.queue.deQueue(result)
                this.processes.delete(result);

                const task = this.queue.next();
                if (task) this.processes.set(task.value, this.runTasks(task));
            } catch (e) {
                this.queue.cleanAll();
                this.processes.clear();
                this.ctx.logger.error(`错误发生了：${e.message}，清空当前队列！`);
                this.sess.send(`错误发生了：${e.message}，清空当前队列！`);
                throw e;
            }
        }
    }

    private async runTasks(task: QueueElement): Promise<string> {
        if (await this.checkFromDB(task.type, task.value)) return task.value;

        let buffer: Buffer;
        let singleID: string;
        let textContent: string;

        if (task.type === cmdType.Event) {
            const resVN = await (new Request(this.ctx, {
                type: cmdType.Event,
                value: task.value,
                running: task.running,
                field: task.field[0],
                filters: task.filters[0]
            })).request();
            const resCha = await (new Request(this.ctx, {
                type: cmdType.Event,
                value: task.value,
                running: task.running,
                field: task.field[1],
                filters: task.filters[1]
            })).request();

            const html = new HtmlImage();
            html.createEventTitle(task.value);
            const content = await ResponseHandler.handleEvent(this.ctx, resVN['results'], resCha['results']);
            if (this.ctx.config.backgroundPath) html.changeBg(path.join(this.ctx.baseDir, this.ctx.config.backgroundPath));
            html.setContent(content);
            const source = html.build();
            buffer = await this.renderAndShot(source);

        } else {
            const res = await (new Request(this.ctx, task)).request();

            if (res['results'].length === 0) {
                this.sess.send(`关键词「${task.value}」不存在，切换简繁体或者更换别名可能解决问题。`);
                return task.value;
            }

            singleID = res['results'].length === 1 ? res['results'][0]['id'] : '';

            const output = this.ctx.config.outputContent;
            for (let index = 0; index < output.length; index++) {
                if (output[index] === '以文本形式发送（最多三条）') {
                    const cmdArr: Array<string> = [];
                    for (let index = 0; index < res['results'].length && index < 3; index++) {
                        let body: string;
                        if (task.type === cmdType.VN) {
                            body = await ResponseHandler.handleVN(this.ctx, res['results'][index]);
                        } else if (task.type === cmdType.Character) {
                            body = await ResponseHandler.handleCharacter(this.ctx, res['results'][index], this.ctx.config.characterOptions);
                        } else if (task.type === cmdType.Producer) {
                            const exBody = await new Request(this.ctx, {
                                type: cmdType.VN,
                                value: '',
                                running: false,
                                filters: ['developer', '=', ['id', '=', res['results'][index]["id"]]]
                            }).request();
                            body = await ResponseHandler.handleProducer(this.ctx, res['results'][index], exBody['results']);
                        }
                        cmdArr.push(`<message>${body}</message>`);
                    }


                    if (this.ctx.config.isMerge) textContent = `<message forward>${cmdArr.join('')}</message>`;
                    else textContent = cmdArr.join('');
                    this.sess.send(textContent);

                } else if (output[index] === '以图片方式发送') {
                    const cmdArr = new Array<string>();
                    let type: cmdType;
                    for (let index = 0; index < res['results'].length; index++) {
                        let body: string;
                        if (task.type === cmdType.VN) {
                            body = await ResponseHandler.handleVN(this.ctx, res['results'][index], true);
                            type = cmdType.VN;
                        } else if (task.type === cmdType.Character) {
                            body = await ResponseHandler.handleCharacter(this.ctx, res['results'][index], this.ctx.config.characterOptions, true);
                        } else if (task.type === cmdType.Producer) {
                            const exBody = await new Request(this.ctx, {
                                type: cmdType.VN,
                                value: '',
                                running: false,
                                filters: ['developer', '=', ['id', '=', res['results'][index]["id"]]]
                            }).request();
                            body = await ResponseHandler.handleProducer(this.ctx, res['results'][index], exBody['results'], true);
                        }
                        cmdArr.push(body);
                    }

                    const html = new HtmlImage();
                    if (this.ctx.config.backgroundPath) html.changeBg(path.join(this.ctx.baseDir, this.ctx.config.backgroundPath));
                    html.setContent(cmdArr);
                    const source = html.build();
                    buffer = await this.renderAndShot(source);

                } else throw new Error('发送内容配置错误！');
            }
        }

        const fileName = (await DB.insert(this.ctx, task.type, task.value, singleID, textContent)).id;
        fs.writeFile(path.join(__dirname, `cache/buffer/${fileName}.bin`), buffer, (err) => {
            if (err) throw new Error('写入文件错误！')
        });

        return task.value;
    }

    async checkFromDB(type: cmdType, keyword: string, id?: string): Promise<boolean> {
        const dataDB = await DB.select(this.ctx, type, keyword, id ?? '');
        if (dataDB) {
            if (this.ctx.config.outputContent.includes('以图片方式发送')) {
                const bufferFile = path.join(__dirname, `cache/buffer/${dataDB.id}.bin`)
                if (fs.existsSync(bufferFile)) {
                    const img = fs.readFileSync(bufferFile);
                    this.sess.send(h.image(img, 'image/png'));
                } else throw new Error("数据库未记录img信息！");
            }
            if (this.ctx.config.outputContent.includes('以文本形式发送（最多三条）')) {
                if (dataDB.textData) this.sess.send(dataDB.textData);
            }

            this.ctx.logger.success('数据库中有当前关键字的记录，将调用数据库中的结果。');
            return true;
        }
        else return false;
    }

    async renderAndShot(source: string): Promise<Buffer> {
        try {
            const page = await this.ctx.puppeteer.page();

            await page.setViewport({ width: 900, height: 600 });

            await page.setContent(source, {
                waitUntil: 'domcontentloaded'
            });

            const buffer = await page.screenshot({
                type: 'jpeg',
                quality: 100,
                fullPage: true,
                encoding: 'binary',
                optimizeForSpeed: true
            });

            this.sess.send(h.image(buffer, 'image/jpg'));
            return buffer;
        } catch (e) {
            this.ctx.logger.error("图片渲染失败：" + e);
            this.sess.send('图片渲染失败！');
        }
    }
}

export default ProcessManager;